/**
 * AI Categorization Service - Smart Transaction Categorization
 * 
 * Integrates AI-powered transaction categorization with the existing transaction system.
 * Provides automatic category suggestions, learns from user corrections, and maintains
 * categorization accuracy over time.
 * 
 * Features:
 * - Automatic transaction categorization using AI
 * - Learning from user feedback and corrections
 * - Integration with existing category system
 * - Confidence-based suggestions
 * - Filipino freelancer context awareness
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { categorizeTransaction, type CategorizeTransactionInput, type CategorizeTransactionOutput } from '@/ai/flows/categorize-transaction';
import type { Transaction, TransactionType } from '@/types/database.types';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
  alternativeCategories: string[];
  isNewCategory: boolean;
}

export interface UserFeedback {
  transactionId: string;
  suggestedCategory: string;
  chosenCategory: string;
  confidence: number;
  timestamp: Timestamp;
}

export class AICategorizationService {
  private readonly COLLECTIONS = {
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    CATEGORIZATION_FEEDBACK: 'categorizationFeedback'
  } as const;
  
  // Helper method to get the correct user-scoped collection path
  private getUserCollection(collectionName: string): string {
    return `users/${this.userId}/${collectionName}`;
  }

  constructor(private userId: string) {}

  // ==================== MAIN CATEGORIZATION METHODS ====================

  /**
   * Get AI-powered category suggestion for a transaction
   */
  async suggestCategory(
    description: string,
    amount: number,
    type: TransactionType,
    vendor?: string
  ): Promise<CategorySuggestion> {
    try {
      const [existingCategories, userHistory] = await Promise.all([
        this.getExistingCategories(),
        this.getSimilarTransactionHistory(description, type)
      ]);

      const input: CategorizeTransactionInput = {
        description,
        amount,
        type,
        vendor,
        existingCategories,
        userHistory: JSON.stringify(userHistory)
      };

      const result = await categorizeTransaction(input);

      return {
        category: result.category,
        confidence: result.confidence,
        reason: result.reason,
        alternativeCategories: result.alternativeCategories,
        isNewCategory: result.isNewCategory
      };

    } catch (error) {
      console.error('Error suggesting category:', error);
      throw new Error('Failed to suggest category');
    }
  }

  /**
   * Automatically categorize a transaction and return the best suggestion
   */
  async autoCategorizeTransaction(
    description: string,
    amount: number,
    type: TransactionType,
    vendor?: string,
    confidenceThreshold: number = 0.8
  ): Promise<{ category: string; wasAutomatic: boolean; confidence: number }> {
    try {
      const suggestion = await this.suggestCategory(description, amount, type, vendor);

      // Only auto-apply if confidence is high enough
      if (suggestion.confidence >= confidenceThreshold) {
        return {
          category: suggestion.category,
          wasAutomatic: true,
          confidence: suggestion.confidence
        };
      }

      // Return suggestion but don't auto-apply
      return {
        category: suggestion.category,
        wasAutomatic: false,
        confidence: suggestion.confidence
      };

    } catch (error) {
      console.error('Error auto-categorizing transaction:', error);
      
      // Fallback to basic categorization
      return {
        category: this.getBasicCategory(description, type),
        wasAutomatic: false,
        confidence: 0.3
      };
    }
  }

  /**
   * Record user feedback when they accept/reject a category suggestion
   */
  async recordCategoryFeedback(
    transactionId: string,
    suggestedCategory: string,
    chosenCategory: string,
    confidence: number
  ): Promise<void> {
    try {
      const feedback: Omit<UserFeedback, 'id'> = {
        transactionId,
        suggestedCategory,
        chosenCategory,
        confidence,
        timestamp: Timestamp.now()
      };

      await addDoc(
        collection(db, `users/${this.userId}/${this.COLLECTIONS.CATEGORIZATION_FEEDBACK}`),
        feedback
      );

      // Update our learning model based on feedback
      await this.updateCategorizationAccuracy(suggestedCategory, chosenCategory, confidence);

    } catch (error) {
      console.error('Error recording category feedback:', error);
      // Don't throw here as this is for learning purposes
    }
  }

  /**
   * Bulk categorize multiple transactions
   */
  async bulkCategorizeTransactions(
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      type: TransactionType;
      vendor?: string;
    }>,
    confidenceThreshold: number = 0.7
  ): Promise<Array<{
    transactionId: string;
    category: string;
    confidence: number;
    wasAutomatic: boolean;
  }>> {
    try {
      const results = [];

      for (const transaction of transactions) {
        const categorization = await this.autoCategorizeTransaction(
          transaction.description,
          transaction.amount,
          transaction.type,
          transaction.vendor,
          confidenceThreshold
        );

        results.push({
          transactionId: transaction.id,
          category: categorization.category,
          confidence: categorization.confidence,
          wasAutomatic: categorization.wasAutomatic
        });

        // Small delay to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;

    } catch (error) {
      console.error('Error bulk categorizing transactions:', error);
      throw new Error('Failed to bulk categorize transactions');
    }
  }

  // ==================== DATA RETRIEVAL METHODS ====================

  /**
   * Get existing categories used by the user
   */
  private async getExistingCategories(): Promise<string[]> {
    try {
      // First try to get categories from the categories collection
      const categoriesQuery = query(
        collection(db, this.getUserCollection(this.COLLECTIONS.CATEGORIES))
      );

      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      if (categoriesSnapshot.size > 0) {
        return categoriesSnapshot.docs.map(doc => doc.data().name);
      }

      // Fallback: extract unique categories from existing transactions
      const transactionsQuery = query(
        collection(db, this.getUserCollection(this.COLLECTIONS.TRANSACTIONS))
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const categories = new Set<string>();

      transactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data() as Transaction;
        if (transaction.category) {
          categories.add(transaction.category);
        }
      });

      return Array.from(categories);

    } catch (error) {
      console.error('Error getting existing categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Get similar transaction history for AI learning
   */
  private async getSimilarTransactionHistory(
    description: string,
    type: TransactionType,
    limitCount: number = 5
  ): Promise<Array<{ description: string; category: string; amount: number }>> {
    try {
      const q = query(
        collection(db, this.getUserCollection(this.COLLECTIONS.TRANSACTIONS)),
        where('type', '==', type),
        orderBy('date', 'desc'),
        limit(50) // Get more transactions to find similar ones
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Transaction[];

      // Simple similarity matching based on description keywords
      const keywords = description.toLowerCase().split(' ').filter(word => word.length > 2);
      
      const similarTransactions = transactions
        .filter(t => {
          if (!t.category) return false;
          const tDesc = t.description.toLowerCase();
          return keywords.some(keyword => tDesc.includes(keyword));
        })
        .slice(0, limitCount)
        .map(t => ({
          description: t.description,
          category: t.category,
          amount: t.amountPHP || t.phpEquivalent || 0
        }));

      return similarTransactions;

    } catch (error) {
      console.error('Error getting similar transaction history:', error);
      return [];
    }
  }

  // ==================== LEARNING AND IMPROVEMENT METHODS ====================

  /**
   * Update categorization accuracy based on user feedback
   */
  private async updateCategorizationAccuracy(
    suggestedCategory: string,
    chosenCategory: string,
    confidence: number
  ): Promise<void> {
    try {
      // This is where we would update our learning model
      // For now, we'll log the feedback for future model training
      console.log('Categorization feedback:', {
        suggested: suggestedCategory,
        chosen: chosenCategory,
        wasCorrect: suggestedCategory === chosenCategory,
        confidence
      });

      // In a full implementation, we would:
      // 1. Store this feedback in a learning database
      // 2. Retrain our categorization model periodically
      // 3. Adjust confidence thresholds based on accuracy

    } catch (error) {
      console.error('Error updating categorization accuracy:', error);
    }
  }

  /**
   * Get categorization performance metrics
   */
  async getCategorizationMetrics(): Promise<{
    totalSuggestions: number;
    acceptedSuggestions: number;
    accuracy: number;
    averageConfidence: number;
  }> {
    try {
      const q = query(
        collection(db, `users/${this.userId}/${this.COLLECTIONS.CATEGORIZATION_FEEDBACK}`),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const feedback = querySnapshot.docs.map(doc => doc.data() as UserFeedback);

      if (feedback.length === 0) {
        return {
          totalSuggestions: 0,
          acceptedSuggestions: 0,
          accuracy: 0,
          averageConfidence: 0
        };
      }

      const acceptedSuggestions = feedback.filter(f => 
        f.suggestedCategory === f.chosenCategory
      ).length;

      const totalConfidence = feedback.reduce((sum, f) => sum + f.confidence, 0);

      return {
        totalSuggestions: feedback.length,
        acceptedSuggestions,
        accuracy: acceptedSuggestions / feedback.length,
        averageConfidence: totalConfidence / feedback.length
      };

    } catch (error) {
      console.error('Error getting categorization metrics:', error);
      return {
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        accuracy: 0,
        averageConfidence: 0
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get basic category fallback when AI fails
   */
  private getBasicCategory(description: string, type: TransactionType): string {
    const desc = description.toLowerCase();

    if (type === 'income') {
      if (desc.includes('client') || desc.includes('payment')) return 'Client Payment';
      if (desc.includes('freelance')) return 'Freelance Income';
      return 'Other Income';
    }

    // Basic expense categorization
    if (desc.includes('grab') || desc.includes('uber') || desc.includes('transport')) return 'Transportation';
    if (desc.includes('gcash') || desc.includes('bank')) return 'Bank Charges';
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('jollibee')) return 'Food & Dining';
    if (desc.includes('internet') || desc.includes('pldt') || desc.includes('globe')) return 'Internet & Utilities';
    if (desc.includes('office') || desc.includes('supplies')) return 'Office Supplies';
    
    return 'Uncategorized';
  }

  /**
   * Get default categories for Filipino freelancers
   */
  private getDefaultCategories(): string[] {
    return [
      // Income categories
      'Client Payment',
      'Freelance Income',
      'Consulting Fee',
      'Project Payment',
      'Other Income',
      
      // Expense categories
      'Software Subscriptions',
      'Internet & Utilities',
      'Office Supplies',
      'Marketing',
      'Professional Development',
      'Food & Dining',
      'Transportation',
      'Home Office',
      'Business Travel',
      'Taxes & Fees',
      'Bank Charges',
      'Equipment',
      'Uncategorized'
    ];
  }

  /**
   * Migrate uncategorized transactions by suggesting categories
   */
  async migrateUncategorizedTransactions(batchSize: number = 10): Promise<{
    processed: number;
    categorized: number;
    errors: number;
  }> {
    try {
      const q = query(
        collection(db, this.getUserCollection(this.COLLECTIONS.TRANSACTIONS)),
        where('category', 'in', ['', 'Uncategorized', null]),
        limit(batchSize)
      );

      const querySnapshot = await getDocs(q);
      const uncategorizedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      let processed = 0;
      let categorized = 0;
      let errors = 0;

      for (const transaction of uncategorizedTransactions) {
        try {
          const suggestion = await this.suggestCategory(
            transaction.description,
            transaction.amountPHP || transaction.phpEquivalent || 0,
            transaction.type,
            transaction.vendor
          );

          // Only apply if confidence is reasonable
          if (suggestion.confidence > 0.6) {
            await updateDoc(
              doc(db, this.getUserCollection(this.COLLECTIONS.TRANSACTIONS), transaction.id),
              { 
                category: suggestion.category,
                updatedAt: Timestamp.now()
              }
            );
            categorized++;
          }

          processed++;

        } catch (error) {
          console.error(`Error categorizing transaction ${transaction.id}:`, error);
          errors++;
        }
      }

      return { processed, categorized, errors };

    } catch (error) {
      console.error('Error migrating uncategorized transactions:', error);
      throw new Error('Failed to migrate uncategorized transactions');
    }
  }
}

// ==================== EXPORT ====================

export default AICategorizationService;

// Export types
export type {
  CategorySuggestion,
  UserFeedback
};