'use client';

// Invoice Context - Chaching Financial Management Application
// This context provides global state management for invoice operations

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceService } from '@/services/invoice.service';
import PdfService from '@/services/pdf.service';
import type {
  Invoice,
  InvoiceFormData,
  InvoiceTemplate,
  Payment,
  CurrencyCode
} from '@/types/database.types';

// ==================== TYPES ====================

interface InvoiceState {
  invoices: Invoice[];
  templates: InvoiceTemplate[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  analytics: InvoiceAnalytics | null;
}

interface InvoiceAnalytics {
  totalInvoices: number;
  totalAmount: number;
  totalAmountPHP: number;
  paidInvoices: number;
  paidAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  statusBreakdown: Record<Invoice['status'], number>;
  currencyBreakdown: Record<CurrencyCode, { count: number; amount: number }>;
}

type InvoiceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_SELECTED_INVOICE'; payload: Invoice | null }
  | { type: 'SET_TEMPLATES'; payload: InvoiceTemplate[] }
  | { type: 'SET_ANALYTICS'; payload: InvoiceAnalytics }
  | { type: 'RESET_STATE' };

interface InvoiceContextType {
  // State
  state: InvoiceState;
  
  // Invoice Operations
  createInvoice: (data: InvoiceFormData) => Promise<Invoice>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  duplicateInvoice: (id: string) => Promise<Invoice>;
  
  // Invoice Status Management
  sendInvoice: (id: string, emailData?: { subject?: string; message?: string }) => Promise<Invoice>;
  markAsViewed: (id: string) => Promise<Invoice>;
  recordPayment: (id: string, paymentData: {
    amount: number;
    paymentDate: Date;
    paymentMethod: Payment['paymentMethod'];
    reference?: string;
    notes?: string;
  }) => Promise<{ invoice: Invoice; payment: Payment; transactionId?: string }>;
  
  // Invoice Management
  loadInvoices: (filters?: InvoiceFilters) => Promise<void>;
  selectInvoice: (invoice: Invoice | null) => void;
  
  // Templates
  loadTemplates: () => Promise<void>;
  
  // Analytics
  loadAnalytics: (period?: { startDate: Date; endDate: Date }) => Promise<void>;
  
  // Utility Functions
  calculateInvoiceTotal: (lineItems: InvoiceFormData['lineItems'], taxRate: number, discount?: InvoiceFormData['discount']) => number;
  validateInvoiceData: (data: InvoiceFormData) => string[];
  generateInvoicePDF: (invoice: Invoice) => Promise<Blob>;
}

interface InvoiceFilters {
  status?: Invoice['status'] | 'all';
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

// ==================== INITIAL STATE ====================

const initialState: InvoiceState = {
  invoices: [],
  templates: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
  analytics: null
};

// ==================== REDUCER ====================

function invoiceReducer(state: InvoiceState, action: InvoiceAction): InvoiceState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'SET_INVOICES':
      return {
        ...state,
        invoices: action.payload,
        isLoading: false,
        error: null
      };

    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [action.payload, ...state.invoices],
        selectedInvoice: action.payload,
        error: null
      };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        ),
        selectedInvoice: state.selectedInvoice?.id === action.payload.id 
          ? action.payload 
          : state.selectedInvoice,
        error: null
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload),
        selectedInvoice: state.selectedInvoice?.id === action.payload 
          ? null 
          : state.selectedInvoice,
        error: null
      };

    case 'SET_SELECTED_INVOICE':
      return {
        ...state,
        selectedInvoice: action.payload
      };

    case 'SET_TEMPLATES':
      return {
        ...state,
        templates: action.payload,
        error: null
      };

    case 'SET_ANALYTICS':
      return {
        ...state,
        analytics: action.payload,
        error: null
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// ==================== CONTEXT CREATION ====================

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

// ==================== PROVIDER COMPONENT ====================

interface InvoiceProviderProps {
  children: ReactNode;
}

export function InvoiceProvider({ children }: InvoiceProviderProps) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const { user } = useAuth();

  // Initialize service when user changes
  const invoiceService = user ? new InvoiceService(user.uid) : null;

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user]);

  // ==================== INVOICE OPERATIONS ====================

  const createInvoice = async (data: InvoiceFormData): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Validate data
      const validationErrors = InvoiceService.validateInvoiceData(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const invoice = await invoiceService.createInvoice(data);
      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      
      return invoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      // Check if invoice is already in state
      const existingInvoice = state.invoices.find(invoice => invoice.id === id);
      if (existingInvoice) {
        return existingInvoice;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      const invoice = await invoiceService.getInvoiceById(id);
      
      if (invoice) {
        // Add to state if not already present
        const isInState = state.invoices.some(inv => inv.id === invoice.id);
        if (!isInState) {
          dispatch({ type: 'ADD_INVOICE', payload: invoice });
        }
      }
      
      return invoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedInvoice = await invoiceService.updateInvoice(id, updates);
      dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await invoiceService.deleteInvoice(id);
      dispatch({ type: 'DELETE_INVOICE', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const duplicateInvoice = async (id: string): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const originalInvoice = await getInvoiceById(id);
      if (!originalInvoice) {
        throw new Error('Original invoice not found');
      }

      // Create new invoice data based on original
      const duplicateData: InvoiceFormData = {
        clientId: originalInvoice.clientId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        currency: originalInvoice.currency,
        lineItems: originalInvoice.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          category: item.category,
          categoryId: item.categoryId,
          isTaxable: item.isTaxable,
          taxRate: item.taxRate
        })),
        paymentTerms: originalInvoice.paymentTerms,
        notes: originalInvoice.notes,
        taxRate: originalInvoice.taxRate,
        discount: originalInvoice.discount ? {
          type: originalInvoice.discount.type,
          value: originalInvoice.discount.value,
          description: originalInvoice.discount.description
        } : undefined,
        templateId: originalInvoice.templateId
      };

      const duplicatedInvoice = await invoiceService.createInvoice(duplicateData);
      dispatch({ type: 'ADD_INVOICE', payload: duplicatedInvoice });
      
      return duplicatedInvoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ==================== STATUS MANAGEMENT ====================

  const sendInvoice = async (id: string, emailData?: { subject?: string; message?: string }): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedInvoice = await invoiceService.sendInvoice(id, emailData);
      dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markAsViewed = async (id: string): Promise<Invoice> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedInvoice = await invoiceService.markInvoiceAsViewed(id);
      dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark invoice as viewed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const recordPayment = async (
    id: string,
    paymentData: {
      amount: number;
      paymentDate: Date;
      paymentMethod: Payment['paymentMethod'];
      reference?: string;
      notes?: string;
    }
  ): Promise<{ invoice: Invoice; payment: Payment; transactionId?: string }> => {
    if (!invoiceService) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await invoiceService.recordPayment(id, paymentData);
      dispatch({ type: 'UPDATE_INVOICE', payload: result.invoice });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ==================== DATA LOADING ====================

  const loadInvoices = async (filters?: InvoiceFilters): Promise<void> => {
    if (!invoiceService) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const invoices = await invoiceService.getInvoices(filters);
      dispatch({ type: 'SET_INVOICES', payload: invoices });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load invoices';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const selectInvoice = (invoice: Invoice | null): void => {
    dispatch({ type: 'SET_SELECTED_INVOICE', payload: invoice });
  };

  const loadTemplates = async (): Promise<void> => {
    if (!invoiceService) {
      return;
    }

    try {
      const templates = await invoiceService.getInvoiceTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const loadAnalytics = async (period?: { startDate: Date; endDate: Date }): Promise<void> => {
    if (!invoiceService) {
      return;
    }

    try {
      const analytics = await invoiceService.getInvoiceAnalytics(period);
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const calculateInvoiceTotal = (
    lineItems: InvoiceFormData['lineItems'],
    taxRate: number,
    discount?: InvoiceFormData['discount']
  ): number => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    let discountAmount = 0;
    if (discount) {
      discountAmount = discount.type === 'percentage' 
        ? subtotal * (discount.value / 100)
        : discount.value;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = discountedSubtotal * (taxRate / 100);
    
    return discountedSubtotal + taxAmount;
  };

  const validateInvoiceData = (data: InvoiceFormData): string[] => {
    return InvoiceService.validateInvoiceData(data);
  };

  const generateInvoicePDF = async (invoice: Invoice): Promise<Blob> => {
    if (!invoiceService || !user) {
      throw new Error('User not authenticated');
    }
    const pdfService = new PdfService(user.uid);
    const pdfUrl = await pdfService.generateInvoicePdf(invoice);
    const response = await fetch(pdfUrl);
    return await response.blob();
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue: InvoiceContextType = {
    state,
    
    // Invoice Operations
    createInvoice,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    
    // Status Management
    sendInvoice,
    markAsViewed,
    recordPayment,
    
    // Data Management
    loadInvoices,
    selectInvoice,
    loadTemplates,
    loadAnalytics,
    
    // Utility Functions
    calculateInvoiceTotal,
    validateInvoiceData,
    generateInvoicePDF
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
}

// ==================== HOOK ====================

export function useInvoiceContext(): InvoiceContextType {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
}

// ==================== EXPORT ====================

export default InvoiceContext;
export type { InvoiceFilters, InvoiceAnalytics };