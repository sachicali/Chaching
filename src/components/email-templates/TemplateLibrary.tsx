"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search,
  Star,
  Download,
  Eye,
  Heart,
  Users,
  Crown,
  Zap,
  Filter,
  TrendingUp,
  Award,
  Calendar,
  FileText,
  Mail,
  Clock,
  Bookmark,
  Share2,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LibraryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'invoice' | 'reminder' | 'welcome' | 'marketing' | 'newsletter' | 'custom';
  preview: string;
  author: {
    name: string;
    avatar?: string;
    isPro: boolean;
  };
  performance: {
    averageOpenRate: number;
    averageClickRate: number;
    usageCount: number;
  };
  ratings: {
    average: number;
    count: number;
  };
  tags: string[];
  isPremium: boolean;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateLibraryProps {
  onImportTemplate?: (template: LibraryTemplate) => void;
  onPreviewTemplate?: (template: LibraryTemplate) => void;
  onBookmarkTemplate?: (templateId: string) => void;
}

export function TemplateLibrary({
  onImportTemplate,
  onPreviewTemplate,
  onBookmarkTemplate,
}: TemplateLibraryProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryTemplate | null>(null);

  // Mock library templates
  const libraryTemplates: LibraryTemplate[] = [
    {
      id: 'lib-1',
      name: 'Professional Invoice Request',
      description: 'A clean and professional invoice request template with excellent conversion rates',
      category: 'business',
      type: 'invoice',
      preview: 'Hello {{clientName}}, Your invoice {{invoiceNumber}} for {{amount}} is ready...',
      author: {
        name: 'Sarah Johnson',
        isPro: true,
      },
      performance: {
        averageOpenRate: 0.42,
        averageClickRate: 0.12,
        usageCount: 1250,
      },
      ratings: {
        average: 4.8,
        count: 89,
      },
      tags: ['professional', 'high-converting', 'clean'],
      isPremium: false,
      isBookmarked: false,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'lib-2',
      name: 'Friendly Payment Reminder',
      description: 'A gentle yet effective payment reminder that maintains client relationships',
      category: 'business',
      type: 'reminder',
      preview: 'Hi {{clientName}}, Just a friendly reminder about invoice {{invoiceNumber}}...',
      author: {
        name: 'Marketing Pro',
        isPro: true,
      },
      performance: {
        averageOpenRate: 0.38,
        averageClickRate: 0.08,
        usageCount: 890,
      },
      ratings: {
        average: 4.6,
        count: 67,
      },
      tags: ['friendly', 'gentle', 'relationship-focused'],
      isPremium: true,
      isBookmarked: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'lib-3',
      name: 'Welcome New Client Template',
      description: 'Perfect onboarding template to welcome new clients and set expectations',
      category: 'onboarding',
      type: 'welcome',
      preview: 'Welcome to our family! We\'re excited to work with you...',
      author: {
        name: 'UX Designer',
        isPro: false,
      },
      performance: {
        averageOpenRate: 0.65,
        averageClickRate: 0.15,
        usageCount: 2340,
      },
      ratings: {
        average: 4.9,
        count: 156,
      },
      tags: ['welcome', 'onboarding', 'relationship-building'],
      isPremium: false,
      isBookmarked: false,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-25'),
    },
    {
      id: 'lib-4',
      name: 'Holiday Promotion Email',
      description: 'Festive email template perfect for holiday marketing campaigns',
      category: 'marketing',
      type: 'marketing',
      preview: 'Special holiday offer just for you! Get 30% off all services...',
      author: {
        name: 'Creative Studio',
        isPro: true,
      },
      performance: {
        averageOpenRate: 0.33,
        averageClickRate: 0.18,
        usageCount: 567,
      },
      ratings: {
        average: 4.5,
        count: 43,
      },
      tags: ['holiday', 'promotion', 'colorful', 'seasonal'],
      isPremium: true,
      isBookmarked: false,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'lib-5',
      name: 'Monthly Newsletter Template',
      description: 'Clean and organized newsletter template for regular client updates',
      category: 'newsletter',
      type: 'newsletter',
      preview: 'Your monthly update from {{businessName}}. Here\'s what happened this month...',
      author: {
        name: 'Content Creator',
        isPro: false,
      },
      performance: {
        averageOpenRate: 0.28,
        averageClickRate: 0.06,
        usageCount: 234,
      },
      ratings: {
        average: 4.3,
        count: 21,
      },
      tags: ['newsletter', 'updates', 'monthly', 'informative'],
      isPremium: false,
      isBookmarked: true,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-22'),
    },
  ];

  // Filter and sort templates
  const filteredTemplates = libraryTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesType = selectedType === 'all' || template.type === selectedType;
      const matchesPremium = !showPremiumOnly || template.isPremium;
      
      return matchesSearch && matchesCategory && matchesType && matchesPremium;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.performance.usageCount - a.performance.usageCount;
        case 'rating':
          return b.ratings.average - a.ratings.average;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'performance':
          return b.performance.averageOpenRate - a.performance.averageOpenRate;
        default:
          return 0;
      }
    });

  const handleImportTemplate = (template: LibraryTemplate) => {
    if (onImportTemplate) {
      onImportTemplate(template);
    }
    toast({
      title: 'Template Imported',
      description: `"${template.name}" has been added to your templates.`,
    });
  };

  const handleBookmarkToggle = (template: LibraryTemplate) => {
    if (onBookmarkTemplate) {
      onBookmarkTemplate(template.id);
    }
    toast({
      title: template.isBookmarked ? 'Bookmark Removed' : 'Template Bookmarked',
      description: template.isBookmarked 
        ? `"${template.name}" removed from bookmarks.`
        : `"${template.name}" added to bookmarks.`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return FileText;
      case 'reminder':
        return Clock;
      case 'welcome':
        return Users;
      case 'marketing':
        return Zap;
      case 'newsletter':
        return Mail;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-500';
      case 'reminder':
        return 'bg-orange-500';
      case 'welcome':
        return 'bg-green-500';
      case 'marketing':
        return 'bg-purple-500';
      case 'newsletter':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderTemplateCard = (template: LibraryTemplate) => {
    const Icon = getTypeIcon(template.type);
    const colorClass = getTypeColor(template.type);

    return (
      <Card key={template.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                  {template.isPremium && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleBookmarkToggle(template)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Bookmark className={`h-4 w-4 ${template.isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Author and Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">by</span>
                <span className="text-sm font-medium">{template.author.name}</span>
                {template.author.isPro && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{template.ratings.average}</span>
                <span className="text-sm text-muted-foreground">({template.ratings.count})</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{(template.performance.averageOpenRate * 100).toFixed(1)}%</div>
                <div className="text-muted-foreground">Open Rate</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{(template.performance.averageClickRate * 100).toFixed(1)}%</div>
                <div className="text-muted-foreground">Click Rate</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{template.performance.usageCount}</div>
                <div className="text-muted-foreground">Uses</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => handleImportTemplate(template)}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplate(template)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBookmarkToggle(template)}
              >
                <Heart className={`h-3 w-3 ${template.isBookmarked ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template Library</h2>
          <p className="text-muted-foreground">
            Discover and import high-performing templates from the community
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            {libraryTemplates.length} Templates Available
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
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
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="performance">Best Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No templates found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryTemplates
              .filter(t => t.ratings.average >= 4.5)
              .map(renderTemplateCard)}
          </div>
        </TabsContent>

        <TabsContent value="bookmarked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryTemplates
              .filter(t => t.isBookmarked)
              .map(renderTemplateCard)}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryTemplates
              .filter(t => t.performance.usageCount > 500)
              .map(renderTemplateCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Template Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Preview:</h4>
                <p className="text-sm text-muted-foreground italic">
                  {selectedTemplate.preview}
                </p>
              </div>

              {/* Template Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average Open Rate:</span>
                      <span className="font-medium">
                        {(selectedTemplate.performance.averageOpenRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Click Rate:</span>
                      <span className="font-medium">
                        {(selectedTemplate.performance.averageClickRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Uses:</span>
                      <span className="font-medium">{selectedTemplate.performance.usageCount}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-medium">{selectedTemplate.ratings.average}</span>
                        <span className="text-muted-foreground">
                          ({selectedTemplate.ratings.count} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Author:</span>
                      <span className="font-medium">{selectedTemplate.author.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplate.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && handleImportTemplate(selectedTemplate)}>
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateLibrary;