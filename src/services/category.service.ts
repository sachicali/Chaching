/**
 * Category Service for Chaching Financial Management Platform
 * 
 * Provides comprehensive category management for expense categorization system.
 * Handles CRUD operations, auto-categorization, and analytics with user-scoped data access.
 * 
 * User Story: US-008 (Expense Categorization - 3 points)
 * Dependencies: Firebase Firestore, transaction service integration
 * Architecture: Service layer pattern with machine learning categorization
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  getUserRef,
  getCurrentTimestamp,
  createDocumentId
} from '@/lib/firestore-schema';
import type { 
  TransactionType,
  CurrencyCode
} from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
  parentCategoryId?: string; // For hierarchical categories
  sortOrder: number;
  usageCount: number;
  totalAmount: number; // Total amount of transactions in this category
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryCreateData {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  description?: string;
  parentCategoryId?: string;
  sortOrder?: number;
}

export interface CategoryUpdateData extends Partial<CategoryCreateData> {
  id: string;
  isActive?: boolean;
}

export interface CategoryServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CategoryListResult {
  success: boolean;
  categories: Category[];
  error?: string;
}

export interface CategoryAnalytics {
  totalCategories: number;
  activeCategories: number;
  mostUsedCategory: Category | null;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrends: CategoryTrendItem[];
}

export interface CategoryBreakdownItem {
  category: Category;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
  averageAmount: number;
}

export interface CategoryTrendItem {
  month: string;
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  totalAmount: number;
}

export interface AutoCategorizationRule {
  id: string;
  userId: string;
  categoryId: string;
  keywords: string[];
  merchantPatterns: string[];
  amountRanges?: { min: number; max: number }[];
  confidence: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AutoCategorizationSuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
  matchedKeywords?: string[];
  matchedPatterns?: string[];
}

// ============================================================================
// DEFAULT CATEGORIES
// ============================================================================

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Project Payment', color: '#10B981', icon: 'briefcase', description: 'Client project payments' },
  { name: 'Retainer Fee', color: '#059669', icon: 'refresh-cw', description: 'Monthly retainer payments' },
  { name: 'Consultation', color: '#047857', icon: 'users', description: 'Consultation fees' },
  { name: 'Royalties', color: '#065F46', icon: 'award', description: 'Royalty payments' },
  { name: 'Bonus Payment', color: '#064E3B', icon: 'gift', description: 'Performance bonuses' },
  { name: 'Other Income', color: '#1F2937', icon: 'plus-circle', description: 'Miscellaneous income' }
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Office Supplies', color: '#3B82F6', icon: 'package', description: 'Office supplies and stationery' },
  { name: 'Software & Tools', color: '#1D4ED8', icon: 'monitor', description: 'Software subscriptions and tools' },
  { name: 'Equipment', color: '#1E40AF', icon: 'laptop', description: 'Computer equipment and hardware' },
  { name: 'Internet & Phone', color: '#1E3A8A', icon: 'wifi', description: 'Internet and communication costs' },
  { name: 'Marketing', color: '#F59E0B', icon: 'megaphone', description: 'Marketing and advertising expenses' },
  { name: 'Professional Services', color: '#D97706', icon: 'user-check', description: 'Accounting, legal, consulting' },
  { name: 'Travel', color: '#DC2626', icon: 'plane', description: 'Business travel expenses' },
  { name: 'Meals & Entertainment', color: '#B91C1C', icon: 'coffee', description: 'Business meals and entertainment' },
  { name: 'Training & Education', color: '#7C3AED', icon: 'book-open', description: 'Professional development' },
  { name: 'Insurance', color: '#059669', icon: 'shield', description: 'Business insurance premiums' },
  { name: 'Rent & Utilities', color: '#0D9488', icon: 'home', description: 'Office rent and utilities' },
  { name: 'Bank Fees', color: '#6B7280', icon: 'credit-card', description: 'Banking and transaction fees' },
  { name: 'Other Expenses', color: '#374151', icon: 'more-horizontal', description: 'Miscellaneous business expenses' }
];

// ============================================================================
// CATEGORY SERVICE CLASS
// ============================================================================

class CategoryService {
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Initialize default categories for a new user
   */
  async initializeDefaultCategories(userId: string): Promise<CategoryServiceResult<Category[]>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const batch = writeBatch(db);
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const createdCategories: Category[] = [];

      let sortOrder = 1;
      const timestamp = getCurrentTimestamp();

      // Create income categories
      for (const categoryData of DEFAULT_INCOME_CATEGORIES) {
        const docRef = doc(categoriesRef);
        const category: Omit<Category, 'id'> = {
          userId,
          name: categoryData.name,
          type: 'income',
          color: categoryData.color,
          icon: categoryData.icon,
          description: categoryData.description,
          isDefault: true,
          sortOrder: sortOrder++,
          usageCount: 0,
          totalAmount: 0,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        batch.set(docRef, category);
        createdCategories.push({ id: docRef.id, ...category });
      }

      // Create expense categories
      for (const categoryData of DEFAULT_EXPENSE_CATEGORIES) {
        const docRef = doc(categoriesRef);
        const category: Omit<Category, 'id'> = {
          userId,
          name: categoryData.name,
          type: 'expense',
          color: categoryData.color,
          icon: categoryData.icon,
          description: categoryData.description,
          isDefault: true,
          sortOrder: sortOrder++,
          usageCount: 0,
          totalAmount: 0,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        batch.set(docRef, category);
        createdCategories.push({ id: docRef.id, ...category });
      }

      await batch.commit();

      return { success: true, data: createdCategories };

    } catch (error) {
      console.error('Error initializing default categories:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Create a new category
   */
  async createCategory(userId: string, categoryData: CategoryCreateData): Promise<CategoryServiceResult<Category>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Validate required fields
      if (!categoryData.name?.trim()) {
        return { success: false, error: 'Category name is required' };
      }

      if (!this.isValidTransactionType(categoryData.type)) {
        return { success: false, error: 'Invalid category type' };
      }

      if (!categoryData.color?.trim()) {
        return { success: false, error: 'Category color is required' };
      }

      if (!categoryData.icon?.trim()) {
        return { success: false, error: 'Category icon is required' };
      }

      const timestamp = getCurrentTimestamp();
      const categoriesRef = collection(db, 'users', userId, 'categories');

      // Get next sort order
      const sortOrder = categoryData.sortOrder || await this.getNextSortOrder(userId, categoryData.type);

      const firestoreData: Omit<Category, 'id'> = {
        userId,
        name: categoryData.name.trim(),
        type: categoryData.type,
        color: categoryData.color.trim(),
        icon: categoryData.icon.trim(),
        description: categoryData.description?.trim(),
        isDefault: false,
        parentCategoryId: categoryData.parentCategoryId,
        sortOrder,
        usageCount: 0,
        totalAmount: 0,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await addDoc(categoriesRef, firestoreData);
      
      const newCategory: Category = {
        id: docRef.id,
        ...firestoreData
      };

      return { success: true, data: newCategory };

    } catch (error) {
      console.error('Error creating category:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get all categories for a user
   */
  async getCategories(userId: string, type?: TransactionType): Promise<CategoryListResult> {
    try {
      if (!userId) {
        return { success: false, categories: [], error: 'User ID is required' };
      }

      const categoriesRef = collection(db, 'users', userId, 'categories');
      let categoryQuery = query(
        categoriesRef,
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );

      if (type) {
        categoryQuery = query(
          categoriesRef,
          where('isActive', '==', true),
          where('type', '==', type),
          orderBy('sortOrder', 'asc')
        );
      }

      const querySnapshot = await getDocs(categoryQuery);
      const categories: Category[] = [];

      querySnapshot.forEach((doc) => {
        const categoryData = doc.data() as Omit<Category, 'id'>;
        categories.push({
          id: doc.id,
          ...categoryData
        });
      });

      return { success: true, categories };

    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        success: false, 
        categories: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get a specific category by ID
   */
  async getCategory(userId: string, categoryId: string): Promise<CategoryServiceResult<Category>> {
    try {
      if (!userId || !categoryId) {
        return { success: false, error: 'User ID and Category ID are required' };
      }

      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (!categorySnap.exists()) {
        return { success: false, error: 'Category not found' };
      }

      const category: Category = {
        id: categorySnap.id,
        ...categorySnap.data()
      } as Category;

      return { success: true, data: category };

    } catch (error) {
      console.error('Error fetching category:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(userId: string, categoryData: CategoryUpdateData): Promise<CategoryServiceResult<Category>> {
    try {
      if (!userId || !categoryData.id) {
        return { success: false, error: 'User ID and Category ID are required' };
      }

      // Validate data if provided
      if (categoryData.name !== undefined && !categoryData.name.trim()) {
        return { success: false, error: 'Category name cannot be empty' };
      }

      if (categoryData.type && !this.isValidTransactionType(categoryData.type)) {
        return { success: false, error: 'Invalid category type' };
      }

      const categoryRef = doc(db, 'users', userId, 'categories', categoryData.id);
      
      // Check if category exists
      const categorySnap = await getDoc(categoryRef);
      if (!categorySnap.exists()) {
        return { success: false, error: 'Category not found' };
      }

      // Prepare update data
      const updateData: Partial<Category> = {
        updatedAt: getCurrentTimestamp()
      };

      // Only include changed fields
      if (categoryData.name !== undefined) updateData.name = categoryData.name.trim();
      if (categoryData.type !== undefined) updateData.type = categoryData.type;
      if (categoryData.color !== undefined) updateData.color = categoryData.color.trim();
      if (categoryData.icon !== undefined) updateData.icon = categoryData.icon.trim();
      if (categoryData.description !== undefined) updateData.description = categoryData.description?.trim();
      if (categoryData.parentCategoryId !== undefined) updateData.parentCategoryId = categoryData.parentCategoryId;
      if (categoryData.sortOrder !== undefined) updateData.sortOrder = categoryData.sortOrder;
      if (categoryData.isActive !== undefined) updateData.isActive = categoryData.isActive;

      await updateDoc(categoryRef, updateData);

      // Fetch updated category
      const updatedSnap = await getDoc(categoryRef);
      const updatedCategory: Category = {
        id: updatedSnap.id,
        ...updatedSnap.data()
      } as Category;

      return { success: true, data: updatedCategory };

    } catch (error) {
      console.error('Error updating category:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Delete a category (soft delete by setting isActive to false)
   */
  async deleteCategory(userId: string, categoryId: string): Promise<CategoryServiceResult<void>> {
    try {
      if (!userId || !categoryId) {
        return { success: false, error: 'User ID and Category ID are required' };
      }

      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
      
      // Check if category exists
      const categorySnap = await getDoc(categoryRef);
      if (!categorySnap.exists()) {
        return { success: false, error: 'Category not found' };
      }

      const categoryData = categorySnap.data() as Category;

      // Don't allow deletion of default categories with transactions
      if (categoryData.isDefault && categoryData.usageCount > 0) {
        return { 
          success: false, 
          error: 'Cannot delete default category with existing transactions. Please assign transactions to another category first.' 
        };
      }

      // Soft delete by setting isActive to false
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: getCurrentTimestamp()
      });

      return { success: true };

    } catch (error) {
      console.error('Error deleting category:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Auto-categorize a transaction based on description and amount
   */
  async suggestCategory(
    userId: string, 
    description: string, 
    amount: number, 
    type: TransactionType
  ): Promise<CategoryServiceResult<AutoCategorizationSuggestion[]>> {
    try {
      if (!userId || !description?.trim()) {
        return { success: false, error: 'User ID and description are required' };
      }

      // Get user's categories
      const categoriesResult = await this.getCategories(userId, type);
      if (!categoriesResult.success) {
        return { success: false, error: categoriesResult.error };
      }

      const categories = categoriesResult.categories;
      const suggestions: AutoCategorizationSuggestion[] = [];

      const descriptionLower = description.toLowerCase();
      const words = descriptionLower.split(/\s+/);

      // Simple keyword-based categorization
      for (const category of categories) {
        let confidence = 0;
        const matchedKeywords: string[] = [];
        const categoryKeywords = this.getCategoryKeywords(category.name);

        // Check for keyword matches
        for (const keyword of categoryKeywords) {
          if (descriptionLower.includes(keyword.toLowerCase())) {
            confidence += 0.3;
            matchedKeywords.push(keyword);
          }
        }

        // Check for partial matches in words
        for (const word of words) {
          for (const keyword of categoryKeywords) {
            if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
              confidence += 0.1;
            }
          }
        }

        // Boost confidence for frequently used categories
        if (category.usageCount > 10) {
          confidence += 0.1;
        } else if (category.usageCount > 5) {
          confidence += 0.05;
        }

        // Add suggestion if confidence is above threshold
        if (confidence > 0.2) {
          suggestions.push({
            categoryId: category.id,
            categoryName: category.name,
            confidence: Math.min(confidence, 1.0),
            reason: matchedKeywords.length > 0 
              ? `Matched keywords: ${matchedKeywords.join(', ')}`
              : 'Partial text match',
            matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : undefined
          });
        }
      }

      // Sort by confidence descending
      suggestions.sort((a, b) => b.confidence - a.confidence);

      // Return top 3 suggestions
      return { success: true, data: suggestions.slice(0, 3) };

    } catch (error) {
      console.error('Error suggesting category:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Update category usage statistics when a transaction is categorized
   */
  async updateCategoryUsage(userId: string, categoryId: string, amount: number): Promise<CategoryServiceResult<void>> {
    try {
      if (!userId || !categoryId) {
        return { success: false, error: 'User ID and Category ID are required' };
      }

      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (!categorySnap.exists()) {
        return { success: false, error: 'Category not found' };
      }

      const categoryData = categorySnap.data() as Category;
      
      await updateDoc(categoryRef, {
        usageCount: categoryData.usageCount + 1,
        totalAmount: categoryData.totalAmount + Math.abs(amount),
        updatedAt: getCurrentTimestamp()
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating category usage:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get category analytics and statistics
   */
  async getCategoryAnalytics(userId: string, type?: TransactionType): Promise<CategoryServiceResult<CategoryAnalytics>> {
    try {
      const categoriesResult = await this.getCategories(userId, type);
      if (!categoriesResult.success) {
        return { success: false, error: categoriesResult.error };
      }

      const categories = categoriesResult.categories;
      const activeCategories = categories.filter(c => c.isActive);
      
      // Find most used category
      const mostUsedCategory = categories.reduce((prev, current) => 
        (current.usageCount > prev.usageCount) ? current : prev
      );

      // Calculate breakdown
      const totalAmount = categories.reduce((sum, c) => sum + c.totalAmount, 0);
      const categoryBreakdown: CategoryBreakdownItem[] = categories.map(category => ({
        category,
        transactionCount: category.usageCount,
        totalAmount: category.totalAmount,
        percentage: totalAmount > 0 ? (category.totalAmount / totalAmount) * 100 : 0,
        averageAmount: category.usageCount > 0 ? category.totalAmount / category.usageCount : 0
      }));

      // Sort by total amount descending
      categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);

      const analytics: CategoryAnalytics = {
        totalCategories: categories.length,
        activeCategories: activeCategories.length,
        mostUsedCategory: mostUsedCategory.usageCount > 0 ? mostUsedCategory : null,
        categoryBreakdown,
        monthlyTrends: [] // TODO: Implement monthly trends if needed
      };

      return { success: true, data: analytics };

    } catch (error) {
      console.error('Error getting category analytics:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Subscribe to real-time category updates
   */
  subscribeToCategories(
    userId: string,
    callback: (categories: Category[]) => void,
    type?: TransactionType,
    onError?: (error: string) => void
  ): Unsubscribe {
    if (!userId) {
      onError?.('User ID is required');
      return () => {};
    }

    const categoriesRef = collection(db, 'users', userId, 'categories');
    let categoryQuery = query(
      categoriesRef,
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );

    if (type) {
      categoryQuery = query(
        categoriesRef,
        where('isActive', '==', true),
        where('type', '==', type),
        orderBy('sortOrder', 'asc')
      );
    }

    const unsubscribe = onSnapshot(
      categoryQuery,
      (querySnapshot) => {
        const categories: Category[] = [];
        querySnapshot.forEach((doc) => {
          const categoryData = doc.data() as Omit<Category, 'id'>;
          categories.push({
            id: doc.id,
            ...categoryData
          });
        });

        callback(categories);
      },
      (error) => {
        console.error('Error in categories subscription:', error);
        onError?.(this.handleFirestoreError(error));
      }
    );

    // Store subscription for cleanup
    this.activeSubscriptions.set(`${userId}-${type || 'all'}`, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Cleanup all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get next sort order for a category type
   */
  private async getNextSortOrder(userId: string, type: TransactionType): Promise<number> {
    try {
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const categoryQuery = query(
        categoriesRef,
        where('type', '==', type),
        orderBy('sortOrder', 'desc')
      );

      const querySnapshot = await getDocs(categoryQuery);
      if (querySnapshot.empty) {
        return 1;
      }

      const lastCategory = querySnapshot.docs[0].data() as Category;
      return lastCategory.sortOrder + 1;

    } catch (error) {
      console.error('Error getting next sort order:', error);
      return 1;
    }
  }

  /**
   * Get keywords for category matching
   */
  private getCategoryKeywords(categoryName: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'Office Supplies': ['office', 'supplies', 'stationery', 'paper', 'pen', 'pencil'],
      'Software & Tools': ['software', 'app', 'tool', 'subscription', 'license', 'adobe', 'microsoft'],
      'Equipment': ['equipment', 'laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'hardware'],
      'Internet & Phone': ['internet', 'phone', 'wifi', 'broadband', 'telecom', 'mobile'],
      'Marketing': ['marketing', 'advertising', 'ads', 'promotion', 'facebook', 'google', 'instagram'],
      'Professional Services': ['accounting', 'legal', 'consulting', 'lawyer', 'accountant', 'consultant'],
      'Travel': ['travel', 'flight', 'hotel', 'taxi', 'uber', 'grab', 'transportation'],
      'Meals & Entertainment': ['food', 'restaurant', 'coffee', 'lunch', 'dinner', 'meal'],
      'Training & Education': ['training', 'education', 'course', 'learning', 'book', 'workshop'],
      'Insurance': ['insurance', 'premium', 'coverage', 'policy'],
      'Rent & Utilities': ['rent', 'utilities', 'electricity', 'water', 'gas', 'office'],
      'Bank Fees': ['bank', 'fee', 'charge', 'transfer', 'atm'],
      'Project Payment': ['project', 'payment', 'invoice', 'client'],
      'Retainer Fee': ['retainer', 'monthly', 'recurring'],
      'Consultation': ['consultation', 'consulting', 'advice', 'meeting']
    };

    return keywordMap[categoryName] || [categoryName.toLowerCase()];
  }

  /**
   * Validate transaction type
   */
  private isValidTransactionType(type: string): type is TransactionType {
    return ['income', 'expense'].includes(type);
  }

  /**
   * Handle Firestore errors with user-friendly messages
   */
  private handleFirestoreError(error: unknown): string {
    if (error instanceof Error) {
      const errorCode = (error as any).code;
      
      switch (errorCode) {
        case 'permission-denied':
          return 'You do not have permission to perform this action';
        case 'not-found':
          return 'The requested category was not found';
        case 'already-exists':
          return 'A category with this name already exists';
        case 'resource-exhausted':
          return 'Request limit exceeded. Please try again later';
        case 'unauthenticated':
          return 'Authentication required. Please sign in again';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again';
        case 'deadline-exceeded':
          return 'Request timed out. Please try again';
        default:
          console.error('Firestore error:', error);
          return 'An unexpected error occurred. Please try again';
      }
    }

    console.error('Unknown error:', error);
    return 'An unknown error occurred. Please try again';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const categoryService = new CategoryService();

/**
 * Usage Examples:
 * 
 * // Initialize default categories for new user
 * const result = await categoryService.initializeDefaultCategories(userId);
 * 
 * // Create custom category
 * const categoryResult = await categoryService.createCategory(userId, {
 *   name: 'Custom Software',
 *   type: 'expense',
 *   color: '#3B82F6',
 *   icon: 'code',
 *   description: 'Custom software development tools'
 * });
 * 
 * // Get auto-categorization suggestions
 * const suggestions = await categoryService.suggestCategory(
 *   userId, 
 *   'Adobe Creative Suite subscription', 
 *   50, 
 *   'expense'
 * );
 * 
 * // Subscribe to real-time category updates
 * const unsubscribe = categoryService.subscribeToCategories(
 *   userId,
 *   (categories) => setCategories(categories),
 *   'expense',
 *   (error) => console.error('Category subscription error:', error)
 * );
 */