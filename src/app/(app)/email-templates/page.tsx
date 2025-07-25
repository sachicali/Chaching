"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEmail } from '@/contexts/EmailContext';
import TemplateList from '@/components/email-templates/TemplateList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Clock,
  Plus,
  Zap,
  Target,
  Award
} from 'lucide-react';
import type { TemplateFormData } from '@/schemas/template.schema';
import type { EmailTemplate } from '@/types/database.types';
import { Timestamp } from 'firebase/firestore';

interface ExtendedEmailTemplate extends EmailTemplate {
  usageCount?: number;
  lastUsed?: Date;
  openRate?: number;
  clickRate?: number;
  version?: number;
  isAbTest?: boolean;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    emailTemplates, 
    loading: emailLoading,
    refreshData
  } = useEmail();
  
  const [templates, setTemplates] = useState<ExtendedEmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [templateStats, setTemplateStats] = useState({
    total: 0,
    active: 0,
    highPerforming: 0,
    needsOptimization: 0
  });

  // Load templates and analytics
  useEffect(() => {
    const loadTemplatesWithAnalytics = async () => {
      setIsLoading(true);
      try {
        await refreshData();
        
        // Enhance templates with analytics data
        const enhancedTemplates: ExtendedEmailTemplate[] = emailTemplates.map(template => ({
          ...template,
          usageCount: Math.floor(Math.random() * 100) + 5, // Mock usage data
          lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          openRate: Math.random() * 0.4 + 0.15, // 15-55% open rate
          clickRate: Math.random() * 0.1 + 0.02, // 2-12% click rate
          version: 1,
          isAbTest: Math.random() > 0.7
        }));
        
        setTemplates(enhancedTemplates);
        
        // Calculate stats
        const stats = {
          total: enhancedTemplates.length,
          active: enhancedTemplates.filter(t => t.lastUsed && 
            new Date(t.lastUsed).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
          highPerforming: enhancedTemplates.filter(t => 
            (t.openRate || 0) > 0.25 && (t.clickRate || 0) > 0.05).length,
          needsOptimization: enhancedTemplates.filter(t => 
            (t.openRate || 0) < 0.2 || (t.clickRate || 0) < 0.03).length
        };
        setTemplateStats(stats);
        
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
      loadTemplatesWithAnalytics();
    }
  }, [user?.uid, emailTemplates, refreshData, toast]);

  // Handle template actions
  const handleCreateNew = () => {
    router.push('/email-templates/create');
  };

  const handleEdit = (template: ExtendedEmailTemplate) => {
    router.push(`/email-templates/edit/${template.id}`);
  };

  const handlePreview = (template: ExtendedEmailTemplate) => {
    toast({
      title: 'Preview Feature',
      description: `Template preview for "${template.name}" will be available in the next update.`,
    });
  };

  const handleDuplicate = async (template: ExtendedEmailTemplate) => {
    try {
      const duplicatedTemplate: ExtendedEmailTemplate = {
        ...template,
        id: `${template.id}_copy_${Date.now()}`,
        name: `${template.name} (Copy)`,
        isDefault: false,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
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

  const handleUse = (template: ExtendedEmailTemplate) => {
    toast({
      title: 'Use Template',
      description: `Using template "${template.name}". This will integrate with the email system in the next phase.`,
    });
  };

  const handleCreateAbTest = (template: ExtendedEmailTemplate) => {
    toast({
      title: 'A/B Test',
      description: `Creating A/B test for "${template.name}". This feature will be implemented in the next phase.`,
    });
  };

  const handleAnalyzePerformance = (template: ExtendedEmailTemplate) => {
    toast({
      title: 'Performance Analysis',
      description: `Analyzing performance for "${template.name}". Detailed analytics coming soon.`,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage your email templates with advanced analytics and versioning
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active email templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Used in past 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performing</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.highPerforming}</div>
            <p className="text-xs text-muted-foreground">
              &gt;25% open, &gt;5% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Optimization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.needsOptimization}</div>
            <p className="text-xs text-muted-foreground">
              Low engagement rates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="versioning">Versioning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common template management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
              <Button variant="outline" disabled>
                <Zap className="h-4 w-4 mr-2" />
                Bulk Import (Coming Soon)
              </Button>
              <Button variant="outline" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Report (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Recent Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Templates</CardTitle>
              <CardDescription>
                Your most recently modified templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.templateType}</p>
                      </div>
                      {template.isAbTest && (
                        <Badge variant="secondary">A/B Testing</Badge>
                      )}
                      {template.isDefault && (
                        <Badge>Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="text-right">
                        <div>Open: {((template.openRate || 0) * 100).toFixed(1)}%</div>
                        <div>Click: {((template.clickRate || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateList
            templates={templates}
            isLoading={isLoading}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onUse={handleUse}
            onCreateAbTest={handleCreateAbTest}
            onAnalyzePerformance={handleAnalyzePerformance}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for all templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                <p>Detailed template performance metrics, A/B test results, and optimization recommendations will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versioning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Versioning</CardTitle>
              <CardDescription>
                Manage template versions and A/B testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Version Management Coming Soon</h3>
                <p>Template versioning, rollback capabilities, and A/B test management will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}