"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import { useTransactions } from '@/contexts/TransactionContext';
import { useClients } from '@/contexts/ClientContext';
import type { 
  TransactionType, 
  CurrencyCode, 
  PaymentMethod,
  TransactionStatus 
} from '@/types/database.types';
import { cn } from '@/lib/utils';

// ============================================================================
// FORM SCHEMA AND TYPES
// ============================================================================

const transactionFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'PHP'] as const),
  date: z.date({
    required_error: 'Transaction date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['income', 'expense'] as const),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['pending', 'completed', 'cancelled'] as const).default('completed'),
  clientId: z.string().optional(),
  paymentMethod: z.enum([
    'bank_transfer',
    'credit_card', 
    'paypal',
    'gcash',
    'cash',
    'crypto',
    'other'
  ] as const).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  // Metadata fields
  projectName: z.string().optional(),
  notes: z.string().optional(),
  taxDeductible: z.boolean().default(false),
  tags: z.string().optional(), // Comma-separated tags
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface TransactionFormProps {
  type?: TransactionType;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TransactionFormData>;
  className?: string;
}

// ============================================================================
// PREDEFINED CATEGORIES
// ============================================================================

const INCOME_CATEGORIES = [
  'Project Payment',
  'Retainer Fee',
  'Consulting',
  'Bonus',
  'Royalty',
  'Investment Income',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Software Subscriptions',
  'Equipment',
  'Travel',
  'Marketing',
  'Professional Services',
  'Internet & Utilities',
  'Training & Education',
  'Business Meals',
  'Taxes & Fees',
  'Other Expenses'
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  paypal: 'PayPal',
  gcash: 'GCash',
  cash: 'Cash',
  crypto: 'Cryptocurrency',
  other: 'Other'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransactionForm({
  type = 'income',
  onSuccess,
  onCancel,
  defaultValues,
  className
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    defaultValues?.type || type
  );

  const { addTransaction } = useTransactions();
  const { clients } = useClients();

  // Form setup
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: selectedType,
      currency: 'PHP',
      date: new Date(),
      status: 'completed',
      taxDeductible: false,
      ...defaultValues,
    },
  });

  // Watch form values for dynamic updates
  const watchedType = form.watch('type');
  const watchedCurrency = form.watch('currency');
  const watchedAmount = form.watch('amount');

  // Get categories based on transaction type
  const categories = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleTypeChange = useCallback((newType: TransactionType) => {
    setSelectedType(newType);
    form.setValue('type', newType);
    // Clear category when type changes
    form.setValue('category', '');
    // Clear client when switching to expense (optional for expenses)
    if (newType === 'expense') {
      form.setValue('clientId', undefined);
    }
  }, [form]);

  const onSubmit = useCallback(async (data: TransactionFormData) => {
    setIsSubmitting(true);

    try {
      // Parse tags
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined;

      // Prepare transaction data
      const transactionData = {
        amount: data.amount,
        currency: data.currency,
        date: data.date,
        description: data.description,
        type: data.type,
        category: data.category,
        status: data.status,
        clientId: data.clientId,
        paymentMethod: data.paymentMethod,
        receiptUrl: data.receiptUrl || undefined,
        metadata: {
          projectName: data.projectName,
          notes: data.notes,
          taxDeductible: data.taxDeductible,
          tags,
        },
      };

      await addTransaction(transactionData);
      
      // Reset form
      form.reset({
        type: selectedType,
        currency: 'PHP',
        date: new Date(),
        status: 'completed',
        taxDeductible: false,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [addTransaction, form, selectedType, onSuccess]);

  // ============================================================================
  // CURRENCY CONVERSION DISPLAY
  // ============================================================================

  const getPhpEquivalent = useCallback((amount: number, currency: CurrencyCode): number => {
    const rates: Record<CurrencyCode, number> = {
      PHP: 1.00,
      USD: 58.75,
      EUR: 63.50
    };
    return amount * rates[currency];
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedType === 'income' ? (
            <PlusIcon className="h-5 w-5 text-green-500" />
          ) : (
            <MinusIcon className="h-5 w-5 text-red-500" />
          )}
          Add {selectedType === 'income' ? 'Income' : 'Expense'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type Toggle */}
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant={selectedType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('income')}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Income
              </Button>
              <Button
                type="button"
                variant={selectedType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('expense')}
                className="flex items-center gap-2"
              >
                <MinusIcon className="h-4 w-4" />
                Expense
              </Button>
            </div>

            <Separator />

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PHP">PHP (₱)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PHP Equivalent Display */}
            {watchedAmount > 0 && watchedCurrency !== 'PHP' && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  PHP Equivalent: ₱{getPhpEquivalent(watchedAmount, watchedCurrency).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Brief description of this ${selectedType}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Selection (for income) */}
            {selectedType === 'income' && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.company && `(${client.company})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associate this income with a specific client
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Payment Method and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Project or job reference"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tags separated by commas"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to help categorize and search transactions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or details"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax Deductible Toggle (for expenses) */}
              {selectedType === 'expense' && (
                <FormField
                  control={form.control}
                  name="taxDeductible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Tax Deductible
                        </FormLabel>
                        <FormDescription>
                          Mark this expense as tax deductible for business purposes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="receiptUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to receipt or invoice document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Adding...' : `Add ${selectedType === 'income' ? 'Income' : 'Expense'}`}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}