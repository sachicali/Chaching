"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import TemplateList from '@/components/email-templates/TemplateList';
import type { TemplateFormData } from '@/schemas/template.schema';

// Mock template data for Week 1 implementation
interface EmailTemplate extends TemplateFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Invoice Payment Request',
    subject: 'Invoice {{invoiceNumber}} - Payment Due',
    content: `
      <p>Hello {{clientName}},</p>
      
      <p>I hope this email finds you well. I wanted to follow up regarding invoice {{invoiceNumber}} for {{invoiceAmount}} that was issued on {{invoiceDate}}.</p>
      
      <p>According to our records, this invoice is due for payment on {{dueDate}}. If you have already processed the payment, please disregard this message.</p>
      
      <p>If you have any questions about this invoice or need any clarification, please don't hesitate to reach out.</p>
      
      <p>Thank you for your business!</p>
      
      <p>Best regards,<br>{{businessName}}</p>
    `,
    type: 'invoice',
    isDefault: true,
    category: 'invoice',
    tags: ['professional', 'formal'],
    description: 'Standard invoice payment request template',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    usageCount: 45,
    lastUsed: new Date('2024-01-25'),
  },
  {
    id: '2',
    name: 'Payment Reminder - Friendly',
    subject: 'Friendly Reminder: Invoice {{invoiceNumber}}',
    content: `
      <p>Hi {{clientName}},</p>
      
      <p>Just a friendly reminder that invoice {{invoiceNumber}} for {{invoiceAmount}} was due on {{dueDate}}.</p>
      
      <p>I understand that things can get busy, so I wanted to reach out to see if you need any assistance with the payment process or if there are any questions about the invoice.</p>
      
      <p>Please let me know if there's anything I can help with to make this process smoother.</p>
      
      <p>Thanks!</p>
      
      <p>{{businessName}}</p>
    `,
    type: 'reminder',
    isDefault: false,
    category: 'reminder',
    tags: ['friendly', 'follow_up'],
    description: 'Gentle payment reminder with a friendly tone',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    usageCount: 23,
    lastUsed: new Date('2024-01-22'),
  },
  {
    id: '3',
    name: 'Payment Confirmation',
    subject: 'Payment Received - Thank You!',
    content: `
      <p>Dear {{clientName}},</p>
      
      <p>Thank you for your payment! I'm writing to confirm that we have successfully received your payment of {{invoiceAmount}} for invoice {{invoiceNumber}}.</p>
      
      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Invoice Number: {{invoiceNumber}}</li>
        <li>Amount: {{invoiceAmount}}</li>
        <li>Payment Date: {{currentDate}}</li>
      </ul>
      
      <p>I appreciate your prompt payment and continued business. If you need a receipt or have any questions, please don't hesitate to reach out.</p>
      
      <p>Looking forward to working with you again!</p>
      
      <p>Best regards,<br>{{businessName}}</p>
    `,
    type: 'payment_confirmation',
    isDefault: true,
    category: 'confirmation',
    tags: ['thank_you', 'professional'],
    description: 'Confirmation email for received payments',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
    usageCount: 67,
    lastUsed: new Date('2024-01-26'),
  },
  {
    id: '4',
    name: 'Welcome New Client',
    subject: 'Welcome to {{businessName}} - Let\'s Get Started!',
    content: `
      <p>Hello {{clientName}},</p>
      
      <p>Welcome to {{businessName}}! I'm thrilled to have you as a new client and look forward to working together.</p>
      
      <p>Here's what you can expect from our partnership:</p>
      <ul>
        <li>Professional and timely service delivery</li>
        <li>Clear communication throughout our projects</li>
        <li>Transparent invoicing and payment processes</li>
      </ul>
      
      <p>If you have any questions or need anything to get started, please don't hesitate to reach out. I'm here to help!</p>
      
      <p>Thank you for choosing {{businessName}}.</p>
      
      <p>Best regards,<br>{{businessName}}<br>{{businessEmail}}<br>{{businessPhone}}</p>
    `,
    type: 'custom',
    isDefault: false,
    category: 'welcome',
    tags: ['welcome', 'professional', 'onboarding'],
    description: 'Welcome email for new clients',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
    usageCount: 12,
    lastUsed: new Date('2024-01-24'),
  },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize mock data
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setTemplates(mockTemplates);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load email templates.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid) {
      loadTemplates();
    }
  }, [user?.uid, toast]);

  // Handle template actions
  const handleCreateNew = () => {
    router.push('/email-templates/create');
  };

  const handleEdit = (template: EmailTemplate) => {
    router.push(`/email-templates/edit/${template.id}`);
  };

  const handlePreview = (template: EmailTemplate) => {
    // For Week 1, we'll show a simple preview in a modal or new page
    toast({
      title: 'Preview Feature',
      description: `Template preview for "${template.name}" will be available in the next update.`,
    });
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const duplicatedTemplate: EmailTemplate = {
        ...template,
        id: `${template.id}_copy_${Date.now()}`,
        name: `${template.name} (Copy)`,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        lastUsed: undefined,
      };

      setTemplates(prev => [duplicatedTemplate, ...prev]);
      
      toast({
        title: 'Template Duplicated',
        description: `"${template.name}" has been duplicated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      toast({
        title: 'Template Deleted',
        description: 'Email template has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleUse = (template: EmailTemplate) => {
    // For Week 1, redirect to email composition or show usage dialog
    toast({
      title: 'Use Template',
      description: `Using template "${template.name}". This will integrate with the email system in the next phase.`,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <TemplateList
        templates={templates}
        isLoading={isLoading}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onPreview={handlePreview}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onUse={handleUse}
      />
    </div>
  );
}