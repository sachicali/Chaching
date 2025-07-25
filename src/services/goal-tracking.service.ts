/**
 * Financial Goal Tracking Service - Chaching Financial Management Platform
 * 
 * Provides comprehensive goal tracking functionality including income goals,
 * expense budgets, savings targets, and milestone tracking with automatic
 * progress calculation based on real financial data.
 * 
 * Features:
 * - Income and expense goal tracking
 * - Milestone-based progress tracking
 * - Automatic progress calculation from transactions
 * - Goal performance analytics
 * - Achievement notifications and recommendations
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
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exchangeRateService } from './exchange-rate.service';
import type { 
  CurrencyCode,
  Transaction,
  TransactionType
} from '@/types/database.types';

// ==================== CONSTANTS ====================

const COLLECTIONS = {
  GOALS: 'financialGoals',
  MILESTONES: 'goalMilestones',
  GOAL_PROGRESS: 'goalProgress'
} as const;

// ==================== TYPES ====================

export type GoalType = 'income' | 'expense' | 'savings' | 'client_revenue' | 'project_budget' | 'emergency_fund';
export type GoalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled' | 'overdue';
export type MilestoneStatus = 'pending' | 'achieved' | 'missed';

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  
  // Target amounts
  targetAmount: number;
  currency: CurrencyCode;
  targetAmountPHP: number; // Converted to PHP for consistency
  
  // Time period
  period: GoalPeriod;
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Progress tracking
  currentAmount: number;
  currentAmountPHP: number;
  progressPercentage: number;
  
  // Status
  status: GoalStatus;
  isRecurring: boolean;
  
  // Configuration
  category?: string;
  clientId?: string; // For client-specific goals
  tags?: string[];
  
  // Milestones
  milestones: GoalMilestone[];
  
  // Notifications
  notificationThresholds: number[]; // Percentage thresholds for notifications (e.g., [25, 50, 75, 100])
  notificationsSent: number[]; // Track which notifications have been sent
  
  // Analytics
  dailyProgress: DailyProgress[];
  averageDailyProgress: number;
  estimatedCompletionDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastCalculatedAt?: Timestamp;
}

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  targetPercentage: number;
  targetDate?: Timestamp;
  status: MilestoneStatus;
  achievedAt?: Timestamp;
  achievedAmount?: number;
  reward?: string; // Optional reward description
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  amount: number;
  cumulativeAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface GoalFormData {
  title: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currency: CurrencyCode;
  period: GoalPeriod;
  startDate: Date;
  endDate: Date;
  category?: string;
  clientId?: string;
  tags?: string[];
  isRecurring?: boolean;
  milestones?: Omit<GoalMilestone, 'id' | 'status' | 'achievedAt' | 'achievedAmount'>[];
  notificationThresholds?: number[];
}

export interface GoalAnalytics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  averageCompletionRate: number;
  goalsByType: Record<GoalType, number>;
  goalsByPeriod: Record<GoalPeriod, number>;
  upcomingDeadlines: FinancialGoal[];
}

// ==================== GOAL TRACKING SERVICE ====================

export class GoalTrackingService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== GOAL CRUD OPERATIONS ====================

  /**
   * Create a new financial goal
   */
  async createGoal(goalData: GoalFormData): Promise<FinancialGoal> {
    try {
      // Convert target amount to PHP
      const conversionResult = await exchangeRateService.convertCurrency(
        goalData.targetAmount,
        goalData.currency,
        'PHP'
      );

      // Create milestones with IDs
      const milestones: GoalMilestone[] = (goalData.milestones || []).map((milestone, index) => ({
        id: `milestone-${index + 1}`,
        ...milestone,
        status: 'pending' as MilestoneStatus
      }));

      const goalDoc: Omit<FinancialGoal, 'id'> = {
        userId: this.userId,
        title: goalData.title,
        description: goalData.description,
        type: goalData.type,
        targetAmount: goalData.targetAmount,
        currency: goalData.currency,
        targetAmountPHP: conversionResult.convertedAmount,
        period: goalData.period,
        startDate: Timestamp.fromDate(goalData.startDate),
        endDate: Timestamp.fromDate(goalData.endDate),
        currentAmount: 0,
        currentAmountPHP: 0,
        progressPercentage: 0,
        status: 'active',
        isRecurring: goalData.isRecurring || false,
        category: goalData.category,
        clientId: goalData.clientId,
        tags: goalData.tags || [],
        milestones,
        notificationThresholds: goalData.notificationThresholds || [25, 50, 75, 100],
        notificationsSent: [],
        dailyProgress: [],
        averageDailyProgress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.GOALS), goalDoc);
      
      return {
        id: docRef.id,
        ...goalDoc
      } as FinancialGoal;

    } catch (error) {
      console.error('Error creating goal:', error);
      throw new Error('Failed to create financial goal');
    }
  }

  /**
   * Get goal by ID
   */
  async getGoalById(goalId: string): Promise<FinancialGoal | null> {
    try {
      const docRef = doc(db, COLLECTIONS.GOALS, goalId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== this.userId) {
        throw new Error('Access denied: Goal not found');
      }

      return {
        id: docSnap.id,
        ...data
      } as FinancialGoal;

    } catch (error) {
      console.error('Error getting goal:', error);
      throw new Error('Failed to get goal');
    }
  }

  /**
   * Get all goals for user
   */
  async getGoals(filters?: {
    type?: GoalType;
    status?: GoalStatus;
    period?: GoalPeriod;
    clientId?: string;
    limit?: number;
  }): Promise<FinancialGoal[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.GOALS),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.period) {
        q = query(q, where('period', '==', filters.period));
      }

      if (filters?.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinancialGoal[];

    } catch (error) {
      console.error('Error getting goals:', error);
      throw new Error('Failed to get goals');
    }
  }

  /**
   * Update goal progress based on transactions
   */
  async updateGoalProgress(goalId: string, transactions: Transaction[]): Promise<FinancialGoal> {
    try {
      const goal = await this.getGoalById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      // Filter relevant transactions for this goal
      const relevantTransactions = this.filterRelevantTransactions(goal, transactions);
      
      // Calculate new progress
      const progress = await this.calculateProgress(goal, relevantTransactions);
      
      // Update milestones
      const updatedMilestones = this.updateMilestones(goal.milestones, progress.currentAmountPHP, progress.progressPercentage);
      
      // Check for status changes
      const newStatus = this.determineGoalStatus(goal, progress.progressPercentage);
      
      // Calculate daily progress
      const dailyProgress = this.calculateDailyProgress(relevantTransactions, goal.startDate.toDate(), goal.endDate.toDate());
      
      // Estimate completion date
      const estimatedCompletion = this.estimateCompletionDate(goal, progress, dailyProgress);

      const updates: Partial<FinancialGoal> = {
        currentAmount: progress.currentAmount,
        currentAmountPHP: progress.currentAmountPHP,
        progressPercentage: progress.progressPercentage,
        status: newStatus,
        milestones: updatedMilestones,
        dailyProgress,
        averageDailyProgress: dailyProgress.length > 0 
          ? dailyProgress.reduce((sum, day) => sum + day.amount, 0) / dailyProgress.length 
          : 0,
        estimatedCompletionDate: estimatedCompletion ? Timestamp.fromDate(estimatedCompletion) : undefined,
        updatedAt: Timestamp.now(),
        lastCalculatedAt: Timestamp.now()
      };

      // Update in database
      const docRef = doc(db, COLLECTIONS.GOALS, goalId);
      await updateDoc(docRef, updates);

      return {
        ...goal,
        ...updates
      } as FinancialGoal;

    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw new Error('Failed to update goal progress');
    }
  }

  /**
   * Get goal analytics
   */
  async getGoalAnalytics(): Promise<GoalAnalytics> {
    try {
      const goals = await this.getGoals();
      
      const analytics: GoalAnalytics = {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmountPHP, 0),
        totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmountPHP, 0),
        overallProgress: 0,
        goalsOnTrack: 0,
        goalsAtRisk: 0,
        averageCompletionRate: 0,
        goalsByType: {} as Record<GoalType, number>,
        goalsByPeriod: {} as Record<GoalPeriod, number>,
        upcomingDeadlines: []
      };

      // Calculate overall progress
      if (analytics.totalTargetAmount > 0) {
        analytics.overallProgress = (analytics.totalCurrentAmount / analytics.totalTargetAmount) * 100;
      }

      // Calculate goals on track vs at risk
      const now = new Date();
      goals.filter(g => g.status === 'active').forEach(goal => {
        const expectedProgress = this.calculateExpectedProgress(goal, now);
        if (goal.progressPercentage >= expectedProgress * 0.8) { // Within 20% of expected
          analytics.goalsOnTrack++;
        } else {
          analytics.goalsAtRisk++;
        }
      });

      // Calculate average completion rate
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length > 0) {
        analytics.averageCompletionRate = activeGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / activeGoals.length;
      }

      // Group by type and period
      goals.forEach(goal => {
        analytics.goalsByType[goal.type] = (analytics.goalsByType[goal.type] || 0) + 1;
        analytics.goalsByPeriod[goal.period] = (analytics.goalsByPeriod[goal.period] || 0) + 1;
      });

      // Find upcoming deadlines (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      analytics.upcomingDeadlines = goals
        .filter(g => g.status === 'active' && g.endDate.toDate() <= thirtyDaysFromNow)
        .sort((a, b) => a.endDate.toMillis() - b.endDate.toMillis())
        .slice(0, 5);

      return analytics;

    } catch (error) {
      console.error('Error getting goal analytics:', error);
      throw new Error('Failed to get goal analytics');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Filter transactions relevant to a specific goal
   */
  private filterRelevantTransactions(goal: FinancialGoal, transactions: Transaction[]): Transaction[] {
    const startDate = goal.startDate.toDate();
    const endDate = goal.endDate.toDate();

    return transactions.filter(transaction => {
      const transactionDate = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date);
      
      // Date range filter
      if (transactionDate < startDate || transactionDate > endDate) {
        return false;
      }

      // Type filter
      if (goal.type === 'income' && transaction.type !== 'income') {
        return false;
      }
      
      if (goal.type === 'expense' && transaction.type !== 'expense') {
        return false;
      }

      // Category filter
      if (goal.category && transaction.category !== goal.category) {
        return false;
      }

      // Client filter
      if (goal.clientId && transaction.clientId !== goal.clientId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate current progress for a goal
   */
  private async calculateProgress(goal: FinancialGoal, transactions: Transaction[]): Promise<{
    currentAmount: number;
    currentAmountPHP: number;
    progressPercentage: number;
  }> {
    const currentAmountPHP = transactions.reduce((sum, transaction) => {
      return sum + (transaction.phpEquivalent || transaction.amount);
    }, 0);

    // Convert back to goal currency if needed
    let currentAmount = currentAmountPHP;
    if (goal.currency !== 'PHP') {
      const conversion = await exchangeRateService.convertCurrency(currentAmountPHP, 'PHP', goal.currency);
      currentAmount = conversion.convertedAmount;
    }

    const progressPercentage = goal.targetAmount > 0 
      ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
      : 0;

    return {
      currentAmount: Math.round(currentAmount * 100) / 100,
      currentAmountPHP: Math.round(currentAmountPHP * 100) / 100,
      progressPercentage: Math.round(progressPercentage * 100) / 100
    };
  }

  /**
   * Update milestone statuses based on current progress
   */
  private updateMilestones(milestones: GoalMilestone[], currentAmountPHP: number, progressPercentage: number): GoalMilestone[] {
    return milestones.map(milestone => {
      if (milestone.status === 'pending') {
        if (progressPercentage >= milestone.targetPercentage) {
          return {
            ...milestone,
            status: 'achieved' as MilestoneStatus,
            achievedAt: Timestamp.now(),
            achievedAmount: currentAmountPHP
          };
        }
        
        // Check if milestone deadline has passed
        if (milestone.targetDate && milestone.targetDate.toDate() < new Date()) {
          return {
            ...milestone,
            status: 'missed' as MilestoneStatus
          };
        }
      }
      
      return milestone;
    });
  }

  /**
   * Determine goal status based on progress and dates
   */
  private determineGoalStatus(goal: FinancialGoal, progressPercentage: number): GoalStatus {
    const now = new Date();
    const endDate = goal.endDate.toDate();

    // Check if completed
    if (progressPercentage >= 100) {
      return 'completed';
    }

    // Check if overdue
    if (now > endDate) {
      return 'overdue';
    }

    // Otherwise, keep current status if active or return active
    return goal.status === 'paused' || goal.status === 'cancelled' ? goal.status : 'active';
  }

  /**
   * Calculate daily progress breakdown
   */
  private calculateDailyProgress(transactions: Transaction[], startDate: Date, endDate: Date): DailyProgress[] {
    const dailyProgress: DailyProgress[] = [];
    const transactionsByDate = new Map<string, Transaction[]>();

    // Group transactions by date
    transactions.forEach(transaction => {
      const date = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!transactionsByDate.has(dateStr)) {
        transactionsByDate.set(dateStr, []);
      }
      transactionsByDate.get(dateStr)!.push(transaction);
    });

    // Calculate cumulative progress
    let cumulativeAmount = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate && currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayTransactions = transactionsByDate.get(dateStr) || [];
      
      const dayAmount = dayTransactions.reduce((sum, t) => sum + (t.phpEquivalent || t.amount), 0);
      cumulativeAmount += dayAmount;
      
      dailyProgress.push({
        date: dateStr,
        amount: dayAmount,
        cumulativeAmount,
        percentage: 0, // Will be calculated based on target
        transactionCount: dayTransactions.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyProgress;
  }

  /**
   * Calculate expected progress based on time elapsed
   */
  private calculateExpectedProgress(goal: FinancialGoal, currentDate: Date): number {
    const startDate = goal.startDate.toDate();
    const endDate = goal.endDate.toDate();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedTime = Math.max(0, currentDate.getTime() - startDate.getTime());
    
    return Math.min((elapsedTime / totalDuration) * 100, 100);
  }

  /**
   * Estimate completion date based on current progress rate
   */
  private estimateCompletionDate(goal: FinancialGoal, progress: any, dailyProgress: DailyProgress[]): Date | null {
    if (progress.progressPercentage >= 100) {
      return new Date(); // Already completed
    }

    if (dailyProgress.length < 7) {
      return null; // Not enough data for estimation
    }

    // Calculate average daily progress from last 7 days
    const recentProgress = dailyProgress.slice(-7);
    const averageDailyAmount = recentProgress.reduce((sum, day) => sum + day.amount, 0) / recentProgress.length;

    if (averageDailyAmount <= 0) {
      return null; // No progress being made
    }

    const remainingAmount = goal.targetAmountPHP - progress.currentAmountPHP;
    const daysToCompletion = Math.ceil(remainingAmount / averageDailyAmount);

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToCompletion);

    return estimatedDate;
  }
}

// ==================== SINGLETON INSTANCE ====================

export const goalTrackingService = (userId: string) => new GoalTrackingService(userId);
export default GoalTrackingService;