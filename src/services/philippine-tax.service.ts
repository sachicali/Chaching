/**
 * Philippine Tax Service - BIR-Compliant Tax Calculations
 * 
 * Handles tax calculations according to Philippine Bureau of Internal Revenue (BIR) regulations.
 * Includes VAT, income tax, withholding tax, and other Philippine tax requirements for freelancers.
 * 
 * References:
 * - BIR Revenue Regulations
 * - Tax Reform for Acceleration and Inclusion (TRAIN) Law
 * - Bayanihan Acts tax provisions
 * - CREATE Act (Corporate Recovery and Tax Incentives for Enterprises)
 */

import type { CurrencyCode, Transaction, Invoice } from '@/types/database.types';
import { exchangeRateService } from './exchange-rate.service';

// ==================== CONSTANTS ====================

// VAT Rates
export const VAT_RATE = 0.12; // 12% VAT
export const VAT_EXEMPT_THRESHOLD = 3000000; // ₱3M annual gross sales

// Income Tax Brackets for Individual Taxpayers (updated under TRAIN Law)
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 250000, rate: 0, base: 0 }, // Tax-free up to ₱250,000
  { min: 250000, max: 400000, rate: 0.15, base: 0 }, // 15% on excess over ₱250,000
  { min: 400000, max: 800000, rate: 0.2, base: 22500 }, // 20% on excess over ₱400,000
  { min: 800000, max: 2000000, rate: 0.25, base: 102500 }, // 25% on excess over ₱800,000
  { min: 2000000, max: 8000000, rate: 0.3, base: 402500 }, // 30% on excess over ₱2M
  { min: 8000000, max: Infinity, rate: 0.35, base: 2202500 } // 35% on excess over ₱8M
];

// Withholding Tax Rates
export const WITHHOLDING_TAX_RATES = {
  // Professional Services (BIR Form 2307)
  PROFESSIONAL_SERVICES: 0.10, // 10% for professional fees
  RENTAL_INCOME: 0.05, // 5% on rental income
  INTEREST_INCOME: 0.20, // 20% on interest income from banks
  DIVIDENDS: 0.10, // 10% on dividends
  
  // Freelancer/Consultant rates
  FREELANCER_THRESHOLD: 25000, // Monthly threshold for withholding
  FREELANCER_RATE: 0.08 // 8% for freelancers earning > ₱25k/month
};

// Business Tax Types
export const BUSINESS_TAX_TYPES = {
  PERCENTAGE_TAX: 0.03, // 3% percentage tax (for VAT-exempt)
  MINIMUM_CORPORATE_INCOME_TAX: 0.02, // 2% MCIT
  REGULAR_CORPORATE_INCOME_TAX: 0.25 // 25% RCIT (reduced under CREATE Act)
};

// Quarterly Tax Periods
export const TAX_QUARTERS = [
  { quarter: 1, months: [1, 2, 3], deadline: new Date(new Date().getFullYear(), 3, 15) }, // Q1: Jan-Mar, due Apr 15
  { quarter: 2, months: [4, 5, 6], deadline: new Date(new Date().getFullYear(), 6, 15) }, // Q2: Apr-Jun, due Jul 15
  { quarter: 3, months: [7, 8, 9], deadline: new Date(new Date().getFullYear(), 9, 15) }, // Q3: Jul-Sep, due Oct 15
  { quarter: 4, months: [10, 11, 12], deadline: new Date(new Date().getFullYear() + 1, 3, 15) } // Q4: Oct-Dec, due Apr 15 next year
];

// ==================== TYPES ====================

export interface TaxCalculation {
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  vatAmount: number;
  withholdingTax: number;
  percentageTax: number;
  netIncome: number;
  effectiveTaxRate: number;
  currency: CurrencyCode;
  phpEquivalent: number;
  breakdown: TaxBreakdown;
}

export interface TaxBreakdown {
  incomeTaxDetails: {
    bracket: number;
    baseAmount: number;
    excessAmount: number;
    taxOnExcess: number;
    totalTax: number;
  };
  vatDetails: {
    isVatRegistered: boolean;
    vatableAmount: number;
    vatExemptAmount: number;
    inputVat: number;
    outputVat: number;
    netVat: number;
  };
  withholdingDetails: {
    type: string;
    rate: number;
    withheldAmount: number;
  };
  deductions: {
    standardDeduction: number;
    itemizedDeductions: number;
    totalDeductions: number;
  };
}

export interface QuarterlyTaxReturn {
  quarter: number;
  year: number;
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  vatPayable: number;
  percentageTax: number;
  previousPayments: number;
  balanceDue: number;
  dueDate: Date;
  penalties?: number;
  interest?: number;
}

export interface AnnualTaxSummary {
  year: number;
  totalGrossIncome: number;
  totalTaxableIncome: number;
  totalIncomeTax: number;
  totalVatPaid: number;
  totalWithholdingTax: number;
  netIncome: number;
  effectiveRate: number;
  quarterlyReturns: QuarterlyTaxReturn[];
  refundDue?: number;
  additionalTaxDue?: number;
}

// ==================== PHILIPPINE TAX SERVICE ====================

export class PhilippineTaxService {
  private readonly STANDARD_DEDUCTION = 50000; // Standard deduction for individuals
  private readonly OPTIONAL_STANDARD_DEDUCTION_RATE = 0.40; // 40% OSD for professionals

  /**
   * Calculate comprehensive tax for a given income amount
   */
  async calculateTax(params: {
    grossIncome: number;
    currency: CurrencyCode;
    incomeType: 'professional' | 'business' | 'employment' | 'rental';
    isVatRegistered?: boolean;
    deductions?: number;
    previousWithholding?: number;
    quarterlyPayments?: number;
  }): Promise<TaxCalculation> {
    try {
      // Convert to PHP for tax calculations
      const conversionResult = await exchangeRateService.convertCurrency(
        params.grossIncome, 
        params.currency, 
        'PHP'
      );
      const grossIncomePHP = conversionResult.convertedAmount;

      // Calculate deductions
      const deductions = this.calculateDeductions(grossIncomePHP, params.deductions);
      const taxableIncome = Math.max(0, grossIncomePHP - deductions.totalDeductions);

      // Calculate income tax
      const incomeTaxDetails = this.calculateIncomeTax(taxableIncome);

      // Calculate VAT
      const vatDetails = this.calculateVAT(grossIncomePHP, params.isVatRegistered);

      // Calculate withholding tax
      const withholdingDetails = this.calculateWithholdingTax(
        grossIncomePHP, 
        params.incomeType, 
        params.previousWithholding
      );

      // Calculate percentage tax (for VAT-exempt businesses)
      const percentageTax = this.calculatePercentageTax(grossIncomePHP, params.isVatRegistered);

      // Calculate net income
      const totalTax = incomeTaxDetails.totalTax + vatDetails.netVat + percentageTax;
      const netIncome = grossIncomePHP - totalTax;
      const effectiveTaxRate = grossIncomePHP > 0 ? (totalTax / grossIncomePHP) * 100 : 0;

      return {
        grossIncome: params.grossIncome,
        taxableIncome: params.currency === 'PHP' ? taxableIncome : 
          (await exchangeRateService.convertCurrency(taxableIncome, 'PHP', params.currency)).convertedAmount,
        incomeTax: params.currency === 'PHP' ? incomeTaxDetails.totalTax :
          (await exchangeRateService.convertCurrency(incomeTaxDetails.totalTax, 'PHP', params.currency)).convertedAmount,
        vatAmount: params.currency === 'PHP' ? vatDetails.netVat :
          (await exchangeRateService.convertCurrency(vatDetails.netVat, 'PHP', params.currency)).convertedAmount,
        withholdingTax: params.currency === 'PHP' ? withholdingDetails.withheldAmount :
          (await exchangeRateService.convertCurrency(withholdingDetails.withheldAmount, 'PHP', params.currency)).convertedAmount,
        percentageTax: params.currency === 'PHP' ? percentageTax :
          (await exchangeRateService.convertCurrency(percentageTax, 'PHP', params.currency)).convertedAmount,
        netIncome: params.currency === 'PHP' ? netIncome :
          (await exchangeRateService.convertCurrency(netIncome, 'PHP', params.currency)).convertedAmount,
        effectiveTaxRate,
        currency: params.currency,
        phpEquivalent: grossIncomePHP,
        breakdown: {
          incomeTaxDetails,
          vatDetails,
          withholdingDetails,
          deductions
        }
      };

    } catch (error) {
      console.error('Error calculating Philippine tax:', error);
      throw new Error('Failed to calculate tax');
    }
  }

  /**
   * Calculate income tax based on Philippine tax brackets
   */
  private calculateIncomeTax(taxableIncome: number) {
    let totalTax = 0;
    let applicableBracket = 0;
    let baseAmount = 0;
    let excessAmount = 0;
    let taxOnExcess = 0;

    for (let i = 0; i < INCOME_TAX_BRACKETS.length; i++) {
      const bracket = INCOME_TAX_BRACKETS[i];
      
      if (taxableIncome > bracket.min) {
        applicableBracket = i + 1;
        baseAmount = bracket.base;
        
        if (taxableIncome <= bracket.max) {
          excessAmount = taxableIncome - bracket.min;
          taxOnExcess = excessAmount * bracket.rate;
          totalTax = baseAmount + taxOnExcess;
          break;
        }
      }
    }

    return {
      bracket: applicableBracket,
      baseAmount,
      excessAmount,
      taxOnExcess,
      totalTax: Math.round(totalTax * 100) / 100
    };
  }

  /**
   * Calculate VAT (Value Added Tax)
   */
  private calculateVAT(grossIncome: number, isVatRegistered: boolean = false) {
    const vatableAmount = isVatRegistered ? grossIncome : 0;
    const vatExemptAmount = isVatRegistered ? 0 : grossIncome;
    
    // Output VAT (VAT on sales)
    const outputVat = vatableAmount * VAT_RATE;
    
    // Input VAT (VAT on purchases) - simplified calculation
    // In practice, this would be tracked from actual purchase receipts
    const inputVat = outputVat * 0.5; // Assume 50% input VAT for estimation
    
    const netVat = Math.max(0, outputVat - inputVat);

    return {
      isVatRegistered,
      vatableAmount,
      vatExemptAmount,
      inputVat,
      outputVat,
      netVat: Math.round(netVat * 100) / 100
    };
  }

  /**
   * Calculate withholding tax
   */
  private calculateWithholdingTax(
    grossIncome: number, 
    incomeType: string, 
    previousWithholding: number = 0
  ) {
    let rate = 0;
    let type = '';

    switch (incomeType) {
      case 'professional':
        rate = WITHHOLDING_TAX_RATES.PROFESSIONAL_SERVICES;
        type = 'Professional Services (BIR Form 2307)';
        break;
      case 'rental':
        rate = WITHHOLDING_TAX_RATES.RENTAL_INCOME;
        type = 'Rental Income';
        break;
      case 'freelancer':
        // Monthly threshold check for freelancers
        const monthlyIncome = grossIncome / 12;
        if (monthlyIncome > WITHHOLDING_TAX_RATES.FREELANCER_THRESHOLD) {
          rate = WITHHOLDING_TAX_RATES.FREELANCER_RATE;
          type = 'Freelancer Compensation';
        }
        break;
      default:
        rate = 0;
        type = 'No withholding required';
    }

    const withheldAmount = grossIncome * rate;

    return {
      type,
      rate,
      withheldAmount: Math.round(withheldAmount * 100) / 100
    };
  }

  /**
   * Calculate percentage tax for VAT-exempt businesses
   */
  private calculatePercentageTax(grossIncome: number, isVatRegistered: boolean = false): number {
    if (isVatRegistered || grossIncome <= VAT_EXEMPT_THRESHOLD) {
      return 0;
    }

    // 3% percentage tax on gross receipts for VAT-exempt businesses
    const percentageTax = grossIncome * BUSINESS_TAX_TYPES.PERCENTAGE_TAX;
    return Math.round(percentageTax * 100) / 100;
  }

  /**
   * Calculate allowable deductions
   */
  private calculateDeductions(grossIncome: number, itemizedDeductions: number = 0) {
    // Standard deduction
    const standardDeduction = this.STANDARD_DEDUCTION;
    
    // Optional Standard Deduction (40% of gross income, capped at certain limits)
    const optionalStandardDeduction = grossIncome * this.OPTIONAL_STANDARD_DEDUCTION_RATE;
    
    // Choose the higher of standard or itemized deductions
    const bestDeduction = Math.max(
      standardDeduction,
      itemizedDeductions,
      optionalStandardDeduction
    );

    return {
      standardDeduction,
      itemizedDeductions,
      optionalStandardDeduction,
      totalDeductions: bestDeduction
    };
  }

  /**
   * Calculate quarterly tax return
   */
  async calculateQuarterlyReturn(params: {
    quarter: number;
    year: number;
    transactions: Transaction[];
    previousPayments?: number;
  }): Promise<QuarterlyTaxReturn> {
    try {
      const quarterInfo = TAX_QUARTERS.find(q => q.quarter === params.quarter);
      if (!quarterInfo) {
        throw new Error('Invalid quarter');
      }

      // Filter transactions for the quarter
      const quarterTransactions = params.transactions.filter(transaction => {
        const date = transaction.date instanceof Date ? transaction.date : transaction.date.toDate();
        const month = date.getMonth() + 1;
        return quarterInfo.months.includes(month) && date.getFullYear() === params.year;
      });

      // Calculate quarterly income
      const grossIncome = quarterTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.phpEquivalent || t.amount), 0);

      // Calculate tax for the quarter
      const taxCalc = await this.calculateTax({
        grossIncome,
        currency: 'PHP',
        incomeType: 'professional' // Default to professional
      });

      const previousPayments = params.previousPayments || 0;
      const balanceDue = Math.max(0, taxCalc.incomeTax - previousPayments);

      return {
        quarter: params.quarter,
        year: params.year,
        grossIncome,
        taxableIncome: taxCalc.taxableIncome,
        incomeTax: taxCalc.incomeTax,
        vatPayable: taxCalc.vatAmount,
        percentageTax: taxCalc.percentageTax,
        previousPayments,
        balanceDue,
        dueDate: quarterInfo.deadline
      };

    } catch (error) {
      console.error('Error calculating quarterly return:', error);
      throw new Error('Failed to calculate quarterly tax return');
    }
  }

  /**
   * Get current tax quarter
   */
  getCurrentTaxQuarter(): { quarter: number; year: number; dueDate: Date } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentQuarter = TAX_QUARTERS.find(q => 
      q.months.includes(currentMonth)
    );

    return {
      quarter: currentQuarter?.quarter || 1,
      year: currentYear,
      dueDate: currentQuarter?.deadline || new Date()
    };
  }

  /**
   * Check if filing is due soon
   */
  isFilingDueSoon(daysAhead: number = 7): boolean {
    const current = this.getCurrentTaxQuarter();
    const daysDiff = Math.ceil((current.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= daysAhead && daysDiff >= 0;
  }

  /**
   * Generate BIR form data (simplified structure)
   */
  generateBIRFormData(taxCalculation: TaxCalculation, taxpayerInfo: {
    tin: string;
    name: string;
    address: string;
    businessType: string;
  }) {
    return {
      taxpayerInfo,
      taxPeriod: this.getCurrentTaxQuarter(),
      grossIncome: taxCalculation.phpEquivalent,
      taxableIncome: taxCalculation.taxableIncome,
      incomeTax: taxCalculation.incomeTax,
      vatPayable: taxCalculation.vatAmount,
      withholdingTax: taxCalculation.withholdingTax,
      percentageTax: taxCalculation.percentageTax,
      netTaxDue: taxCalculation.incomeTax + taxCalculation.vatAmount + taxCalculation.percentageTax,
      effectiveRate: taxCalculation.effectiveTaxRate,
      breakdown: taxCalculation.breakdown,
      generatedAt: new Date()
    };
  }

  // ==================== STATIC UTILITIES ====================

  /**
   * Format Philippine peso amount
   */
  static formatPHP(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get tax bracket description
   */
  static getTaxBracketDescription(taxableIncome: number): string {
    for (const bracket of INCOME_TAX_BRACKETS) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        if (bracket.rate === 0) {
          return 'Tax-free bracket';
        }
        return `${bracket.rate * 100}% tax bracket`;
      }
    }
    return 'Unknown bracket';
  }

  /**
   * Validate TIN (Tax Identification Number)
   */
  static validateTIN(tin: string): boolean {
    // Philippine TIN format: XXX-XXX-XXX-XXX
    const tinRegex = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
    return tinRegex.test(tin);
  }
}

// ==================== SINGLETON INSTANCE ====================

export const philippineTaxService = new PhilippineTaxService();
export default PhilippineTaxService;