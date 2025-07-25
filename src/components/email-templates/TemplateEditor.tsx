"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Save, 
  Eye, 
  Send, 
  ArrowLeft,
  FileText,
  Settings,
  Palette,
  Code2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  templateFormSchema, 
  type TemplateFormData,
  TEMPLATE_CATEGORIES,
  TEMPLATE_TAGS,
} from '@/schemas/template.schema';
import RichTextEditor from './RichTextEditor';
import VariableInserter from './VariableInserter';

interface TemplateEditorProps {
  initialData?: Partial<TemplateFormData>;
  onSave?: (data: TemplateFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function TemplateEditor({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  mode = 'create'
}: TemplateEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  
  const [activeTab, setActiveTab] = useState('content');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      subject: initialData?.subject || '',
      content: initialData?.content || '',
      type: initialData?.type || 'custom',
      isDefault: initialData?.isDefault || false,
      category: initialData?.category || '',
      tags: initialData?.tags || [],
      description: initialData?.description || '',
    },
  });

  const watchedContent = form.watch('content');
  const watchedType = form.watch('type');

  // Handle form submission
  const onSubmit = async (data: TemplateFormData) => {
    try {
      const templateData = {
        ...data,
        tags: selectedTags,
      };

      if (onSave) {
        await onSave(templateData);
        toast({
          title: `Template ${mode === 'create' ? 'Created' : 'Updated'}`,
          description: `Your email template has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} template. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle variable insertion
  const handleVariableInsert = (variable: string) => {
    const currentContent = form.getValues('content');
    const newContent = currentContent + ' ' + variable;
    form.setValue('content', newContent);
    
    // If using ref, we could insert at cursor position
    if (editorRef.current) {
      editorRef.current.insertText(variable);
    }
  };

  // Handle tag management
  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };

  // Template validation
  const getValidationStatus = () => {
    const { name, subject, content } = form.getValues();
    const hasBasicInfo = Boolean(name && subject && content);
    const hasVariables = content.includes('{{') && content.includes('}}');
    
    return {
      hasBasicInfo,
      hasVariables,
      isValid: hasBasicInfo && content.length > 10,
    };
  };

  const validationStatus = getValidationStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onCancel || (() => router.back())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'create' ? 'Create Email Template' : 'Edit Email Template'}
            </h1>
            <p className="text-muted-foreground">
              Design professional email templates with dynamic variables and rich formatting.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Validation Status */}
          <div className="flex items-center space-x-2">
            {validationStatus.isValid ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
          
          <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor - Left Column */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Style
                  </TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Template Content</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Create your email content with rich formatting and dynamic variables.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Template Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Invoice Reminder Template" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subject Line */}
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject Line</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Invoice {{invoiceNumber}} - Payment Due" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Use variables like {'{{clientName}}'} for dynamic content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Rich Text Content */}
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Content</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                ref={editorRef}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Write your email content here..."
                                onVariableInsert={handleVariableInsert}
                                maxHeight={400}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Template Settings</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure template type, category, and metadata.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Template Type */}
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="invoice">Invoice Template</SelectItem>
                                <SelectItem value="reminder">Payment Reminder</SelectItem>
                                <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                                <SelectItem value="custom">Custom Template</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TEMPLATE_CATEGORIES.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of when to use this template..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tags */}
                      <div className="space-y-3">
                        <FormLabel>Tags</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {TEMPLATE_TAGS.map((tag) => (
                            <Badge
                              key={tag}
                              variant={selectedTags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Template Styling</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Customize the appearance and branding of your template.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Brand Colors */}
                      <div className="space-y-3">
                        <FormLabel>Brand Colors</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Color</label>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded border-2 border-muted bg-blue-600" />
                              <Input placeholder="#3B82F6" disabled />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Accent Color</label>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded border-2 border-muted bg-green-600" />
                              <Input placeholder="#10B981" disabled />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="space-y-3">
                        <FormLabel>Typography</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Font Family</label>
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="Arial, sans-serif" />
                              </SelectTrigger>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Font Size</label>
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="14px" />
                              </SelectTrigger>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Template Layout */}
                      <div className="space-y-3">
                        <FormLabel>Template Layout</FormLabel>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 border rounded-lg text-center cursor-pointer hover:bg-muted transition-colors">
                            <div className="w-full h-12 bg-muted rounded mb-2" />
                            <span className="text-sm">Minimal</span>
                          </div>
                          <div className="p-4 border-2 border-primary rounded-lg text-center cursor-pointer">
                            <div className="w-full h-12 bg-primary/20 rounded mb-2" />
                            <span className="text-sm font-medium">Professional</span>
                          </div>
                          <div className="p-4 border rounded-lg text-center cursor-pointer hover:bg-muted transition-colors">
                            <div className="w-full h-12 bg-muted rounded mb-2" />
                            <span className="text-sm">Modern</span>
                          </div>
                        </div>
                      </div>

                      {/* Coming Soon Notice */}
                      <div className="text-center py-4 text-muted-foreground border-t">
                        <p className="text-sm">
                          🚀 Advanced styling features including custom CSS, brand asset upload, and layout customization coming in the next update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel || (() => router.back())}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !validationStatus.isValid}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Create Template' : 'Update Template'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Variable Inserter - Right Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <VariableInserter
              onVariableInsert={handleVariableInsert}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateEditor;