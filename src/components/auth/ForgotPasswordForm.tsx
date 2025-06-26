/**
 * Forgot Password Form Component for Chaching Financial Management Platform
 * 
 * Implements secure password reset functionality with email-based recovery.
 * Addresses User Story US-003 (Password Reset - 3 points) with comprehensive
 * validation, security measures, and user feedback.
 * 
 * User Stories: US-003 (Password Reset)
 * Architecture: Form component using React Hook Form + Zod validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ForgotPasswordForm = ({ 
  onBackToLogin, 
  className = '' 
}: ForgotPasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const { sendPasswordReset } = useAuth();
  const router = useRouter();

  // ============================================================================
  // FORM SETUP
  // ============================================================================

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const email = watch('email');

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await sendPasswordReset(data.email);

      if (result.success) {
        setSubmittedEmail(data.email);
        setIsSuccess(true);
      } else {
        setError(result.error || 'Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      router.push('/auth/login');
    }
  };

  const handleResendEmail = async () => {
    if (submittedEmail) {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await sendPasswordReset(submittedEmail);
        if (!result.success) {
          setError(result.error || 'Failed to resend email. Please try again.');
        }
      } catch (error) {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl font-semibold">Check your email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to{' '}
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-4 text-center">
            <Mail className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend email'
            )}
          </Button>

          <Button
            onClick={handleBackToLogin}
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ============================================================================
  // FORM STATE
  // ============================================================================

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Reset your password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              autoFocus
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Help Text */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              We'll send you a secure link to reset your password. This link will expire in 1 hour for your security.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>

          {/* Back to Login */}
          <Button
            type="button"
            onClick={handleBackToLogin}
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ForgotPasswordForm;

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <ForgotPasswordForm />
 * 
 * // With custom back handler
 * <ForgotPasswordForm onBackToLogin={() => setActiveTab('login')} />
 * 
 * // With custom styling
 * <ForgotPasswordForm className="shadow-lg" />
 */