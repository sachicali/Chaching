/**
 * Export Utilities for Chaching Financial Management Platform
 * 
 * Provides utilities for data export functionality including CSV generation,
 * file download triggers, and data formatting for reports.
 * 
 * User Stories: US-006 (Financial Reports) - Export functionality
 * Dependencies: None (pure utility functions)
 * Architecture: Utility functions with no external dependencies
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'json' | 'txt';
  includeHeaders?: boolean;
  delimiter?: string;
  dateFormat?: 'iso' | 'local' | 'short';
  currencyFormat?: 'symbol' | 'code' | 'both';
}

export interface CSVExportConfig {
  headers: string[];
  data: Record<string, unknown>[];
  filename: string;
  delimiter?: string;
  includeHeaders?: boolean;
}

export interface FileDownloadConfig {
  content: string | Blob;
  filename: string;
  mimeType: string;
}

// ============================================================================
// CSV GENERATION UTILITIES
// ============================================================================

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  options: Partial<ExportOptions> = {}
): string {
  if (data.length === 0) {
    return '';
  }

  const delimiter = options.delimiter || ',';
  const includeHeaders = options.includeHeaders !== false;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV rows
  const csvRows: string[] = [];
  
  // Add headers if requested
  if (includeHeaders) {
    csvRows.push(headers.map(header => escapeCSVField(header)).join(delimiter));
  }
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSVField(formatValueForExport(value, options));
    });
    csvRows.push(values.join(delimiter));
  });
  
  return csvRows.join('\n');
}

/**
 * Generate CSV from transaction data with custom field mapping
 */
export function generateTransactionCSV(
  transactions: any[],
  fieldMapping: Record<string, string> = {},
  options: Partial<ExportOptions> = {}
): string {
  if (transactions.length === 0) {
    return 'No transactions to export';
  }

  // Default field mapping for transactions
  const defaultMapping = {
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    currency: 'Currency',
    phpEquivalent: 'PHP Equivalent',
    description: 'Description',
    category: 'Category',
    status: 'Status',
    clientId: 'Client ID',
    paymentMethod: 'Payment Method',
    receiptUrl: 'Receipt URL'
  };

  const mapping = { ...defaultMapping, ...fieldMapping };
  
  // Transform transactions to match field mapping
  const transformedData = transactions.map(transaction => {
    const transformed: Record<string, unknown> = {};
    
    Object.entries(mapping).forEach(([field, header]) => {
      let value = transaction[field];
      
      // Special formatting for specific fields
      if (field === 'date' && value) {
        value = formatDateForExport(value.toDate ? value.toDate() : value, options.dateFormat);
      } else if (field === 'amount' || field === 'phpEquivalent') {
        value = formatCurrencyForExport(value, options.currencyFormat);
      } else if (field === 'metadata') {
        value = value ? JSON.stringify(value) : '';
      }
      
      transformed[header] = value || '';
    });
    
    return transformed;
  });

  return convertToCSV(transformedData, options);
}

/**
 * Generate CSV from business summary data
 */
export function generateSummaryCSV(
  summary: any,
  options: Partial<ExportOptions> = {}
): string {
  const summaryData = [
    { metric: 'Total Revenue', value: formatCurrencyForExport(summary.totalRevenue, options.currencyFormat) },
    { metric: 'Total Expenses', value: formatCurrencyForExport(summary.totalExpenses, options.currencyFormat) },
    { metric: 'Net Profit', value: formatCurrencyForExport(summary.netProfit, options.currencyFormat) },
    { metric: 'Profit Margin', value: `${summary.profitMargin.toFixed(2)}%` },
    { metric: 'Transaction Count', value: summary.transactionCount.toString() },
    { metric: 'Average Transaction', value: formatCurrencyForExport(summary.averageTransactionValue, options.currencyFormat) }
  ];

  return convertToCSV(summaryData, options);
}

// ============================================================================
// FILE DOWNLOAD UTILITIES
// ============================================================================

/**
 * Trigger file download in browser
 */
export function downloadFile(config: FileDownloadConfig): void {
  try {
    const blob = typeof config.content === 'string' 
      ? new Blob([config.content], { type: config.mimeType })
      : config.content;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = config.filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Download CSV data as file
 */
export function downloadCSV(
  data: string,
  filename: string = 'export.csv'
): void {
  downloadFile({
    content: data,
    filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
    mimeType: 'text/csv;charset=utf-8;'
  });
}

/**
 * Download JSON data as file
 */
export function downloadJSON(
  data: object,
  filename: string = 'export.json'
): void {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile({
    content: jsonString,
    filename: filename.endsWith('.json') ? filename : `${filename}.json`,
    mimeType: 'application/json;charset=utf-8;'
  });
}

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Format date for export based on specified format
 */
export function formatDateForExport(
  date: Date,
  format: 'iso' | 'local' | 'short' = 'iso'
): string {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  switch (format) {
    case 'iso':
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'local':
      return date.toLocaleDateString();
    case 'short':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Format currency values for export
 */
export function formatCurrencyForExport(
  amount: number,
  format: 'symbol' | 'code' | 'both' = 'symbol',
  currency: string = 'PHP'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedAmount = formatter.format(amount);

  switch (format) {
    case 'symbol':
      return currency === 'PHP' ? `₱${formattedAmount}` : 
             currency === 'USD' ? `$${formattedAmount}` :
             currency === 'EUR' ? `€${formattedAmount}` :
             `${formattedAmount} ${currency}`;
    case 'code':
      return `${formattedAmount} ${currency}`;
    case 'both':
      const symbol = currency === 'PHP' ? '₱' : 
                    currency === 'USD' ? '$' :
                    currency === 'EUR' ? '€' : '';
      return symbol ? `${symbol}${formattedAmount} ${currency}` : `${formattedAmount} ${currency}`;
    default:
      return formattedAmount;
  }
}

/**
 * Format any value for export with appropriate type handling
 */
export function formatValueForExport(
  value: unknown,
  options: Partial<ExportOptions> = {}
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (value instanceof Date) {
    return formatDateForExport(value, options.dateFormat);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Escape CSV field to handle commas, quotes, and line breaks
 */
export function escapeCSVField(field: string): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);
  
  // If field contains comma, quote, or line break, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

// ============================================================================
// FILENAME GENERATION UTILITIES
// ============================================================================

/**
 * Generate filename with timestamp
 */
export function generateTimestampedFilename(
  base: string,
  extension: string,
  includeTime: boolean = false
): string {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (includeTime) {
    const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `${base}_${datePart}_${timePart}.${extension}`;
  }
  
  return `${base}_${datePart}.${extension}`;
}

/**
 * Generate report filename based on report type and date range
 */
export function generateReportFilename(
  reportType: string,
  dateRange?: { startDate: Date; endDate: Date },
  format: string = 'csv'
): string {
  let filename = reportType.toLowerCase().replace(/\s+/g, '-');
  
  if (dateRange) {
    const startDate = dateRange.startDate.toISOString().split('T')[0];
    const endDate = dateRange.endDate.toISOString().split('T')[0];
    filename += `_${startDate}_to_${endDate}`;
  } else {
    filename += `_${new Date().toISOString().split('T')[0]}`;
  }
  
  return `${filename}.${format}`;
}

// ============================================================================
// DATA VALIDATION UTILITIES
// ============================================================================

/**
 * Validate export data before processing
 */
export function validateExportData(
  data: unknown[],
  requiredFields?: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Data array is empty');
    return { isValid: false, errors };
  }

  if (requiredFields && requiredFields.length > 0) {
    const firstItem = data[0] as Record<string, unknown>;
    const missingFields = requiredFields.filter(field => !(field in firstItem));
    
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Get file size estimate for export data
 */
export function estimateFileSize(data: string): string {
  const bytes = new Blob([data]).size;
  
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Usage Examples:
 * 
 * // Export transactions to CSV
 * const csvData = generateTransactionCSV(transactions, {
 *   date: 'Transaction Date',
 *   amount: 'Amount (PHP)'
 * }, { dateFormat: 'local', currencyFormat: 'both' });
 * 
 * downloadCSV(csvData, 'transactions_2024');
 * 
 * // Export business summary
 * const summaryCSV = generateSummaryCSV(businessSummary);
 * downloadCSV(summaryCSV, generateReportFilename('Business Summary'));
 * 
 * // Custom data export
 * const customData = [
 *   { client: 'ABC Corp', revenue: 50000, transactions: 15 },
 *   { client: 'XYZ Ltd', revenue: 75000, transactions: 22 }
 * ];
 * const csvContent = convertToCSV(customData, { currencyFormat: 'symbol' });
 * downloadCSV(csvContent, 'client-revenue-report');
 */