"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X,
  Edit,
  Download,
  Send,
  DollarSign,
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import { Invoice } from "@/types/database.types";
import { useClients } from "@/contexts/ClientContext";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onRecordPayment: () => void;
}

export function InvoiceDetail({ invoice, onClose, onEdit, onRecordPayment }: InvoiceDetailProps) {
  const { clients } = useClients();
  const { sendInvoice, generateInvoicePDF } = useInvoiceContext();
  const { toast } = useToast();
  
  const client = clients.find(c => c.id === invoice.clientId);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency === 'PHP' ? 'PHP' : currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  // Status configuration
  const statusConfig = {
    draft: { label: "Draft", icon: Edit, color: "bg-gray-500" },
    sent: { label: "Sent", icon: Send, color: "bg-blue-500" },
    viewed: { label: "Viewed", icon: Eye, color: "bg-purple-500" },
    paid: { label: "Paid", icon: CheckCircle, color: "bg-green-500" },
    overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-500" },
    cancelled: { label: "Cancelled", icon: X, color: "bg-gray-400" },
  };

  const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`text-white ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Invoice {invoice.invoiceNumber}
          </h2>
          <p className="text-muted-foreground">
            Invoice details and payment information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status as keyof typeof statusConfig} />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">{invoice.clientName}</h4>
              <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
            </div>
            
            {client?.company && (
              <div>
                <span className="text-sm font-medium">Company:</span>
                <p className="text-sm text-muted-foreground">{client.company}</p>
              </div>
            )}
            
            {client?.phone && (
              <div>
                <span className="text-sm font-medium">Phone:</span>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            )}
            
            {invoice.clientAddress && (
              <div>
                <span className="text-sm font-medium">Address:</span>
                <div className="text-sm text-muted-foreground">
                  {invoice.clientAddress.street && <p>{invoice.clientAddress.street}</p>}
                  {(invoice.clientAddress.city || invoice.clientAddress.state || invoice.clientAddress.postalCode) && (
                    <p>
                      {[
                        invoice.clientAddress.city,
                        invoice.clientAddress.state,
                        invoice.clientAddress.postalCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {invoice.clientAddress.country && <p>{invoice.clientAddress.country}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Invoice #:</span>
                <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Currency:</span>
                <p className="text-sm text-muted-foreground">{invoice.currency}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Issue Date:</span>
                <p className="text-sm text-muted-foreground">
                  {invoice.issueDate.toDate().toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Due Date:</span>
                <p className="text-sm text-muted-foreground">
                  {invoice.dueDate.toDate().toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Payment Terms:</span>
              <p className="text-sm text-muted-foreground">{invoice.paymentTerms}</p>
            </div>
            
            {invoice.sentAt && (
              <div>
                <span className="text-sm font-medium">Sent Date:</span>
                <p className="text-sm text-muted-foreground">
                  {invoice.sentAt.toDate().toLocaleDateString()}
                </p>
              </div>
            )}
            
            {invoice.paidAt && (
              <div>
                <span className="text-sm font-medium">Paid Date:</span>
                <p className="text-sm text-muted-foreground">
                  {invoice.paidAt.toDate().toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.lineItems.map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-start border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex-1">
                  <h4 className="font-medium">{item.description}</h4>
                  {item.category && (
                    <p className="text-sm text-muted-foreground">Category: {item.category}</p>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.quantity} × {formatCurrency(item.rate, invoice.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.amount, invoice.currency)}
                  </p>
                  {item.isTaxable && (
                    <p className="text-xs text-muted-foreground">Taxable</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Invoice Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            
            {invoice.discount && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount ({invoice.discount.type === 'percentage' ? `${invoice.discount.value}%` : 'Fixed'}):
                </span>
                <span>-{formatCurrency(invoice.discount.amount, invoice.currency)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Tax ({invoice.taxRate}%):</span>
              <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            
            {invoice.currency !== 'PHP' && invoice.totalPHP && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total (PHP):</span>
                <span>{formatCurrency(invoice.totalPHP, 'PHP')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        {invoice.status !== 'paid' && (
          <Button onClick={onRecordPayment}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
        
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Invoice
        </Button>
        
        <Button variant="outline" onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        
        {invoice.status === 'draft' && (
          <Button onClick={handleSendInvoice}>
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </Button>
        )}
      </div>
    </div>
  );

  async function handleSendInvoice() {
    try {
      await sendInvoice(invoice.id);
      toast({
        title: 'Invoice Sent',
        description: `Invoice ${invoice.invoiceNumber} has been sent to ${invoice.clientEmail}.`,
      });
    } catch (error) {
      toast({
        title: 'Error Sending Invoice',
        description: 'An error occurred while sending the invoice. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleDownloadPDF() {
    try {
      const pdfBlob = await generateInvoicePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error Downloading PDF',
        description: 'An error occurred while downloading the PDF. Please try again.',
        variant: 'destructive',
      });
    }
  }
}