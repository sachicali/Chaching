// PDF Service - Chaching Financial Management Application
// This service handles all PDF generation operations, including template management and branding.

import { Invoice, InvoiceTemplate } from '@/types/database.types';
import { renderToStream } from '@react-pdf/renderer';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ProfessionalTemplate from '@/components/invoices/pdf-templates/ProfessionalTemplate';
import ModernTemplate from '@/components/invoices/pdf-templates/ModernTemplate';
import MinimalTemplate from '@/components/invoices/pdf-templates/MinimalTemplate';
import React from 'react';
import { TemplateService } from './template.service';
import { LRUCache } from 'lru-cache';

const templates = {
  professional: ProfessionalTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
};

// Cache for generated PDFs to improve performance
const pdfCache = new LRUCache<string, string>({
  max: 100, // Maximum number of items in cache
  ttl: 1000 * 60 * 15, // 15 minutes TTL
});

export class PdfService {
  private userId: string;
  private templateService: TemplateService;

  constructor(userId: string) {
    this.userId = userId;
    this.templateService = new TemplateService(userId);
  }

  /**
   * Generate a PDF for a given invoice, apply a template, and upload it to Firebase Storage.
   * @param invoice - The invoice data.
   * @param templateId - The ID of the template to apply.
   * @param branding - Custom branding options.
   * @returns The public URL of the generated PDF.
   */
  async generateInvoicePdf(
    invoice: Invoice,
    templateId?: string,
    branding?: { logoUrl?: string; colorScheme?: string }
  ): Promise<string> {
    const cacheKey = `${invoice.id}-${templateId || 'default'}-${JSON.stringify(branding)}`;
    if (pdfCache.has(cacheKey)) {
      return pdfCache.get(cacheKey)!;
    }

    try {
      const selectedTemplateId = templateId || invoice.templateId || 'professional';
      const template = await this.templateService.getTemplateById(selectedTemplateId);
      
      const TemplateComponent = this.getTemplateComponent(template);

      const customizedInvoice = this.applyBranding(invoice, branding, template);

      const pdfStream = await renderToStream(React.createElement(TemplateComponent, { invoice: customizedInvoice }));

      const storage = getStorage();
      const storageRef = ref(storage, `invoices/${this.userId}/${invoice.id}/${selectedTemplateId}.pdf`);

      const chunks = [];
      for await (const chunk of pdfStream) {
        chunks.push(chunk);
      }
      const pdfBlob = new Blob(chunks, { type: 'application/pdf' });

      const snapshot = await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      pdfCache.set(cacheKey, downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Error generating or uploading PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  /**
   * Get the React component for a given template.
   */
  private getTemplateComponent(template: InvoiceTemplate | null) {
    const layout = template?.layout || 'professional';
    return templates[layout as keyof typeof templates] || ProfessionalTemplate;
  }

  /**
   * Apply branding customizations to an invoice.
   */
  private applyBranding(
    invoice: Invoice,
    branding?: { logoUrl?: string; colorScheme?: string },
    template?: InvoiceTemplate | null
  ): Invoice {
    const customizedInvoice = { ...invoice };

    if (branding?.logoUrl) {
      customizedInvoice.businessInfo.logoUrl = branding.logoUrl;
    } else if (template?.businessInfoTemplate.logoUrl) {
      customizedInvoice.businessInfo.logoUrl = template.businessInfoTemplate.logoUrl;
    }

    // Color scheme application would happen within the template component
    // We can pass the color scheme as a prop if needed.
    
    return customizedInvoice;
  }

  /**
   * Invalidate the cache for a specific invoice.
   */
  invalidateInvoiceCache(invoiceId: string) {
    for (const key of pdfCache.keys()) {
      if (key.startsWith(invoiceId)) {
        pdfCache.delete(key);
      }
    }
  }

  /**
   * Delete all PDFs associated with an invoice.
   */
  async deleteInvoicePdfs(invoiceId: string): Promise<void> {
    try {
      this.invalidateInvoiceCache(invoiceId);
      const storage = getStorage();
      // This is a simplified deletion. A more robust solution would list all files in the directory.
      const storageRef = ref(storage, `invoices/${this.userId}/${invoiceId}/`);
      // As listing is complex on client-side, we assume a naming convention to delete known templates.
      const knownTemplates = ['professional.pdf', 'modern.pdf', 'minimal.pdf', 'default.pdf'];
      for(const templateName of knownTemplates) {
        try {
          await deleteObject(ref(storage, `invoices/${this.userId}/${invoiceId}/${templateName}`));
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            console.warn(`Could not delete ${templateName} for invoice ${invoiceId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting invoice PDFs:', error);
      throw new Error('Failed to delete invoice PDFs');
    }
  }
}

export default PdfService;