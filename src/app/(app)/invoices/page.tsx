"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Send,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  User
} from "lucide-react";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useClients } from "@/contexts/ClientContext";
import { Invoice } from "@/types/database.types";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { cn } from "@/lib/utils";

// Status configuration for invoice display
const statusConfig = {
  draft: { label: "Draft", icon: Edit, color: "bg-gray-500" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-500" },
  viewed: { label: "Viewed", icon: Eye, color: "bg-purple-500" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-green-500" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-gray-400" },
} as const;

type InvoiceStatus = keyof typeof statusConfig;

export default function InvoicesPage() {
  const {
    state: { invoices, isLoading, error },
    loadInvoices,
    updateInvoice,
    duplicateInvoice,
    deleteInvoice,
    sendInvoice,
    generateInvoicePDF,
  } = useInvoiceContext();
  
  const { clients } = useClients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesClient = clientFilter === "all" || invoice.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Group invoices by status for analytics
  const invoicesByStatus = invoices.reduce((acc: Record<InvoiceStatus, number>, invoice: Invoice) => {
    acc[invoice.status as InvoiceStatus] = (acc[invoice.status as InvoiceStatus] || 0) + 1;
    return acc;
  }, {} as Record<InvoiceStatus, number>);

  // Calculate totals
  const totalInvoiceValue = invoices.reduce((sum: number, invoice: Invoice) => 
    sum + invoice.total, 0
  );
  
  const paidInvoiceValue = invoices
    .filter((invoice: Invoice) => invoice.status === 'paid')
    .reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);

  // Format currency utility
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency === 'PHP' ? 'PHP' : currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowInvoiceForm(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      await duplicateInvoice(invoice.id);
    } catch (error) {
      console.error('Failed to duplicate invoice:', error);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        await deleteInvoice(invoice.id);
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };


  const handleStatusUpdate = async (invoice: Invoice, newStatus: InvoiceStatus) => {
    try {
      await updateInvoice(invoice.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to send invoice ${invoice.invoiceNumber} to ${invoice.clientEmail}?`)) {
      try {
        await sendInvoice(invoice.id);
      } catch (error) {
        console.error('Failed to send invoice:', error);
      }
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const blob = await generateInvoicePDF(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={cn("text-white", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const InvoiceActions = ({ invoice }: { invoice: Invoice }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
          <Send className="mr-2 h-4 w-4" />
          Send Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        {invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={() => {
            setSelectedInvoice(invoice);
            // In a real app, you'd open a payment modal here.
            // For now, we'll just log it.
            console.log('Record payment for', invoice.id);
          }}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice)} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading invoices: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your invoices and track payments
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(invoicesByStatus).map(([status, count]) => 
                `${count} ${status}`
              ).join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvoiceValue, 'PHP')}</div>
            <p className="text-xs text-muted-foreground">
              All invoices combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidInvoiceValue, 'PHP')}</div>
            <p className="text-xs text-muted-foreground">
              {invoicesByStatus.paid || 0} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvoiceValue - paidInvoiceValue, 'PHP')}
            </div>
            <p className="text-xs text-muted-foreground">
              {(invoicesByStatus.sent || 0) + (invoicesByStatus.viewed || 0) + (invoicesByStatus.overdue || 0)} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || clientFilter !== "all"
                        ? "No invoices match your filters"
                        : "No invoices created yet"}
                    </div>
                    {(!searchTerm && statusFilter === "all" && clientFilter === "all") && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={handleCreateInvoice}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Invoice
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>
                      {invoice.issueDate.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status as InvoiceStatus} />
                    </TableCell>
                    <TableCell>
                      <InvoiceActions invoice={invoice} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <InvoiceForm 
            invoice={editingInvoice}
            onClose={() => {
              setShowInvoiceForm(false);
              setEditingInvoice(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <InvoiceDetail
              invoice={selectedInvoice}
              onClose={() => {
                setShowInvoiceDetail(false);
                setSelectedInvoice(null);
              }}
              onEdit={() => {
                setEditingInvoice(selectedInvoice);
                setShowInvoiceDetail(false);
                setShowInvoiceForm(true);
              }}
              onRecordPayment={() => {
                // This will be handled by a separate modal
                console.log('Record payment for', selectedInvoice.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
