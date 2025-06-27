"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { 
  categoryService, 
  type Category,
  type CategoryCreateData, 
  type CategoryUpdateData,
  type CategoryAnalytics,
  type AutoCategorizationSuggestion
} from '@/services/category.service';
import type { TransactionType } from '@/types/database.types';

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

export interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  analytics: CategoryAnalytics | null;
  
  // CRUD Operations
  addCategory: (category: CategoryCreateData) => Promise<void>;
  updateCategory: (category: CategoryUpdateData) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Category Operations
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoriesByType: (type: TransactionType) => Category[];
  refreshCategories: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  
  // Auto-categorization
  getSuggestions: (description: string, amount: number, type: TransactionType) => Promise<AutoCategorizationSuggestion[]>;
  updateCategoryUsage: (categoryId: string, amount: number) => Promise<void>;
  
  // Initialization
  initializeDefaultCategories: () => Promise<void>;
  isInitialized: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  // State Management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Dependencies
  const { user } = useAuth();
  const { toast } = useToast();

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  /**
   * Load all categories from Firestore
   */
  const loadCategories = useCallback(async (type?: TransactionType) => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await categoryService.getCategories(user.uid, type);
      if (result.success) {
        setCategories(result.categories);
        setIsInitialized(true);
      } else {
        setError(result.error || 'Failed to load categories');
        toast({
          title: "Error Loading Categories",
          description: result.error || 'Failed to load categories',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = 'Failed to load categories';
      setError(errorMessage);
      toast({
        title: "Error Loading Categories",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  /**
   * Load category analytics
   */
  const loadAnalytics = useCallback(async (type?: TransactionType) => {
    if (!user?.uid) return;

    try {
      const result = await categoryService.getCategoryAnalytics(user.uid, type);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        console.error('Failed to load category analytics:', result.error);
      }
    } catch (err) {
      console.error('Error loading category analytics:', err);
    }
  }, [user?.uid]);

  // ============================================================================
  // INITIALIZATION AND SUBSCRIPTIONS
  // ============================================================================

  /**
   * Initialize categories when user is available
   */
  useEffect(() => {
    if (user?.uid) {
      loadCategories();
      loadAnalytics();
    } else {
      setCategories([]);
      setAnalytics(null);
      setError(null);
      setIsInitialized(false);
    }
  }, [user?.uid, loadCategories, loadAnalytics]);

  /**
   * Set up real-time subscription to category updates
   */
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = categoryService.subscribeToCategories(
      user.uid,
      (updatedCategories) => {
        setCategories(updatedCategories);
        setError(null);
        setIsInitialized(true);
        // Refresh analytics when categories update
        loadAnalytics();
      },
      undefined, // Get all types
      (error) => {
        setError(error);
        toast({
          title: "Connection Error",
          description: error,
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [user?.uid, loadAnalytics, toast]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Add a new category
   */
  const addCategory = useCallback(async (categoryData: CategoryCreateData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await categoryService.createCategory(user.uid, categoryData);
      
      if (result.success) {
        toast({
          title: "Category Added",
          description: `Category "${categoryData.name}" has been created successfully.`,
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Adding Category",
          description: result.error || 'Failed to add category',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Adding Category",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, toast]);

  /**
   * Update an existing category
   */
  const updateCategory = useCallback(async (categoryData: CategoryUpdateData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await categoryService.updateCategory(user.uid, categoryData);
      
      if (result.success) {
        toast({
          title: "Category Updated",
          description: "Category has been updated successfully.",
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Updating Category",
          description: result.error || 'Failed to update category',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Updating Category",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, toast]);

  /**
   * Delete a category
   */
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryToDelete = categories.find(c => c.id === categoryId);
      const result = await categoryService.deleteCategory(user.uid, categoryId);
      
      if (result.success) {
        if (categoryToDelete) {
          toast({
            title: "Category Deleted",
            description: `Category "${categoryToDelete.name}" has been removed.`,
            variant: "destructive",
          });
        }
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Deleting Category",
          description: result.error || 'Failed to delete category',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Deleting Category",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, categories, toast]);

  // ============================================================================
  // CATEGORY OPERATIONS
  // ============================================================================

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback((categoryId: string): Category | undefined => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  /**
   * Get categories by type (income or expense)
   */
  const getCategoriesByType = useCallback((type: TransactionType): Category[] => {
    return categories.filter(c => c.type === type && c.isActive);
  }, [categories]);

  /**
   * Refresh categories manually
   */
  const refreshCategories = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  /**
   * Refresh analytics manually
   */
  const refreshAnalytics = useCallback(async () => {
    await loadAnalytics();
  }, [loadAnalytics]);

  // ============================================================================
  // AUTO-CATEGORIZATION
  // ============================================================================

  /**
   * Get auto-categorization suggestions for a transaction
   */
  const getSuggestions = useCallback(async (
    description: string, 
    amount: number, 
    type: TransactionType
  ): Promise<AutoCategorizationSuggestion[]> => {
    if (!user?.uid) return [];

    try {
      const result = await categoryService.suggestCategory(user.uid, description, amount, type);
      return result.success ? result.data || [] : [];
    } catch (err) {
      console.error('Error getting category suggestions:', err);
      return [];
    }
  }, [user?.uid]);

  /**
   * Update category usage statistics
   */
  const updateCategoryUsage = useCallback(async (categoryId: string, amount: number) => {
    if (!user?.uid) return;

    try {
      await categoryService.updateCategoryUsage(user.uid, categoryId, amount);
      // This will trigger analytics refresh through real-time subscription
    } catch (err) {
      console.error('Error updating category usage:', err);
    }
  }, [user?.uid]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize default categories for new users
   */
  const initializeDefaultCategories = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to initialize categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await categoryService.initializeDefaultCategories(user.uid);
      
      if (result.success) {
        toast({
          title: "Categories Initialized",
          description: "Default categories have been set up for your account.",
        });
        setIsInitialized(true);
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Initializing Categories",
          description: result.error || 'Failed to initialize categories',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Initializing Categories",
        description: "Failed to initialize categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================

  const contextValue: CategoryContextType = {
    categories,
    loading,
    error,
    analytics,
    
    // CRUD Operations
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Category Operations
    getCategoryById,
    getCategoriesByType,
    refreshCategories,
    refreshAnalytics,
    
    // Auto-categorization
    getSuggestions,
    updateCategoryUsage,
    
    // Initialization
    initializeDefaultCategories,
    isInitialized
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for income category operations
 */
export const useIncomeCategories = () => {
  const { categories, getCategoriesByType, getSuggestions } = useCategories();
  
  const incomeCategories = getCategoriesByType('income');
  
  const getIncomeSuggestions = useCallback(async (description: string, amount: number) => {
    return await getSuggestions(description, amount, 'income');
  }, [getSuggestions]);

  return {
    incomeCategories,
    getIncomeSuggestions
  };
};

/**
 * Hook for expense category operations
 */
export const useExpenseCategories = () => {
  const { categories, getCategoriesByType, getSuggestions } = useCategories();
  
  const expenseCategories = getCategoriesByType('expense');
  
  const getExpenseSuggestions = useCallback(async (description: string, amount: number) => {
    return await getSuggestions(description, amount, 'expense');
  }, [getSuggestions]);

  return {
    expenseCategories,
    getExpenseSuggestions
  };
};

/**
 * Hook for category analytics
 */
export const useCategoryAnalytics = () => {
  const { analytics, refreshAnalytics } = useCategories();

  const getMostUsedCategories = useCallback((type?: TransactionType) => {
    if (!analytics) return [];
    
    return analytics.categoryBreakdown
      .filter(item => !type || item.category.type === type)
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 5);
  }, [analytics]);

  const getCategoryUsagePercentage = useCallback((categoryId: string) => {
    if (!analytics) return 0;
    
    const categoryItem = analytics.categoryBreakdown.find(item => item.category.id === categoryId);
    return categoryItem ? categoryItem.percentage : 0;
  }, [analytics]);

  return {
    analytics,
    refreshAnalytics,
    getMostUsedCategories,
    getCategoryUsagePercentage
  };
};