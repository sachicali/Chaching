/**
 * Authentication Context for Chaching Financial Management Platform
 * 
 * Provides global authentication state management with React Context.
 * Handles user authentication state, loading states, and error handling.
 * Integrates with Firebase Auth and user profile management.
 * 
 * User Stories: US-002 (User Login), US-003 (Password Reset)
 * Architecture: Context pattern following existing ClientContext structure
 */

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, type AuthUser, type AuthResult, type LoginCredentials, type RegisterCredentials, type PasswordResetResult } from '@/services/auth.service';
import type { User } from '@/types/database.types';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AuthContextType {
  // State
  user: AuthUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: RegisterCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<PasswordResetResult>;
  resendEmailVerification: () => Promise<PasswordResetResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  refreshUserProfile: () => Promise<void>;
}

interface AuthState {
  user: AuthUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isInitialized: false
  });

  const { toast } = useToast();

  // ============================================================================
  // AUTH STATE INITIALIZATION
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (!mounted) return;

      if (user) {
        // User is signed in, fetch their profile
        const userProfile = await authService.getUserProfile(user.uid);
        
        setState({
          user,
          userProfile,
          isLoading: false,
          isInitialized: true
        });
      } else {
        // User is signed out
        setState({
          user: null,
          userProfile: null,
          isLoading: false,
          isInitialized: true
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.login(credentials);

      if (result.success && result.user) {
        // Fetch user profile
        const userProfile = await authService.getUserProfile(result.user.uid);
        
        setState(prev => ({
          ...prev,
          user: result.user!,
          userProfile,
          isLoading: false
        }));

        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.displayName || result.user.email}!`,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        
        if (result.error) {
          toast({
            title: "Login Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = 'An unexpected error occurred during login';
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.register(credentials);

      if (result.success && result.user) {
        // Fetch the newly created user profile
        const userProfile = await authService.getUserProfile(result.user.uid);
        
        setState(prev => ({
          ...prev,
          user: result.user!,
          userProfile,
          isLoading: false
        }));

        if (result.requiresEmailVerification) {
          toast({
            title: "Registration Successful",
            description: "Please check your email and verify your account to complete registration.",
          });
        } else {
          toast({
            title: "Registration Successful",
            description: `Welcome to Chaching, ${result.user.displayName}!`,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        
        if (result.error) {
          toast({
            title: "Registration Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = 'An unexpected error occurred during registration';
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await authService.logout();

      if (result.success) {
        setState({
          user: null,
          userProfile: null,
          isLoading: false,
          isInitialized: true
        });

        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        
        toast({
          title: "Logout Error",
          description: result.error || "An error occurred during logout",
          variant: "destructive",
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred during logout",
        variant: "destructive",
      });
    }
  }, [toast]);

  const sendPasswordReset = useCallback(async (email: string): Promise<PasswordResetResult> => {
    try {
      const result = await authService.sendPasswordReset(email);

      if (result.success) {
        toast({
          title: "Password Reset Sent",
          description: result.message || "Password reset email has been sent.",
        });
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.error || "Failed to send password reset email",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      toast({
        title: "Password Reset Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const resendEmailVerification = useCallback(async (): Promise<PasswordResetResult> => {
    try {
      const result = await authService.resendEmailVerification();

      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: result.message || "Verification email has been sent.",
        });
      } else {
        toast({
          title: "Verification Email Failed",
          description: result.error || "Failed to send verification email",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      toast({
        title: "Verification Email Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    try {
      const result = await authService.updateUserPassword(newPassword);

      if (result.success) {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      } else {
        toast({
          title: "Password Update Failed",
          description: result.error || "Failed to update password",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      toast({
        title: "Password Update Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (state.user) {
      const userProfile = await authService.getUserProfile(state.user.uid);
      setState(prev => ({ ...prev, userProfile }));
    }
  }, [state.user]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    isAuthenticated: Boolean(state.user),

    // Actions
    login,
    register,
    logout,
    sendPasswordReset,
    resendEmailVerification,
    updatePassword,
    refreshUserProfile
  };

  // Don't render children until auth state is initialized
  if (!state.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// CUSTOM HOOKS FOR SPECIFIC AUTH OPERATIONS
// ============================================================================

/**
 * Hook for login functionality with loading state
 */
export const useLogin = () => {
  const { login, isLoading } = useAuth();
  return { login, isLoading };
};

/**
 * Hook for registration functionality with loading state
 */
export const useRegister = () => {
  const { register, isLoading } = useAuth();
  return { register, isLoading };
};

/**
 * Hook for logout functionality
 */
export const useLogout = () => {
  const { logout } = useAuth();
  return { logout };
};

/**
 * Hook for password reset functionality
 */
export const usePasswordReset = () => {
  const { sendPasswordReset } = useAuth();
  return { sendPasswordReset };
};

/**
 * Hook for email verification functionality
 */
export const useEmailVerification = () => {
  const { resendEmailVerification } = useAuth();
  return { resendEmailVerification };
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

/**
 * Hook to get current user data
 */
export const useCurrentUser = () => {
  const { user, userProfile } = useAuth();
  return { user, userProfile };
};

/**
 * Usage Examples:
 * 
 * // Basic usage
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * // Specific operation hooks
 * const { login, isLoading } = useLogin();
 * const { sendPasswordReset } = usePasswordReset();
 * const { isAuthenticated } = useIsAuthenticated();
 * 
 * // Login example
 * const handleLogin = async () => {
 *   const result = await login({
 *     email: 'user@example.com',
 *     password: 'password',
 *     rememberMe: true
 *   });
 *   
 *   if (result.success) {
 *     // User is now logged in
 *   }
 * };
 */