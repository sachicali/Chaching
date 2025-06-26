/**
 * Protected Route Component for Chaching Financial Management Platform
 * 
 * Implements route protection for authenticated areas of the application.
 * Handles redirect logic for unauthenticated users and loading states.
 * Ensures seamless integration with existing app layout.
 * 
 * User Stories: US-002 (User Login)
 * Architecture: Component pattern for route protection
 */

'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireEmailVerification?: boolean;
}

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireEmailVerification?: boolean;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

const AuthLoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4">
      {/* Loading spinner */}
      <div className="relative mx-auto h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-muted"></div>
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
      
      {/* Loading text */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Authenticating...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we verify your session</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// UNAUTHORIZED ACCESS COMPONENT
// ============================================================================

const UnauthorizedScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-6 max-w-md px-6">
      {/* Icon */}
      <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <svg 
          className="h-8 w-8 text-muted-foreground" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      </div>
      
      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">Authentication Required</h1>
        <p className="text-sm text-muted-foreground">
          You need to be signed in to access this page. Please sign in to continue.
        </p>
      </div>
      
      {/* Redirect message */}
      <p className="text-xs text-muted-foreground">
        Redirecting to login page...
      </p>
    </div>
  </div>
);

// ============================================================================
// EMAIL VERIFICATION REQUIRED COMPONENT
// ============================================================================

const EmailVerificationRequired = () => {
  const { resendEmailVerification } = useAuth();

  const handleResendVerification = async () => {
    await resendEmailVerification();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
          <svg 
            className="h-8 w-8 text-amber-600 dark:text-amber-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
            />
          </svg>
        </div>
        
        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Email Verification Required</h1>
          <p className="text-sm text-muted-foreground">
            Please verify your email address to access all features. 
            Check your inbox for a verification email.
          </p>
        </div>
        
        {/* Action button */}
        <button
          onClick={handleResendVerification}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// AUTH GUARD COMPONENT
// ============================================================================

const AuthGuard = ({ 
  children, 
  fallback = <UnauthorizedScreen />,
  requireEmailVerification = false 
}: AuthGuardProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      // Store the current path for redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        sessionStorage.setItem('auth_redirect_after_login', currentPath);
      }
      
      router.push('/auth/login');
      return;
    }

    // If authenticated but email verification required and not verified
    if (!isLoading && isAuthenticated && requireEmailVerification && user && !user.emailVerified) {
      // Don't redirect, just show verification screen
      return;
    }
  }, [isLoading, isAuthenticated, user, requireEmailVerification, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated) {
    return fallback;
  }

  // Show email verification required if needed
  if (requireEmailVerification && user && !user.emailVerified) {
    return <EmailVerificationRequired />;
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
};

// ============================================================================
// MAIN PROTECTED ROUTE COMPONENT
// ============================================================================

const ProtectedRoute = ({ 
  children, 
  fallback,
  redirectTo = '/auth/login',
  requireEmailVerification = false 
}: ProtectedRouteProps) => {
  return (
    <AuthGuard 
      fallback={fallback}
      requireEmailVerification={requireEmailVerification}
    >
      {children}
    </AuthGuard>
  );
};

// ============================================================================
// HIGHER-ORDER COMPONENT FOR ROUTE PROTECTION
// ============================================================================

/**
 * Higher-order component to protect pages
 * Usage: export default withAuth(YourPageComponent);
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireEmailVerification?: boolean;
    fallback?: ReactNode;
  }
) => {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute 
        requireEmailVerification={options?.requireEmailVerification}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return AuthenticatedComponent;
};

// ============================================================================
// UTILITY HOOKS FOR ROUTE PROTECTION
// ============================================================================

/**
 * Hook to check if current user can access a protected resource
 */
export const useCanAccess = (requireEmailVerification: boolean = false) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return false;
  }
  
  if (requireEmailVerification && user && !user.emailVerified) {
    return false;
  }
  
  return true;
};

/**
 * Hook to redirect to login if not authenticated
 */
export const useRequireAuth = (redirectTo: string = '/auth/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
};

export default ProtectedRoute;

/**
 * Usage Examples:
 * 
 * // Basic protected route
 * <ProtectedRoute>
 *   <YourProtectedContent />
 * </ProtectedRoute>
 * 
 * // With email verification required
 * <ProtectedRoute requireEmailVerification>
 *   <YourProtectedContent />
 * </ProtectedRoute>
 * 
 * // Using HOC
 * export default withAuth(DashboardPage);
 * 
 * // Using HOC with email verification
 * export default withAuth(AdminPage, { 
 *   requireEmailVerification: true 
 * });
 * 
 * // Using hooks
 * const canAccess = useCanAccess(true); // requires email verification
 * const { isAuthenticated } = useRequireAuth('/custom-login');
 */