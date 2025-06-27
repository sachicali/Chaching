/**
 * Report Service for Chaching Financial Management Platform
 * 
 * Provides comprehensive report generation capabilities for financial data.
 * Handles PDF generation, CSV export, and business analytics reporting.
 * 
 * User Stories: US-006 (Financial Reports) + US-007 (Dashboard Analytics)
 * Dependencies: TransactionService, jsPDF, Papa Parse
 * Architecture: Service layer pattern with export utilities
 */

import { transactionService } from './transaction.service';
import type { 
  Transaction, 
  TransactionFilters,
  TransactionType,
  CurrencyCode 
} from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ReportConfig {
  templateId: string;
  userId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: TransactionFilters;
  customization?: {
    includeLogo?: boolean;
    companyInfo?: UserBusinessInfo;
    currency?: CurrencyCode;
    theme?: 'light' | 'dark';
  };
}

export interface UserBusinessInfo {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'client' | 'tax' | 'custom';
  format: 'pdf' | 'csv' | 'both';
  sections: ReportSection[];
  defaultConfig: Partial<ReportConfig>;
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'transactions' | 'charts' | 'analysis';
  title: string;
  include: boolean;
  config?: Record<string, unknown>;
}

export interface BusinessSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  transactionCount: number;
  averageTransactionValue: number;
  topCategories: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  currencyBreakdown: CurrencyBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  type: TransactionType;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  transactionCount: number;
}

export interface CurrencyBreakdown {
  currency: CurrencyCode;
  amount: number;
  phpEquivalent: number;
  percentage: number;
  transactionCount: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  firstTransaction: Date;
  lastTransaction: Date;
  paymentFrequency: number; // days between payments
  profitability: 'high' | 'medium' | 'low';
  transactions: Transaction[];
}

export interface PLStatement {
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenue: {
    totalRevenue: number;
    revenueByCategory: CategoryBreakdown[];
    revenueByClient: ClientReport[];
  };
  expenses: {
    totalExpenses: number;
    expensesByCategory: CategoryBreakdown[];
    deductibleExpenses: number;
    nonDeductibleExpenses: number;
  };
  netIncome: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
}

export interface TaxReport {
  taxYear: number;
  totalIncome: number;
  totalDeductibleExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  quarterlyBreakdown: QuarterlyTaxBreakdown[];
  deductibleCategories: CategoryBreakdown[];
  supportingDocuments: string[]; // receipt URLs
}

export interface QuarterlyTaxBreakdown {
  quarter: number;
  income: number;
  expenses: number;
  taxableIncome: number;
  estimatedTax: number;
}

export interface ReportServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// REPORT SERVICE CLASS
// ============================================================================

class ReportService {
  private readonly PHP_TAX_RATES = {
    // Philippines tax rates for freelancers (2024)
    professional: [
      { min: 0, max: 250000, rate: 0.20 },
      { min: 250000, max: 400000, rate: 0.25 },
      { min: 400000, max: 800000, rate: 0.30 },
      { min: 800000, max: 2000000, rate: 0.32 },
      { min: 2000000, max: 8000000, rate: 0.35 }
    ],
    nonProfessional: [
      { min: 0, max: 250000, rate: 0.20 },
      { min: 250000, max: 400000, rate: 0.25 },
      { min: 400000, max: 800000, rate: 0.30 },
      { min: 800000, max: 2000000, rate: 0.32 },
      { min: 2000000, max: 8000000, rate: 0.35 }
    ]
  };

  /**
   * Generate business summary report
   */
  async generateBusinessSummary(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<ReportServiceResult<BusinessSummary>> {
    try {
      const filters: TransactionFilters = {
        startDate: { toDate: () => dateRange.startDate } as any,
        endDate: { toDate: () => dateRange.endDate } as any
      };

      const transactionsResult = await transactionService.getTransactions(userId, filters);
      if (!transactionsResult.success) {
        return { success: false, error: transactionsResult.error };
      }

      const transactions = transactionsResult.transactions;
      
      // Calculate basic metrics
      let totalRevenue = 0;
      let totalExpenses = 0;
      const categoryMap = new Map<string, { amount: number; count: number; type: TransactionType }>();
      const monthlyMap = new Map<string, { revenue: number; expenses: number; count: number }>();
      const currencyMap = new Map<CurrencyCode, { amount: number; phpEquivalent: number; count: number }>();

      transactions.forEach(transaction => {
        const phpAmount = transaction.phpEquivalent;
        const month = transaction.date.toDate().toISOString().substring(0, 7); // YYYY-MM

        if (transaction.type === 'income') {
          totalRevenue += phpAmount;
        } else {
          totalExpenses += phpAmount;
        }

        // Category breakdown
        const categoryKey = `${transaction.category}_${transaction.type}`;
        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, { amount: 0, count: 0, type: transaction.type });
        }
        const categoryData = categoryMap.get(categoryKey)!;
        categoryData.amount += phpAmount;
        categoryData.count += 1;

        // Monthly trends
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { revenue: 0, expenses: 0, count: 0 });
        }
        const monthData = monthlyMap.get(month)!;
        if (transaction.type === 'income') {
          monthData.revenue += phpAmount;
        } else {
          monthData.expenses += phpAmount;
        }
        monthData.count += 1;

        // Currency breakdown
        if (!currencyMap.has(transaction.currency)) {
          currencyMap.set(transaction.currency, { amount: 0, phpEquivalent: 0, count: 0 });
        }
        const currencyData = currencyMap.get(transaction.currency)!;
        currencyData.amount += transaction.amount;
        currencyData.phpEquivalent += phpAmount;
        currencyData.count += 1;
      });

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const totalTransactions = totalRevenue + totalExpenses;

      // Top categories
      const topCategories: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([key, data]) => ({
          category: key.split('_')[0],
          amount: data.amount,
          percentage: totalTransactions > 0 ? (data.amount / totalTransactions) * 100 : 0,
          transactionCount: data.count,
          type: data.type
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Monthly trends
      const monthlyTrends: MonthlyTrend[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          expenses: data.expenses,
          netProfit: data.revenue - data.expenses,
          transactionCount: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Currency breakdown
      const totalPHP = totalRevenue + totalExpenses;
      const currencyBreakdown: CurrencyBreakdown[] = Array.from(currencyMap.entries())
        .map(([currency, data]) => ({
          currency,
          amount: data.amount,
          phpEquivalent: data.phpEquivalent,
          percentage: totalPHP > 0 ? (data.phpEquivalent / totalPHP) * 100 : 0,
          transactionCount: data.count
        }))
        .sort((a, b) => b.phpEquivalent - a.phpEquivalent);

      const summary: BusinessSummary = {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        transactionCount: transactions.length,
        averageTransactionValue: transactions.length > 0 ? totalTransactions / transactions.length : 0,
        topCategories,
        monthlyTrends,
        currencyBreakdown
      };

      return { success: true, data: summary };

    } catch (error) {
      console.error('Error generating business summary:', error);
      return { success: false, error: 'Failed to generate business summary' };
    }
  }

  /**
   * Generate client profitability report
   */
  async getClientProfitabilityReport(userId: string, clientId?: string): Promise<ReportServiceResult<ClientReport[]>> {
    try {
      const filters: TransactionFilters = clientId ? { clientId } : {};
      const transactionsResult = await transactionService.getTransactions(userId, filters);
      
      if (!transactionsResult.success) {
        return { success: false, error: transactionsResult.error };
      }

      const transactions = transactionsResult.transactions;
      const clientMap = new Map<string, Transaction[]>();

      // Group transactions by client
      transactions.forEach(transaction => {
        if (transaction.clientId) {
          if (!clientMap.has(transaction.clientId)) {
            clientMap.set(transaction.clientId, []);
          }
          clientMap.get(transaction.clientId)!.push(transaction);
        }
      });

      const clientReports: ClientReport[] = Array.from(clientMap.entries()).map(([clientId, clientTransactions]) => {
        const revenue = clientTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.phpEquivalent, 0);

        const sortedTransactions = clientTransactions.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
        const firstTransaction = sortedTransactions[0].date.toDate();
        const lastTransaction = sortedTransactions[sortedTransactions.length - 1].date.toDate();
        
        const daysBetween = (lastTransaction.getTime() - firstTransaction.getTime()) / (1000 * 60 * 60 * 24);
        const paymentFrequency = clientTransactions.length > 1 ? daysBetween / (clientTransactions.length - 1) : 0;

        let profitability: 'high' | 'medium' | 'low' = 'low';
        if (revenue > 100000) profitability = 'high';
        else if (revenue > 25000) profitability = 'medium';

        return {
          clientId,
          clientName: `Client ${clientId}`, // TODO: Get actual client name from client service
          totalRevenue: revenue,
          transactionCount: clientTransactions.length,
          averageTransactionValue: revenue / clientTransactions.length,
          firstTransaction,
          lastTransaction,
          paymentFrequency,
          profitability,
          transactions: clientTransactions
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return { success: true, data: clientReports };

    } catch (error) {
      console.error('Error generating client profitability report:', error);
      return { success: false, error: 'Failed to generate client profitability report' };
    }
  }

  /**
   * Generate Profit & Loss statement
   */
  async getProfitLossStatement(userId: string, period: { startDate: Date; endDate: Date }): Promise<ReportServiceResult<PLStatement>> {
    try {
      const filters: TransactionFilters = {
        startDate: { toDate: () => period.startDate } as any,
        endDate: { toDate: () => period.endDate } as any
      };

      const transactionsResult = await transactionService.getTransactions(userId, filters);
      if (!transactionsResult.success) {
        return { success: false, error: transactionsResult.error };
      }

      const transactions = transactionsResult.transactions;
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');

      // Revenue analysis
      const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.phpEquivalent, 0);
      const revenueByCategory = this.groupByCategory(incomeTransactions);
      const clientReportsResult = await this.getClientProfitabilityReport(userId);
      const revenueByClient = clientReportsResult.success ? clientReportsResult.data! : [];

      // Expense analysis
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.phpEquivalent, 0);
      const expensesByCategory = this.groupByCategory(expenseTransactions);
      const deductibleExpenses = expenseTransactions
        .filter(t => t.metadata?.taxDeductible)
        .reduce((sum, t) => sum + t.phpEquivalent, 0);
      const nonDeductibleExpenses = totalExpenses - deductibleExpenses;

      // Net income calculations
      const grossProfit = totalRevenue - totalExpenses;
      const netProfit = grossProfit; // Simplified for now
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const plStatement: PLStatement = {
        period,
        revenue: {
          totalRevenue,
          revenueByCategory,
          revenueByClient
        },
        expenses: {
          totalExpenses,
          expensesByCategory,
          deductibleExpenses,
          nonDeductibleExpenses
        },
        netIncome: {
          grossProfit,
          netProfit,
          profitMargin
        }
      };

      return { success: true, data: plStatement };

    } catch (error) {
      console.error('Error generating P&L statement:', error);
      return { success: false, error: 'Failed to generate P&L statement' };
    }
  }

  /**
   * Generate tax-ready report for Philippines
   */
  async getTaxReadyReport(userId: string, taxYear: number): Promise<ReportServiceResult<TaxReport>> {
    try {
      const startDate = new Date(taxYear, 0, 1); // January 1
      const endDate = new Date(taxYear, 11, 31); // December 31

      const filters: TransactionFilters = {
        startDate: { toDate: () => startDate } as any,
        endDate: { toDate: () => endDate } as any
      };

      const transactionsResult = await transactionService.getTransactions(userId, filters);
      if (!transactionsResult.success) {
        return { success: false, error: transactionsResult.error };
      }

      const transactions = transactionsResult.transactions;
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.phpEquivalent, 0);
      const totalDeductibleExpenses = expenseTransactions
        .filter(t => t.metadata?.taxDeductible)
        .reduce((sum, t) => sum + t.phpEquivalent, 0);

      const taxableIncome = Math.max(0, totalIncome - totalDeductibleExpenses);
      const estimatedTax = this.calculatePhilippineTax(taxableIncome, 'professional');

      // Quarterly breakdown
      const quarterlyBreakdown: QuarterlyTaxBreakdown[] = [];
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterStart = new Date(taxYear, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(taxYear, quarter * 3, 0);
        
        const quarterTransactions = transactions.filter(t => {
          const date = t.date.toDate();
          return date >= quarterStart && date <= quarterEnd;
        });

        const quarterIncome = quarterTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.phpEquivalent, 0);
        
        const quarterExpenses = quarterTransactions
          .filter(t => t.type === 'expense' && t.metadata?.taxDeductible)
          .reduce((sum, t) => sum + t.phpEquivalent, 0);

        const quarterTaxableIncome = Math.max(0, quarterIncome - quarterExpenses);
        const quarterTax = this.calculatePhilippineTax(quarterTaxableIncome, 'professional') / 4; // Simplified quarterly estimate

        quarterlyBreakdown.push({
          quarter,
          income: quarterIncome,
          expenses: quarterExpenses,
          taxableIncome: quarterTaxableIncome,
          estimatedTax: quarterTax
        });
      }

      // Deductible categories
      const deductibleCategories = this.groupByCategory(
        expenseTransactions.filter(t => t.metadata?.taxDeductible)
      );

      // Supporting documents
      const supportingDocuments = transactions
        .filter(t => t.receiptUrl)
        .map(t => t.receiptUrl!)
        .filter(Boolean);

      const taxReport: TaxReport = {
        taxYear,
        totalIncome,
        totalDeductibleExpenses,
        taxableIncome,
        estimatedTax,
        quarterlyBreakdown,
        deductibleCategories,
        supportingDocuments
      };

      return { success: true, data: taxReport };

    } catch (error) {
      console.error('Error generating tax report:', error);
      return { success: false, error: 'Failed to generate tax report' };
    }
  }

  /**
   * Generate CSV export
   */
  async generateCSVExport(userId: string, filters?: TransactionFilters): Promise<ReportServiceResult<string>> {
    try {
      const transactionsResult = await transactionService.getTransactions(userId, filters);
      if (!transactionsResult.success) {
        return { success: false, error: transactionsResult.error };
      }

      const transactions = transactionsResult.transactions;
      
      // CSV headers
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Currency',
        'PHP Equivalent',
        'Description',
        'Category',
        'Status',
        'Client ID',
        'Payment Method',
        'Tax Deductible',
        'Receipt URL'
      ];

      // Convert transactions to CSV rows
      const rows = transactions.map(transaction => [
        transaction.date.toDate().toISOString().split('T')[0],
        transaction.type,
        transaction.amount.toString(),
        transaction.currency,
        transaction.phpEquivalent.toString(),
        transaction.description,
        transaction.category,
        transaction.status,
        transaction.clientId || '',
        transaction.paymentMethod || '',
        transaction.metadata?.taxDeductible ? 'Yes' : 'No',
        transaction.receiptUrl || ''
      ]);

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return { success: true, data: csvContent };

    } catch (error) {
      console.error('Error generating CSV export:', error);
      return { success: false, error: 'Failed to generate CSV export' };
    }
  }

  /**
   * Get available report templates
   */
  getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 'business-summary',
        name: 'Business Summary Report',
        description: 'Comprehensive overview of business performance',
        category: 'financial',
        format: 'both',
        sections: [
          { id: 'summary', type: 'summary', title: 'Executive Summary', include: true },
          { id: 'revenue', type: 'analysis', title: 'Revenue Analysis', include: true },
          { id: 'expenses', type: 'analysis', title: 'Expense Analysis', include: true },
          { id: 'trends', type: 'charts', title: 'Trends & Forecasting', include: true }
        ],
        defaultConfig: {}
      },
      {
        id: 'profit-loss',
        name: 'Profit & Loss Statement',
        description: 'Professional P&L statement for accounting',
        category: 'financial',
        format: 'pdf',
        sections: [
          { id: 'revenue', type: 'summary', title: 'Revenue', include: true },
          { id: 'expenses', type: 'summary', title: 'Expenses', include: true },
          { id: 'netincome', type: 'summary', title: 'Net Income', include: true }
        ],
        defaultConfig: {}
      },
      {
        id: 'tax-report',
        name: 'Tax-Ready Report',
        description: 'Philippines tax compliance report',
        category: 'tax',
        format: 'both',
        sections: [
          { id: 'income', type: 'summary', title: 'Total Income', include: true },
          { id: 'deductions', type: 'summary', title: 'Deductions', include: true },
          { id: 'quarterly', type: 'analysis', title: 'Quarterly Breakdown', include: true }
        ],
        defaultConfig: {}
      },
      {
        id: 'client-profitability',
        name: 'Client Profitability Report',
        description: 'Revenue and profit analysis by client',
        category: 'client',
        format: 'both',
        sections: [
          { id: 'overview', type: 'summary', title: 'Client Overview', include: true },
          { id: 'revenue', type: 'analysis', title: 'Revenue by Client', include: true },
          { id: 'trends', type: 'charts', title: 'Client Trends', include: true }
        ],
        defaultConfig: {}
      }
    ];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Group transactions by category
   */
  private groupByCategory(transactions: Transaction[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    const totalAmount = transactions.reduce((sum, t) => sum + t.phpEquivalent, 0);

    transactions.forEach(transaction => {
      if (!categoryMap.has(transaction.category)) {
        categoryMap.set(transaction.category, { amount: 0, count: 0 });
      }
      const categoryData = categoryMap.get(transaction.category)!;
      categoryData.amount += transaction.phpEquivalent;
      categoryData.count += 1;
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      transactionCount: data.count,
      type: transactions[0]?.type || 'income'
    })).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate Philippines tax for freelancers
   */
  private calculatePhilippineTax(taxableIncome: number, type: 'professional' | 'nonProfessional'): number {
    const brackets = this.PHP_TAX_RATES[type];
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const taxableAtThisBracket = Math.min(
        remainingIncome,
        bracket.max - bracket.min
      );

      tax += taxableAtThisBracket * bracket.rate;
      remainingIncome -= taxableAtThisBracket;
    }

    return tax;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const reportService = new ReportService();

/**
 * Usage Examples:
 * 
 * // Generate business summary
 * const summary = await reportService.generateBusinessSummary(userId, {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31')
 * });
 * 
 * // Get client profitability
 * const clientReports = await reportService.getClientProfitabilityReport(userId);
 * 
 * // Generate tax report
 * const taxReport = await reportService.getTaxReadyReport(userId, 2024);
 * 
 * // Export to CSV
 * const csvData = await reportService.generateCSVExport(userId, { type: 'income' });
 */