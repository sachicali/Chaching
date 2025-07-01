"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import TemplateEditor from '@/components/email-templates/TemplateEditor';
import type { TemplateFormData } from '@/schemas/template.schema';

// Mock template data for editing
const mockTemplateData: Record<string, TemplateFormData> = {
  '1': {
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
  },
  '2': {
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
  },
};

interface EditTemplatePageProps {
  params: {
    id: string;
  };
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [templateData, setTemplateData] = useState<TemplateFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const template = mockTemplateData[params.id];
        if (template) {
          setTemplateData(template);
        } else {
          setIsNotFound(true);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load template data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid && params.id) {
      loadTemplate();
    }
  }, [user?.uid, params.id, toast]);

  const handleSave = async (data: TemplateFormData) => {
    try {
      // For Week 1, we'll simulate template update
      // In a real implementation, this would call the template service
      console.log('Updating template:', params.id, data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Template Updated',
        description: `Email template "${data.name}" has been updated successfully.`,
      });
      
      // Redirect back to templates list
      router.push('/email-templates');
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error; // Let TemplateEditor handle the error display
    }
  };

  const handleCancel = () => {
    router.push('/email-templates');
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to edit email templates.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading Template...</h1>
          <p className="text-muted-foreground">Please wait while we load the template data.</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template Not Found</h1>
          <p className="text-muted-foreground">The template you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/email-templates')}
            className="mt-4 text-primary hover:underline"
          >
            ← Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TemplateEditor
        mode="edit"
        initialData={templateData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}