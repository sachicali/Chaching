/**
 * Exchange Rate Service - Real-time Currency Conversion
 * 
 * Provides real-time exchange rate data using the free fawazahmed0 currency API.
 * Includes caching, error handling, and fallback to static rates for reliability.
 * 
 * API: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies
 * Base Currency: PHP (Philippine Peso)
 */

import type { CurrencyCode } from '@/types/database.types';

// ==================== CONSTANTS ====================

const API_BASE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const REQUEST_TIMEOUT = 5000; // 5 seconds

// Fallback rates for when API is unavailable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  PHP: 1.00,
  USD: 58.75, // 1 USD = 58.75 PHP
  EUR: 63.50  // 1 EUR = 63.50 PHP
};

// ==================== TYPES ====================

interface ExchangeRateCache {
  rates: Record<CurrencyCode, number>;
  timestamp: number;
  source: 'api' | 'fallback';
}

interface ExchangeRateResponse {
  date: string;
  [currency: string]: number | string;
}

export interface ExchangeRateResult {
  rate: number;
  source: 'api' | 'cache' | 'fallback';
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  source: 'api' | 'cache' | 'fallback';
  timestamp: number;
}

// ==================== EXCHANGE RATE SERVICE ====================

class ExchangeRateService {
  private cache: ExchangeRateCache | null = null;
  private lastFetch: number = 0;
  private isUpdating = false;

  /**
   * Get exchange rate for a specific currency to PHP
   */
  async getExchangeRate(currency: CurrencyCode): Promise<ExchangeRateResult> {
    try {
      // Return 1 for PHP (base currency)
      if (currency === 'PHP') {
        return {
          rate: 1,
          source: 'api',
          timestamp: Date.now(),
          success: true
        };
      }

      // Check cache first
      if (this.isCacheValid()) {
        return {
          rate: this.cache!.rates[currency],
          source: 'cache',
          timestamp: this.cache!.timestamp,
          success: true
        };
      }

      // Fetch fresh rates if cache is invalid
      await this.updateExchangeRates();

      if (this.cache) {
        return {
          rate: this.cache.rates[currency],
          source: this.cache.source,
          timestamp: this.cache.timestamp,
          success: true
        };
      }

      // Fallback if all else fails
      return this.getFallbackRate(currency);

    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return this.getFallbackRate(currency);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode = 'PHP'
  ): Promise<ConversionResult> {
    try {
      // Same currency conversion
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          rate: 1,
          fromCurrency,
          toCurrency,
          source: 'api',
          timestamp: Date.now()
        };
      }

      // Get exchange rates
      const fromRate = await this.getExchangeRate(fromCurrency);
      const toRate = await this.getExchangeRate(toCurrency);

      // Calculate conversion rate (from currency -> PHP -> to currency)
      const conversionRate = fromRate.rate / toRate.rate;
      const convertedAmount = amount * conversionRate;

      return {
        originalAmount: amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
        rate: conversionRate,
        fromCurrency,
        toCurrency,
        source: fromRate.source,
        timestamp: fromRate.timestamp
      };

    } catch (error) {
      console.error('Error converting currency:', error);
      
      // Fallback conversion using static rates
      const fallbackFromRate = FALLBACK_RATES[fromCurrency];
      const fallbackToRate = FALLBACK_RATES[toCurrency];
      const fallbackConversionRate = fallbackFromRate / fallbackToRate;
      
      return {
        originalAmount: amount,
        convertedAmount: Math.round(amount * fallbackConversionRate * 100) / 100,
        rate: fallbackConversionRate,
        fromCurrency,
        toCurrency,
        source: 'fallback',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get all current exchange rates
   */
  async getAllExchangeRates(): Promise<Record<CurrencyCode, ExchangeRateResult>> {
    try {
      const rates: Record<CurrencyCode, ExchangeRateResult> = {} as Record<CurrencyCode, ExchangeRateResult>;
      
      for (const currency of ['PHP', 'USD', 'EUR'] as CurrencyCode[]) {
        rates[currency] = await this.getExchangeRate(currency);
      }
      
      return rates;
    } catch (error) {
      console.error('Error getting all exchange rates:', error);
      throw new Error('Failed to get exchange rates');
    }
  }

  /**
   * Force refresh exchange rates from API
   */
  async refreshExchangeRates(): Promise<void> {
    this.cache = null;
    this.lastFetch = 0;
    await this.updateExchangeRates();
  }

  /**
   * Get cached rates if available
   */
  getCachedRates(): ExchangeRateCache | null {
    return this.isCacheValid() ? this.cache : null;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return (now - this.cache.timestamp) < CACHE_DURATION;
  }

  /**
   * Update exchange rates from API
   */
  private async updateExchangeRates(): Promise<void> {
    if (this.isUpdating) {
      // Wait for ongoing update
      while (this.isUpdating) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isUpdating = true;

    try {
      const rates: Record<CurrencyCode, number> = {
        PHP: 1.00,
        USD: 1.00,
        EUR: 1.00
      };

      // Fetch PHP rates (base currency)
      const phpResponse = await this.fetchExchangeRate('php');
      if (phpResponse) {
        // Convert to PHP base rates
        rates.USD = 1 / (phpResponse.usd || 0.017); // If 1 PHP = 0.017 USD, then 1 USD = 58.8 PHP
        rates.EUR = 1 / (phpResponse.eur || 0.0157); // If 1 PHP = 0.0157 EUR, then 1 EUR = 63.7 PHP
      }

      this.cache = {
        rates,
        timestamp: Date.now(),
        source: 'api'
      };

      console.log('Exchange rates updated from API:', rates);

    } catch (error) {
      console.warn('Failed to fetch exchange rates from API, using fallback:', error);
      
      // Use fallback rates
      this.cache = {
        rates: { ...FALLBACK_RATES },
        timestamp: Date.now(),
        source: 'fallback'
      };
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch exchange rate from API
   */
  private async fetchExchangeRate(currency: string): Promise<ExchangeRateResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/${currency.toLowerCase()}.json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // API returns nested structure: { "date": "2024-01-01", "php": { "usd": 0.017, "eur": 0.015 } }
      return data[currency.toLowerCase()] || null;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Get fallback rate when API fails
   */
  private getFallbackRate(currency: CurrencyCode): ExchangeRateResult {
    return {
      rate: FALLBACK_RATES[currency],
      source: 'fallback',
      timestamp: Date.now(),
      success: true,
      error: 'Using fallback rate due to API unavailability'
    };
  }

  // ==================== STATIC HELPERS ====================

  /**
   * Format currency amount with proper locale
   */
  static formatCurrency(amount: number, currency: CurrencyCode): string {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currency: CurrencyCode): string {
    const symbols: Record<CurrencyCode, string> = {
      PHP: '₱',
      USD: '$',
      EUR: '€'
    };
    return symbols[currency];
  }

  /**
   * Validate currency code
   */
  static isValidCurrency(currency: string): currency is CurrencyCode {
    return ['PHP', 'USD', 'EUR'].includes(currency);
  }
}

// ==================== SINGLETON INSTANCE ====================

export const exchangeRateService = new ExchangeRateService();
export default ExchangeRateService;

// ==================== UTILITY EXPORTS ====================

export {
  FALLBACK_RATES,
  CACHE_DURATION
};