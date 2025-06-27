'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInvoiceContext } from '@/contexts/InvoiceContext';
import { InvoiceTemplate, InvoiceTemplateFormData } from '@/types/database.types';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';

const brandingFormSchema = z.object({
  logo: z.any().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
  fontFamily: z.string(),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

interface BrandingCustomizerProps {
  template: InvoiceTemplate;
  onBrandingChange: (branding: Partial<InvoiceTemplateFormData>) => void;
}

const BrandingCustomizer: React.FC<BrandingCustomizerProps> = ({ template, onBrandingChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      primaryColor: template.colors.primary,
      fontFamily: template.fonts.heading,
    },
  });

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setIsUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `branding/${user.uid}/logos/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      toast({
        title: 'Logo Upload Failed',
        description: 'Could not upload the logo. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BrandingFormValues) => {
    let logoUrl: string | undefined = template.businessInfoTemplate.logoUrl;
    if (data.logo && data.logo[0]) {
      const uploadedUrl = await handleLogoUpload(data.logo[0]);
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      } else {
        return; // Stop if upload fails
      }
    }

    const updatedBranding: Partial<InvoiceTemplateFormData> = {
      colors: {
        ...template.colors,
        primary: data.primaryColor,
      },
      fonts: {
        ...template.fonts,
        heading: data.fontFamily,
        body: data.fontFamily,
      },
      businessInfoTemplate: {
        ...template.businessInfoTemplate,
        logoUrl,
      },
    };

    onBrandingChange(updatedBranding);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fontFamily"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font Family</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Apply Branding'}
        </Button>
      </form>
    </Form>
  );
};

export default BrandingCustomizer;