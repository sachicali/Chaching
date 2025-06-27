"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { 
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Save
} from "lucide-react";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Invoice } from "@/types/database.types";

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.enum([
    "Bank Transfer",
    "PayPal", 
    "Wise",
    "GCash",
    "Credit Card",
    "Cash",
    "Other"
  ]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  invoice: Invoice;
  onClose: () => void;
}

export function PaymentForm({ invoice, onClose }: PaymentFormProps) {
  const { recordPayment } = useInvoiceContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate remaining amount to be paid
  const remainingAmount = invoice.total; // In a real implementation, this would account for partial payments

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency === 'PHP' ? 'PHP' : currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: remainingAmount,
      paymentDate: new Date(),
      paymentMethod: "Bank Transfer",
      reference: "",
      notes: "",
    },
  });

  const watchedAmount = form.watch("amount");

  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      await recordPayment(invoice.id, {
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Record Payment
          </h2>
          <p className="text-muted-foreground">
            Record payment for Invoice {invoice.invoiceNumber}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Invoice #:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Client:</span>
              <span className="font-medium">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span className="font-medium">{invoice.currency}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Amount Due:</span>
              <span>{formatCurrency(remainingAmount, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount ({invoice.currency})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={remainingAmount}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Wise">Wise</SelectItem>
                        <SelectItem value="GCash">GCash</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction ID, check number, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional payment notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(watchedAmount, invoice.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">
                    {formatCurrency(Math.max(0, remainingAmount - watchedAmount), invoice.currency)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Status After Payment:</span>
                  <span className={watchedAmount >= remainingAmount ? "text-green-600" : "text-orange-600"}>
                    {watchedAmount >= remainingAmount ? "Paid in Full" : "Partially Paid"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Recording...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}