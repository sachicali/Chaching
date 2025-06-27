"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  Save, 
  Send, 
  X,
  Calculator,
  Calendar,
  User
} from "lucide-react";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useClients } from "@/contexts/ClientContext";
import { Invoice, InvoiceFormData, CurrencyCode } from "@/types/database.types";
import { cn } from "@/lib/utils";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be 0 or greater"),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  isTaxable: z.boolean().optional(),
  taxRate: z.number().optional(),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  currency: z.enum(["USD", "EUR", "PHP"]),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  discount: z.object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0),
    description: z.string().optional(),
  }).optional(),
  templateId: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onClose: () => void;
}

export function InvoiceForm({ invoice, onClose }: InvoiceFormProps) {
  const { 
    createInvoice, 
    updateInvoice,
    calculateInvoiceTotal,
    state: { isLoading, templates }
  } = useInvoiceContext();
  
  const { clients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      issueDate: invoice ? invoice.issueDate.toDate() : new Date(),
      dueDate: invoice ? invoice.dueDate.toDate() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: invoice?.currency || "PHP",
      lineItems: invoice?.lineItems?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        category: item.category,
        categoryId: item.categoryId,
        isTaxable: item.isTaxable,
        taxRate: item.taxRate,
      })) || [
        {
          description: "",
          quantity: 1,
          rate: 0,
          category: "",
          categoryId: "",
          isTaxable: true,
          taxRate: 12,
        }
      ],
      paymentTerms: invoice?.paymentTerms || "Net 30",
      notes: invoice?.notes || "",
      taxRate: invoice?.taxRate || 12,
      discount: invoice?.discount ? {
        type: invoice.discount.type,
        value: invoice.discount.value,
        description: invoice.discount.description,
      } : undefined,
      templateId: invoice?.templateId || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedLineItems = form.watch("lineItems");
  const watchedTaxRate = form.watch("taxRate");
  const watchedDiscount = form.watch("discount");

  // Calculate totals in real-time
  const subtotal = watchedLineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);

  const discountAmount = watchedDiscount 
    ? watchedDiscount.type === "percentage" 
      ? subtotal * (watchedDiscount.value / 100)
      : watchedDiscount.value
    : 0;

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = discountedSubtotal * (watchedTaxRate / 100);
  const total = discountedSubtotal + taxAmount;

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency === 'PHP' ? 'PHP' : currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      const formData: InvoiceFormData = {
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency,
        lineItems: data.lineItems.map((item, index) => ({
          ...item,
          id: `item_${index}`,
          amount: item.quantity * item.rate,
        })),
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        taxRate: data.taxRate,
        discount: data.discount,
        templateId: data.templateId,
      };

      if (invoice) {
        // For updates, we need to convert Date objects to Timestamps
        const updateData = {
          ...formData,
          issueDate: Timestamp.fromDate(data.issueDate),
          dueDate: Timestamp.fromDate(data.dueDate),
        };
        await updateInvoice(invoice.id, updateData as Partial<Invoice>);
      } else {
        await createInvoice(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLineItem = () => {
    append({
      description: "",
      quantity: 1,
      rate: 0,
      category: "",
      categoryId: "",
      isTaxable: true,
      taxRate: watchedTaxRate,
    });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <p className="text-muted-foreground">
            {invoice ? 'Update invoice details' : 'Fill in the details below to create a new invoice'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
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

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
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
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Net 90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Description of work..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
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
                        name={`lineItems.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 text-right">
                      <span className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(
                          (watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.rate || 0),
                          form.watch("currency")
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tax and Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Tax & Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Totals Display */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, form.watch("currency"))}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount, form.watch("currency"))}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tax ({watchedTaxRate}%):</span>
                  <span>{formatCurrency(taxAmount, form.watch("currency"))}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(total, form.watch("currency"))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or payment instructions..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {invoice ? 'Update Invoice' : 'Create Invoice'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}