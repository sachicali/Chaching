"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  GitBranch,
  Eye,
  TestTube,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateVersion {
  id: string;
  version: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  performance?: {
    openRate: number;
    clickRate: number;
    sentCount: number;
  };
}

interface AbTestResult {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  variants: Array<{
    id: string;
    name: string;
    version: number;
    trafficPercentage: number;
    performance: {
      openRate: number;
      clickRate: number;
      sentCount: number;
      conversionRate: number;
    };
  }>;
  winner?: string;
}

interface TemplateVersionManagerProps {
  templateId: string;
  templateName: string;
  versions?: TemplateVersion[];
  abTests?: AbTestResult[];
  onCreateVersion?: () => void;
  onCreateAbTest?: () => void;
  onViewVersion?: (version: TemplateVersion) => void;
  onActivateVersion?: (versionId: string) => void;
}

export function TemplateVersionManager({
  templateId,
  templateName,
  versions = [],
  abTests = [],
  onCreateVersion,
  onCreateAbTest,
  onViewVersion,
  onActivateVersion,
}: TemplateVersionManagerProps) {
  const { toast } = useToast();
  const [selectedTest, setSelectedTest] = useState<AbTestResult | null>(null);

  // Mock data for demonstration
  const mockVersions: TemplateVersion[] = [
    {
      id: 'v1',
      version: 1,
      name: 'Original Template',
      description: 'Initial template version',
      isActive: false,
      createdAt: new Date('2024-01-15'),
      performance: {
        openRate: 0.22,
        clickRate: 0.04,
        sentCount: 150
      }
    },
    {
      id: 'v2',
      version: 2,
      name: 'Improved Subject Line',
      description: 'Updated subject line for better engagement',
      isActive: true,
      createdAt: new Date('2024-01-22'),
      performance: {
        openRate: 0.28,
        clickRate: 0.06,
        sentCount: 89
      }
    },
    {
      id: 'v3',
      version: 3,
      name: 'Enhanced Call-to-Action',
      description: 'Improved CTA buttons and positioning',
      isActive: false,
      createdAt: new Date('2024-01-28'),
      performance: {
        openRate: 0.25,
        clickRate: 0.08,
        sentCount: 45
      }
    }
  ];

  const mockAbTests: AbTestResult[] = [
    {
      id: 'test1',
      name: 'Subject Line A/B Test',
      status: 'completed',
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-01-27'),
      variants: [
        {
          id: 'var1',
          name: 'Original Subject',
          version: 1,
          trafficPercentage: 50,
          performance: {
            openRate: 0.22,
            clickRate: 0.04,
            sentCount: 75,
            conversionRate: 0.08
          }
        },
        {
          id: 'var2',
          name: 'Improved Subject',
          version: 2,
          trafficPercentage: 50,
          performance: {
            openRate: 0.28,
            clickRate: 0.06,
            sentCount: 75,
            conversionRate: 0.12
          }
        }
      ],
      winner: 'var2'
    },
    {
      id: 'test2',
      name: 'CTA Button Test',
      status: 'running',
      startDate: new Date('2024-01-25'),
      variants: [
        {
          id: 'var3',
          name: 'Blue CTA',
          version: 2,
          trafficPercentage: 50,
          performance: {
            openRate: 0.26,
            clickRate: 0.05,
            sentCount: 32,
            conversionRate: 0.09
          }
        },
        {
          id: 'var4',
          name: 'Green CTA',
          version: 3,
          trafficPercentage: 50,
          performance: {
            openRate: 0.24,
            clickRate: 0.07,
            sentCount: 28,
            conversionRate: 0.11
          }
        }
      ]
    }
  ];

  const displayVersions = versions.length > 0 ? versions : mockVersions;
  const displayAbTests = abTests.length > 0 ? abTests : mockAbTests;

  const handleCreateVersion = () => {
    if (onCreateVersion) {
      onCreateVersion();
    } else {
      toast({
        title: 'Create New Version',
        description: 'Version creation will be available in the next update.',
      });
    }
  };

  const handleCreateAbTest = () => {
    if (onCreateAbTest) {
      onCreateAbTest();
    } else {
      toast({
        title: 'Create A/B Test',
        description: 'A/B test creation will be available in the next update.',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (current: number, baseline: number) => {
    if (current > baseline * 1.1) return 'text-green-600';
    if (current < baseline * 0.9) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template Versions</h2>
          <p className="text-muted-foreground">
            Manage versions and A/B tests for "{templateName}"
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCreateVersion}>
            <GitBranch className="h-4 w-4 mr-2" />
            New Version
          </Button>
          <Button onClick={handleCreateAbTest}>
            <TestTube className="h-4 w-4 mr-2" />
            Create A/B Test
          </Button>
        </div>
      </div>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
          <CardDescription>
            Track performance across different template versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayVersions.map((version) => (
              <div
                key={version.id}
                className={`p-4 border rounded-lg ${
                  version.isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={version.isActive ? 'default' : 'outline'}>
                        v{version.version}
                      </Badge>
                      {version.isActive && (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{version.name}</h4>
                      {version.description && (
                        <p className="text-sm text-muted-foreground">{version.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {version.performance && (
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">
                            {(version.performance.openRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">
                            {(version.performance.clickRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">Click</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{version.performance.sentCount}</div>
                          <div className="text-muted-foreground">Sent</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewVersion?.(version)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {!version.isActive && (
                        <Button
                          size="sm"
                          onClick={() => onActivateVersion?.(version.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2" />
            A/B Tests
          </CardTitle>
          <CardDescription>
            Compare template variants to optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAbTests.map((test) => (
              <div key={test.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(test.status)}`} />
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Started {test.startDate.toLocaleDateString()}
                        {test.endDate && ` • Ended ${test.endDate.toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                      {test.status === 'running' && <Play className="h-3 w-3 mr-1" />}
                      {test.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {test.status === 'paused' && <Pause className="h-3 w-3 mr-1" />}
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTest(test)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      View Results
                    </Button>
                  </div>
                </div>

                {/* Variants Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variants.map((variant, index) => (
                    <div key={variant.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{variant.name}</span>
                          {test.winner === variant.id && (
                            <Badge variant="default" className="text-xs">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {variant.trafficPercentage}% traffic
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">
                            {(variant.performance.openRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">
                            {(variant.performance.clickRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">Click</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">
                            {(variant.performance.conversionRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">Convert</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Test Results Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTest?.name} - Detailed Results</DialogTitle>
            <DialogDescription>
              A comprehensive view of your A/B test performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-6">
              {/* Test Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {selectedTest.variants.reduce((sum, v) => sum + v.performance.sentCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Emails Sent</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.ceil(
                      (Date.now() - selectedTest.startDate.getTime()) / (1000 * 60 * 60 * 24)
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Days Running</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedTest.winner ? '✓' : '⏳'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedTest.winner ? 'Winner Found' : 'In Progress'}
                  </div>
                </div>
              </div>

              {/* Detailed Comparison */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTest.variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{variant.name}</span>
                          {selectedTest.winner === variant.id && (
                            <Badge variant="default" className="text-xs">Winner</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{variant.trafficPercentage}%</TableCell>
                      <TableCell>{variant.performance.sentCount}</TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(
                          variant.performance.openRate,
                          selectedTest.variants[0].performance.openRate
                        )}>
                          {(variant.performance.openRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(
                          variant.performance.clickRate,
                          selectedTest.variants[0].performance.clickRate
                        )}>
                          {(variant.performance.clickRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(
                          variant.performance.conversionRate,
                          selectedTest.variants[0].performance.conversionRate
                        )}>
                          {(variant.performance.conversionRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTest(null)}>
              Close
            </Button>
            {selectedTest?.status === 'running' && (
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                Declare Winner
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateVersionManager;