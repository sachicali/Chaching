"use client";

import { useState, useCallback } from 'react';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useClients } from '@/contexts/ClientContext';
import type { 
  TransactionFilters as TFilters,
  TransactionType,
  TransactionStatus,
  CurrencyCode,
  PaymentMethod
} from '@/types/database.types';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT PROPS AND TYPES
// ============================================================================

interface TransactionFiltersProps {
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
  onClearFilters: () => void;
  className?: string;
  showAsSheet?: boolean;
  trigger?: React.ReactNode;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

// ============================================================================
// PREDEFINED OPTIONS
// ============================================================================

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' }
];

const TRANSACTION_STATUSES: { value: TransactionStatus; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' }
];

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'PHP', label: 'PHP (₱)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' }
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'gcash', label: 'GCash' },
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' }
];

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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getActiveFilterCount = (filters: TFilters): number => {
  let count = 0;
  
  if (filters.type) count++;
  if (filters.status) count++;
  if (filters.currency) count++;
  if (filters.clientId) count++;
  if (filters.category) count++;
  if (filters.paymentMethod) count++;
  if (filters.startDate) count++;
  if (filters.endDate) count++;
  if (filters.minAmount !== undefined) count++;
  if (filters.maxAmount !== undefined) count++;
  
  return count;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransactionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  showAsSheet = false,
  trigger
}: TransactionFiltersProps) {
  const { clients } = useClients();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState<TFilters>(filters);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: filters.startDate?.toDate(),
    to: filters.endDate?.toDate()
  });

  const activeFilterCount = getActiveFilterCount(filters);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFilterChange = useCallback((key: keyof TFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    setLocalFilters(prev => ({
      ...prev,
      startDate: range.from ? { toDate: () => range.from! } as any : undefined,
      endDate: range.to ? { toDate: () => range.to! } as any : undefined
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    const emptyFilters: TFilters = {};
    setLocalFilters(emptyFilters);
    setDateRange({});
    onClearFilters();
    setIsOpen(false);
  }, [onClearFilters]);

  const handleResetToApplied = useCallback(() => {
    setLocalFilters(filters);
    setDateRange({
      from: filters.startDate?.toDate(),
      to: filters.endDate?.toDate()
    });
  }, [filters]);

  // ============================================================================
  // RENDER FILTER CONTENT
  // ============================================================================

  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Basic Filters */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="type-filter">Transaction Type</Label>
          <Select
            value={localFilters.type || ''}
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {TRANSACTION_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {TRANSACTION_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="currency-filter">Currency</Label>
          <Select
            value={localFilters.currency || ''}
            onValueChange={(value) => handleFilterChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All currencies</SelectItem>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Client and Category Filters */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="client-filter">Client</Label>
          <Select
            value={localFilters.clientId || ''}
            onValueChange={(value) => handleFilterChange('clientId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={localFilters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {/* Income categories */}
              <SelectItem value="" disabled className="font-semibold">
                Income Categories
              </SelectItem>
              {INCOME_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
              {/* Expense categories */}
              <SelectItem value="" disabled className="font-semibold">
                Expense Categories
              </SelectItem>
              {EXPENSE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment-method-filter">Payment Method</Label>
          <Select
            value={localFilters.paymentMethod || ''}
            onValueChange={(value) => handleFilterChange('paymentMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All payment methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All payment methods</SelectItem>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Date Range Filter */}
      <div className="space-y-4">
        <Label>Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => handleDateRangeChange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => handleDateRangeChange({ ...dateRange, to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Amount Range Filter */}
      <div className="space-y-4">
        <Label>Amount Range (PHP)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min amount"
              value={localFilters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max amount"
              value={localFilters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', parseFloat(e.target.value) || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
        <Button variant="outline" onClick={handleResetToApplied} className="w-full">
          Reset
        </Button>
        <Button variant="outline" onClick={handleClearFilters} className="w-full">
          Clear All
        </Button>
        <Button onClick={handleApplyFilters} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER TRIGGER BUTTON
  // ============================================================================

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <FilterIcon className="h-4 w-4 mr-2" />
      Filters
      {activeFilterCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (showAsSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter Transactions</SheetTitle>
            <SheetDescription>
              Apply filters to narrow down your transaction list.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {renderFilterContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filter Transactions</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          {renderFilterContent()}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// ACTIVE FILTERS DISPLAY COMPONENT
// ============================================================================

interface ActiveFiltersDisplayProps {
  filters: TFilters;
  onRemoveFilter: (key: keyof TFilters) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}: ActiveFiltersDisplayProps) {
  const { clients, getClientById } = useClients();
  const activeFilterCount = getActiveFilterCount(filters);

  if (activeFilterCount === 0) return null;

  const getFilterLabel = (key: keyof TFilters, value: any): string => {
    switch (key) {
      case 'type':
        return `Type: ${value === 'income' ? 'Income' : 'Expense'}`;
      case 'status':
        return `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'currency':
        return `Currency: ${value}`;
      case 'clientId':
        const client = getClientById(value);
        return `Client: ${client?.name || 'Unknown'}`;
      case 'category':
        return `Category: ${value}`;
      case 'paymentMethod':
        const method = PAYMENT_METHODS.find(m => m.value === value);
        return `Payment: ${method?.label || value}`;
      case 'startDate':
        return `From: ${format((value as any).toDate(), 'MMM dd, yyyy')}`;
      case 'endDate':
        return `To: ${format((value as any).toDate(), 'MMM dd, yyyy')}`;
      case 'minAmount':
        return `Min: ₱${value.toLocaleString()}`;
      case 'maxAmount':
        return `Max: ₱${value.toLocaleString()}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      
      {Object.entries(filters).map(([key, value]) => {
        if (value === undefined || value === null || value === '') return null;
        
        return (
          <Badge key={key} variant="secondary" className="gap-1">
            {getFilterLabel(key as keyof TFilters, value)}
            <button
              onClick={() => onRemoveFilter(key as keyof TFilters)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs"
      >
        Clear all
      </Button>
    </div>
  );
}