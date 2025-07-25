/**
 * AI Data Service - AI Integration Layer
 * 
 * Connects Firestore financial data to AI flows for intelligent insights.
 * Transforms transaction data into AI-compatible formats and aggregates
 * data for financial analysis, predictions, and anomaly detection.
 * 
 * Features:
 * - Real-time data extraction from Firestore
 * - Data transformation for AI processing
 * - Aggregation and categorization of financial patterns
 * - Integration with existing AI flows
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Transaction,
  Client,
  TransactionType,
  CurrencyCode
} from '@/types/database.types';
import type { FinancialInsightsInput } from '@/ai/flows/generate-financial-insights';
import type { PredictIncomeInput } from '@/ai/flows/predict-income';
import type { DetectSpendingAnomaliesInput } from '@/ai/flows/detect-spending-anomalies';
import type { GenerateWeeklySummaryInput } from '@/ai/flows/generate-weekly-summary';

export interface AIDataAggregation {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  spendingByCategory: Record<string, number>;
  recurringExpenses: Record<string, number>;
  transactionCount: number;
  averageTransactionAmount: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
}

export interface HistoricalIncomeData {
  date: string;
  income: number;
  currency: CurrencyCode;
}

export interface SpendingAnomalyData {
  category: string;
  amount: number;
  date: Date;
  description: string;
}

export class AIDataService {
  private readonly COLLECTIONS = {
    TRANSACTIONS: 'transactions',
    CLIENTS: 'clients',
    CATEGORIES: 'categories'
  } as const;

  constructor(private userId: string) {}

  // ==================== DATA AGGREGATION METHODS ====================

  /**
   * Get comprehensive financial data for AI insights generation
   */
  async getFinancialInsightsData(
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialInsightsInput> {
    try {
      const aggregation = await this.getFinancialAggregation(startDate, endDate);
      
      return {
        income: aggregation.totalIncome,
        expenses: aggregation.totalExpenses,
        savings: aggregation.totalSavings,
        spendingByCategory: aggregation.spendingByCategory,
        recurringExpenses: aggregation.recurringExpenses
      };

    } catch (error) {
      console.error('Error getting financial insights data:', error);
      // Return empty data instead of throwing for new users
      return {
        income: 0,
        expenses: 0,
        savings: 0,
        spendingByCategory: {},
        recurringExpenses: {}
      };
    }
  }

  /**
   * Get historical income data for prediction models
   */
  async getIncomepredictionData(
    months: number = 12
  ): Promise<PredictIncomeInput> {
    try {
      const historicalData = await this.getHistoricalIncomeData(months);
      const seasonality = await this.analyzeSeasonality(historicalData);

      return {
        historicalIncomeData: JSON.stringify(historicalData),
        seasonality: seasonality
      };

    } catch (error) {
      console.error('Error getting income prediction data:', error);
      // Return empty data instead of throwing for new users
      return {
        historicalIncomeData: JSON.stringify([]),
        seasonality: 'Insufficient data for seasonality analysis'
      };
    }
  }

  /**
   * Get spending data for anomaly detection
   */
  async getSpendingAnomalyData(
    days: number = 30
  ): Promise<DetectSpendingAnomaliesInput> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [currentSpending, averageSpending] = await Promise.all([
        this.getSpendingByCategory(startDate, endDate),
        this.getAverageSpendingByCategory(90) // 3 months average
      ]);

      const spendingData = Object.entries(currentSpending).map(([category, amount]) => ({
        category,
        amount
      }));

      return {
        spendingData: JSON.stringify(spendingData),
        averageSpendingByCategory: JSON.stringify(averageSpending)
      };

    } catch (error) {
      console.error('Error getting spending anomaly data:', error);
      // Return empty data instead of throwing for new users
      return {
        spendingData: JSON.stringify([]),
        averageSpendingByCategory: JSON.stringify({})
      };
    }
  }

  /**
   * Get weekly summary data for AI report generation
   */
  async getWeeklySummaryData(): Promise<GenerateWeeklySummaryInput> {
    try {
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay()); // Start of this week
      
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

      const [thisWeekData, lastWeekData] = await Promise.all([
        this.getFinancialAggregation(thisWeekStart, now),
        this.getFinancialAggregation(lastWeekStart, lastWeekEnd)
      ]);

      return {
        income: thisWeekData.totalIncome,
        expenses: thisWeekData.totalExpenses,
        savings: thisWeekData.totalSavings,
        spendingByCategory: thisWeekData.spendingByCategory,
        previousWeekIncome: lastWeekData.totalIncome,
        previousWeekExpenses: lastWeekData.totalExpenses,
        previousWeekSavings: lastWeekData.totalSavings
      };

    } catch (error) {
      console.error('Error getting weekly summary data:', error);
      // Return empty data instead of throwing for new users
      return {
        income: 0,
        expenses: 0,
        savings: 0,
        spendingByCategory: {},
        previousWeekIncome: 0,
        previousWeekExpenses: 0,
        previousWeekSavings: 0
      };
    }
  }

  // ==================== CORE DATA RETRIEVAL METHODS ====================

  /**
   * Get comprehensive financial data aggregation
   */
  async getFinancialAggregation(
    startDate?: Date,
    endDate?: Date
  ): Promise<AIDataAggregation> {
    try {
      let q = query(
        collection(db, `users/${this.userId}/transactions`),
        orderBy('date', 'desc')
      );

      if (startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      return this.aggregateTransactionData(transactions);

    } catch (error) {
      console.error('Error getting financial aggregation:', error);
      // Return empty aggregation instead of throwing for new users
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        spendingByCategory: {},
        recurringExpenses: {},
        transactionCount: 0,
        averageTransactionAmount: 0,
        topCategories: []
      };
    }
  }

  /**
   * Get historical income data for ML predictions
   */
  async getHistoricalIncomeData(months: number = 12): Promise<HistoricalIncomeData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const q = query(
        collection(db, `users/${this.userId}/transactions`),
        where('type', '==', 'income'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      // Group by month and sum income
      const monthlyIncome = new Map<string, { total: number; currency: CurrencyCode }>();

      transactions.forEach(transaction => {
        const date = transaction.date.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        
        const existing = monthlyIncome.get(monthKey) || { total: 0, currency: 'PHP' };
        existing.total += transaction.amountPHP || transaction.phpEquivalent || 0;
        monthlyIncome.set(monthKey, existing);
      });

      return Array.from(monthlyIncome.entries()).map(([date, data]) => ({
        date,
        income: data.total,
        currency: data.currency
      }));

    } catch (error) {
      console.error('Error getting historical income data:', error);
      throw new Error('Failed to get historical income data');
    }
  }

  /**
   * Get spending by category for the specified period
   */
  async getSpendingByCategory(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    try {
      const q = query(
        collection(db, `users/${this.userId}/transactions`),
        where('type', '==', 'expense'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      const categoryTotals: Record<string, number> = {};

      transactions.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        const amount = transaction.amountPHP || transaction.phpEquivalent || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });

      return categoryTotals;

    } catch (error) {
      console.error('Error getting spending by category:', error);
      throw new Error('Failed to get spending by category');
    }
  }

  /**
   * Get average spending by category over a longer period
   */
  async getAverageSpendingByCategory(days: number = 90): Promise<Record<string, number>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const categoryTotals = await this.getSpendingByCategory(startDate, endDate);
      const periods = Math.max(1, Math.floor(days / 30)); // Monthly averages

      const averages: Record<string, number> = {};
      Object.entries(categoryTotals).forEach(([category, total]) => {
        averages[category] = total / periods;
      });

      return averages;

    } catch (error) {
      console.error('Error getting average spending by category:', error);
      throw new Error('Failed to get average spending by category');
    }
  }

  // ==================== DATA ANALYSIS METHODS ====================

  /**
   * Aggregate transaction data into useful metrics
   */
  private aggregateTransactionData(transactions: Transaction[]): AIDataAggregation {
    // Handle empty transactions gracefully
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        spendingByCategory: {},
        recurringExpenses: {},
        transactionCount: 0,
        averageTransactionAmount: 0,
        topCategories: []
      };
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const spendingByCategory: Record<string, number> = {};
    const recurringExpenses: Record<string, number> = {};

    transactions.forEach(transaction => {
      const amount = transaction.amountPHP || transaction.phpEquivalent || 0;

      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += amount;

        // Categorize spending
        const category = transaction.category || 'Uncategorized';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;

        // Track recurring expenses
        if (transaction.isRecurring) {
          const vendor = transaction.vendor || transaction.description;
          recurringExpenses[vendor] = (recurringExpenses[vendor] || 0) + amount;
        }
      }
    });

    const totalSavings = totalIncome - totalExpenses;
    const transactionCount = transactions.length;
    const averageTransactionAmount = transactionCount > 0 ? 
      (totalIncome + totalExpenses) / transactionCount : 0;

    // Calculate top categories
    const topCategories = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      spendingByCategory,
      recurringExpenses,
      transactionCount,
      averageTransactionAmount,
      topCategories
    };
  }

  /**
   * Analyze seasonality patterns in income data
   */
  private async analyzeSeasonality(historicalData: HistoricalIncomeData[]): Promise<string> {
    if (historicalData.length < 6) {
      return 'Insufficient data for seasonality analysis';
    }

    // Simple seasonality analysis by month
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    historicalData.forEach(data => {
      const month = new Date(data.date).getMonth();
      monthlyAverages[month] += data.income;
      monthlyCounts[month]++;
    });

    // Calculate averages
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }

    // Find highest and lowest months
    const highestMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages));
    const lowestMonth = monthlyAverages.indexOf(Math.min(...monthlyAverages));

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return `Income tends to be highest in ${monthNames[highestMonth]} and lowest in ${monthNames[lowestMonth]}`;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get client information for enhanced AI context
   */
  async getClientContext(): Promise<{ activeClients: number; topClients: string[] }> {
    try {
      const q = query(
        collection(db, `users/${this.userId}/clients`),
        where('status', '==', 'Active')
      );

      const querySnapshot = await getDocs(q);
      const clients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];

      const topClients = clients
        .sort((a, b) => (b.totalEarningsPHP || 0) - (a.totalEarningsPHP || 0))
        .slice(0, 3)
        .map(client => client.name);

      return {
        activeClients: clients.length,
        topClients
      };

    } catch (error) {
      console.error('Error getting client context:', error);
      return { activeClients: 0, topClients: [] };
    }
  }

  /**
   * Get recent transaction patterns for context
   */
  async getRecentTransactionPatterns(days: number = 7): Promise<{
    dailyAverage: number;
    mostFrequentCategory: string;
    largestTransaction: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const aggregation = await this.getFinancialAggregation(startDate, endDate);

      const dailyAverage = (aggregation.totalIncome + aggregation.totalExpenses) / days;
      const mostFrequentCategory = aggregation.topCategories[0]?.category || 'None';
      const largestTransaction = Math.max(...aggregation.topCategories.map(c => c.amount));

      return {
        dailyAverage,
        mostFrequentCategory,
        largestTransaction
      };

    } catch (error) {
      console.error('Error getting recent transaction patterns:', error);
      return {
        dailyAverage: 0,
        mostFrequentCategory: 'None',
        largestTransaction: 0
      };
    }
  }
}

// ==================== EXPORT ====================

export default AIDataService;

// Export types for external use
export type {
  AIDataAggregation,
  HistoricalIncomeData,
  SpendingAnomalyData
};