/**
 * Registration Form Component for Chaching Financial Management Platform
 * 
 * Provides secure user registration interface with comprehensive form validation.
 * Creates new user accounts with profile setup and email verification.
 * Follows dark theme design patterns and accessibility guidelines.
 * 
 * User Stories: US-001 (User Registration)
 * Architecture: Form component using React Hook Form + Zod validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  businessName: z
    .string()
    .optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val),
      'Please enter a valid phone number'
    )
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface RegisterFormProps {
  onSignIn?: () => void;
  className?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RegisterForm = ({ 
  onSignIn, 
  className = '' 
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  // ============================================================================
  // FORM SETUP
  // ============================================================================

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      phone: ''
    }
  });

  const password = watch('password');

  // ============================================================================
  // PASSWORD STRENGTH CALCULATION
  // ============================================================================

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, feedback: [], color: 'bg-muted' };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score += 25;
    else feedback.push('At least 8 characters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push('One uppercase letter');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push('One lowercase letter');

    // Number check
    if (/[0-9]/.test(password)) score += 25;
    else feedback.push('One number');

    // Determine color based on score
    let color = 'bg-destructive';
    if (score >= 75) color = 'bg-green-500';
    else if (score >= 50) color = 'bg-yellow-500';
    else if (score >= 25) color = 'bg-orange-500';

    return { score, feedback, color };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await register({
        email: data.email,
        password: data.password,
        name: data.name,
        businessName: data.businessName || undefined,
        phone: data.phone || undefined
      });

      if (result.success) {
        setRegistrationSuccess(true);
        
        if (result.requiresEmailVerification) {
          // Show success message but don't redirect yet
          setTimeout(() => {
            router.push('/auth/verify-email');
          }, 2000);
        } else {
          // Redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setAuthError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push('/auth/login');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (registrationSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Registration Successful!</h2>
            <p className="text-muted-foreground text-sm">
              Welcome to Chaching! Please check your email for verification instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create your account
        </CardTitle>
        <CardDescription className="text-center">
          Join Chaching to manage your freelance finances with AI-powered insights
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Auth Error Alert */}
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              {...registerField('name')}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              {...registerField('email')}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Business Name Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name (Optional)</Label>
            <Input
              id="businessName"
              type="text"
              placeholder="Enter your business name"
              autoComplete="organization"
              {...registerField('businessName')}
              disabled={isSubmitting}
            />
          </div>

          {/* Phone Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
              {...registerField('phone')}
              className={errors.phone ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                {...registerField('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Progress value={passwordStrength.score} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength.score}%
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Missing: {passwordStrength.feedback.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                autoComplete="new-password"
                {...registerField('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || passwordStrength.score < 100}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Terms Notice */}
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>

          {/* Sign In Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              type="button"
              onClick={handleSignIn}
              className="text-primary hover:underline font-medium"
              disabled={isSubmitting}
            >
              Sign in
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <RegisterForm />
 * 
 * // With custom sign in handler
 * <RegisterForm onSignIn={() => setActiveTab('login')} />
 * 
 * // With custom styling
 * <RegisterForm className="shadow-lg" />
 */