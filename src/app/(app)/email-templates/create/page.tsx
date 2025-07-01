"use client";

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import TemplateEditor from '@/components/email-templates/TemplateEditor';
import type { TemplateFormData } from '@/schemas/template.schema';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async (data: TemplateFormData) => {
    try {
      // For Week 1, we'll simulate template creation
      // In a real implementation, this would call the template service
      console.log('Creating template:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Template Created',
        description: `Email template "${data.name}" has been created successfully.`,
      });
      
      // Redirect back to templates list
      router.push('/email-templates');
    } catch (error) {
      console.error('Failed to create template:', error);
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
          <p className="text-muted-foreground">Please sign in to create email templates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TemplateEditor
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}