'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInvoiceContext } from '@/contexts/InvoiceContext';
import { Invoice, InvoiceTemplate } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// PDF.js worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  invoice: Invoice;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ invoice }) => {
  const { generateInvoicePDF, sendInvoice, state } = useInvoiceContext();
  const { templates } = state;
  const { toast } = useToast();

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(invoice.templateId || 'professional');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const generatePdf = useCallback(async (templateId: string) => {
    setIsLoading(true);
    try {
      const blob = await generateInvoicePDF(invoice);
      setPdfBlob(blob);
    } catch (error) {
      toast({
        title: 'Error Generating PDF',
        description: 'Could not generate the PDF preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateInvoicePDF, invoice, toast]);

  useEffect(() => {
    generatePdf(selectedTemplate);
  }, [selectedTemplate, generatePdf]);

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendInvoice(invoice.id);
      toast({
        title: 'Invoice Sent',
        description: `Invoice ${invoice.invoiceNumber} has been sent to ${invoice.clientEmail}.`,
      });
    } catch (error) {
      toast({
        title: 'Error Sending Invoice',
        description: 'Could not send the invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template: InvoiceTemplate) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={!pdfBlob || isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleSend} disabled={!pdfBlob || isLoading || isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pdfBlob ? (
          <Document
            file={pdfBlob}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error: Error) => console.error('Failed to load PDF:', error)}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={800}
              />
            ))}
          </Document>
        ) : (
          <div className="flex justify-center items-center h-96">
            <p>Could not load PDF preview.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;