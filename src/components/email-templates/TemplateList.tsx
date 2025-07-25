"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Mail,
  FileText,
  Star,
  Clock,
  Tag,
  TrendingUp,
  BarChart3,
  TestTube,
  Percent,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TEMPLATE_CATEGORIES, type TemplateFormData } from '@/schemas/template.schema';
import type { EmailTemplate } from '@/types/database.types';

interface ExtendedEmailTemplate extends EmailTemplate {
  usageCount?: number;
  lastUsed?: Date;
  openRate?: number;
  clickRate?: number;
  version?: number;
  isAbTest?: boolean;
  description?: string;
  category?: string;
  tags?: string[];
}

interface TemplateListProps {
  templates?: ExtendedEmailTemplate[];
  isLoading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (template: ExtendedEmailTemplate) => void;
  onPreview?: (template: ExtendedEmailTemplate) => void;
  onDuplicate?: (template: ExtendedEmailTemplate) => void;
  onDelete?: (templateId: string) => Promise<void>;
  onUse?: (template: ExtendedEmailTemplate) => void;
  onCreateAbTest?: (template: ExtendedEmailTemplate) => void;
  onAnalyzePerformance?: (template: ExtendedEmailTemplate) => void;
}

export function TemplateList({
  templates = [],
  isLoading = false,
  onCreateNew,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onUse,
  onCreateAbTest,
  onAnalyzePerformance,
}: TemplateListProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesType = selectedType === 'all' || template.templateType === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'recent':
          return b.updatedAt.toMillis() - a.updatedAt.toMillis();
        default:
          return 0;
      }
    });

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      if (onDelete) {
        await onDelete(templateId);
        toast({
          title: 'Template Deleted',
          description: 'The email template has been deleted successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTemplateId(null);
    }
  };

  // Get template type icon
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return FileText;
      case 'reminder':
        return Clock;
      case 'payment_confirmation':
        return Star;
      default:
        return Mail;
    }
  };

  // Get template type color
  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-500';
      case 'reminder':
        return 'bg-orange-500';
      case 'payment_confirmation':
        return 'bg-green-500';
      default:
        return 'bg-purple-500';
    }
  };

  // Render template card
  const renderTemplateCard = (template: ExtendedEmailTemplate) => {
    const Icon = getTemplateIcon(template.templateType || '');
    const colorClass = getTemplateColor(template.templateType || '');

    return (
      <Card key={template.id} className="relative group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                  {template.isAbTest && (
                    <Badge variant="outline" className="text-xs">
                      <TestTube className="h-3 w-3 mr-1" />
                      A/B
                    </Badge>
                  )}
                  {template.version && template.version > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      v{template.version}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {template.subject}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUse?.(template)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Use Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview?.(template)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onCreateAbTest && (
                  <DropdownMenuItem onClick={() => onCreateAbTest(template)}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Create A/B Test
                  </DropdownMenuItem>
                )}
                {onAnalyzePerformance && (
                  <DropdownMenuItem onClick={() => onAnalyzePerformance(template)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Performance
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteTemplateId(template.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Template Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag.replace('_', ' ')}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Template Description */}
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}

            <Separator />

            {/* Performance Metrics */}
            {(template.openRate !== undefined || template.clickRate !== undefined) && (
              <div className="flex items-center space-x-4 text-xs">
                {template.openRate !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Open:</span>
                    <span className="font-medium">{(template.openRate * 100).toFixed(1)}%</span>
                  </div>
                )}
                {template.clickRate !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Click:</span>
                    <span className="font-medium">{(template.clickRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Template Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>Used {template.usageCount} times</span>
                {template.lastUsed && (
                  <span>Last used {template.lastUsed.toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {template.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
                <span className="capitalize">{template.templateType}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2">
              <Button
                size="sm"
                onClick={() => onUse?.(template)}
                className="flex-1"
              >
                <Mail className="h-3 w-3 mr-2" />
                Use Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview?.(template)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(template)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage your email templates for invoices, reminders, and more.
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice Templates</SelectItem>
                <SelectItem value="reminder">Payment Reminders</SelectItem>
                <SelectItem value="payment_confirmation">Payment Confirmations</SelectItem>
                <SelectItem value="custom">Custom Templates</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Most Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first email template'}
                </p>
              </div>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && handleDeleteTemplate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TemplateList;