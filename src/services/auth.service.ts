/**
 * Authentication Service for Chaching Financial Management Platform
 * 
 * Provides comprehensive Firebase Auth operations with strong TypeScript typing.
 * Handles user registration, login, logout, password reset, and session management.
 * 
 * User Stories: US-002 (User Login), US-003 (Password Reset)
 * Dependencies: Firebase Auth, database types
 * Architecture: Service layer pattern with error handling
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  User as FirebaseUser,
  AuthError,
  onAuthStateChanged,
  Unsubscribe,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { 
  getCurrentTimestamp,
  usersCollection,
  getUserDocument
} from '@/lib/firestore-schema';
import type { User, CreateUserData, UpdateUserData } from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  message?: string;
}

export type OAuthProvider = 'google' | 'github';

// ============================================================================
// AUTH SERVICE CLASS
// ============================================================================

class AuthService {
  private authStateUnsubscribe: Unsubscribe | null = null;

  /**
   * Register a new user with email and password
   * Creates Firebase Auth user and user profile in Firestore
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!this.isValidEmail(credentials.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!this.isValidPassword(credentials.password)) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      if (!credentials.name.trim()) {
        return { success: false, error: 'Name is required' };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: credentials.name
      });

      // Create user profile in Firestore
      const userProfile: CreateUserData = {
        email: credentials.email,
        name: credentials.name,
        businessName: credentials.businessName,
        phone: credentials.phone,
        preferences: {
          defaultCurrency: 'PHP',
          dateFormat: 'MM/dd/yyyy',
          timeZone: 'Asia/Manila',
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            weekly: true,
            invoiceReminders: true,
            goalUpdates: true,
            anomalyAlerts: true
          },
          language: 'en'
        }
      };

      await this.createUserProfile(firebaseUser.uid, userProfile);

      // Send email verification
      await sendEmailVerification(firebaseUser);

      return {
        success: true,
        user: this.mapFirebaseUser(firebaseUser),
        requiresEmailVerification: true
      };

    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      if (!this.isValidEmail(credentials.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!credentials.password) {
        return { success: false, error: 'Password is required' };
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Check if email is verified (optional - can be enforced)
      if (!firebaseUser.emailVerified) {
        // For now, we'll allow unverified users but note it
        console.warn('User email not verified:', firebaseUser.email);
      }

      // Update last login timestamp in Firestore
      await this.updateLastLogin(firebaseUser.uid);

      return {
        success: true,
        user: this.mapFirebaseUser(firebaseUser)
      };

    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<AuthResult> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      await sendPasswordResetEmail(auth, email);

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };

    } catch (error) {
      const authError = error as AuthError;
      
      // For security, we don't reveal whether the email exists
      if (authError.code === 'auth/user-not-found') {
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.'
        };
      }

      return {
        success: false,
        error: this.handleAuthError(authError)
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<PasswordResetResult> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user is currently signed in' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      await sendEmailVerification(user);

      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      };

    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(newPassword: string): Promise<AuthResult> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user is currently signed in' };
      }

      if (!this.isValidPassword(newPassword)) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      await updatePassword(user, newPassword);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google or GitHub)
   * @param provider - The OAuth provider to use
   * @param useRedirect - Whether to use redirect flow (better for mobile)
   */
  async signInWithOAuth(provider: OAuthProvider, useRedirect = false): Promise<AuthResult> {
    try {
      let authProvider;
      
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          authProvider.setCustomParameters({
            prompt: 'select_account'
          });
          break;
        case 'github':
          authProvider = new GithubAuthProvider();
          authProvider.addScope('read:user');
          authProvider.addScope('user:email');
          break;
        default:
          return { success: false, error: 'Invalid OAuth provider' };
      }

      let userCredential: UserCredential;
      
      if (useRedirect) {
        // Use redirect flow (better for mobile)
        await signInWithRedirect(auth, authProvider);
        // The result will be handled in handleRedirectResult
        return { success: true };
      } else {
        // Use popup flow (desktop)
        userCredential = await signInWithPopup(auth, authProvider);
      }

      const firebaseUser = userCredential.user;
      
      // Check if this is a new user
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // First time OAuth sign in - create user profile
        const userData: CreateUserData = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          businessName: undefined,
          phone: firebaseUser.phoneNumber || undefined,
          preferences: {
            defaultCurrency: 'PHP',
            dateFormat: 'MM/dd/yyyy',
            timeZone: 'Asia/Manila',
            theme: 'dark',
            notifications: {
              email: true,
              push: true,
              weekly: true,
              invoiceReminders: true,
              goalUpdates: true,
              anomalyAlerts: true
            },
            language: 'en'
          }
        };
        
        await this.createUserProfile(firebaseUser.uid, userData);
      } else {
        // Existing user - update last login
        await this.updateLastLogin(firebaseUser.uid);
      }

      return {
        success: true,
        user: this.mapFirebaseUser(firebaseUser)
      };

    } catch (error) {
      const authError = error as AuthError;
      
      // Handle specific OAuth errors
      if (authError.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign in cancelled' };
      }
      
      if (authError.code === 'auth/popup-blocked') {
        return { success: false, error: 'Popup blocked. Please allow popups for this site.' };
      }
      
      if (authError.code === 'auth/account-exists-with-different-credential') {
        return { 
          success: false, 
          error: 'An account already exists with the same email address but different sign-in credentials.' 
        };
      }
      
      return {
        success: false,
        error: this.handleAuthError(authError)
      };
    }
  }

  /**
   * Handle OAuth redirect result
   * Call this on app initialization to handle redirect flow
   */
  async handleRedirectResult(): Promise<AuthResult> {
    try {
      const result = await getRedirectResult(auth);
      
      if (!result) {
        // No redirect result pending
        return { success: true };
      }
      
      const firebaseUser = result.user;
      
      // Check if this is a new user
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // First time OAuth sign in - create user profile
        const userData: CreateUserData = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          businessName: undefined,
          phone: firebaseUser.phoneNumber || undefined,
          preferences: {
            defaultCurrency: 'PHP',
            dateFormat: 'MM/dd/yyyy',
            timeZone: 'Asia/Manila',
            theme: 'dark',
            notifications: {
              email: true,
              push: true,
              weekly: true,
              invoiceReminders: true,
              goalUpdates: true,
              anomalyAlerts: true
            },
            language: 'en'
          }
        };
        
        await this.createUserProfile(firebaseUser.uid, userData);
      } else {
        // Existing user - update last login
        await this.updateLastLogin(firebaseUser.uid);
      }

      return {
        success: true,
        user: this.mapFirebaseUser(firebaseUser)
      };

    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error as AuthError)
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, (firebaseUser) => {
      const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
      callback(user);
    });
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { id: userId, ...userSnap.data() } as User;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile in Firestore
   */
  async updateUserProfile(userId: string, updates: Partial<UpdateUserData>): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: UpdateUserData = {
        ...updates,
        updatedAt: getCurrentTimestamp()
      };

      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create user profile in Firestore
   */
  private async createUserProfile(userId: string, userData: CreateUserData): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const timestamp = getCurrentTimestamp();

    const userProfile: Omit<User, 'id'> = {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await setDoc(userRef, userProfile);
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        updatedAt: getCurrentTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Map Firebase User to AuthUser interface
   */
  private mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Handle Firebase Auth errors with user-friendly messages
   */
  private handleAuthError(error: AuthError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/requires-recent-login':
        return 'Please sign in again to complete this action';
      default:
        console.error('Auth error:', error);
        return 'An error occurred. Please try again';
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const authService = new AuthService();

/**
 * Usage Examples:
 * 
 * // Register new user
 * const result = await authService.register({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   name: 'John Doe',
 *   businessName: 'Doe Consulting'
 * });
 * 
 * // Login user
 * const loginResult = await authService.login({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   rememberMe: true
 * });
 * 
 * // Send password reset
 * const resetResult = await authService.sendPasswordReset('user@example.com');
 * 
 * // Listen to auth changes
 * const unsubscribe = authService.onAuthStateChange((user) => {
 *   if (user) {
 *     console.log('User signed in:', user.email);
 *   } else {
 *     console.log('User signed out');
 *   }
 * });
 */