"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Mail,
  Users,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Lightbulb,
  Download
} from 'lucide-react';

interface TemplatePerformanceData {
  templateId: string;
  templateName: string;
  templateType: string;
  timeframe: 'week' | 'month' | 'quarter';
  metrics: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
    bounceRate: number;
  };
  comparison: {
    previousPeriod: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
    };
    industryAverage: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
    };
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    recommendation?: string;
  }>;
  dailyMetrics: Array<{
    date: string;
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
    openRate: number;
    clickRate: number;
  }>;
  timeOfDayPerformance: Array<{
    hour: number;
    openRate: number;
    clickRate: number;
    volume: number;
  }>;
}

interface TemplateAnalyticsProps {
  templateId: string;
  data?: TemplatePerformanceData;
  onExportReport?: () => void;
  onOptimizeTemplate?: () => void;
}

export function TemplateAnalytics({
  templateId,
  data,
  onExportReport,
  onOptimizeTemplate,
}: TemplateAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'opens' | 'clicks' | 'conversions'>('opens');

  // Mock data for demonstration
  const mockData: TemplatePerformanceData = {
    templateId: 'template-123',
    templateName: 'Invoice Payment Request',
    templateType: 'invoice',
    timeframe: 'month',
    metrics: {
      totalSent: 1250,
      deliveryRate: 0.982,
      openRate: 0.347,
      clickRate: 0.089,
      conversionRate: 0.156,
      unsubscribeRate: 0.003,
      bounceRate: 0.018,
    },
    comparison: {
      previousPeriod: {
        openRate: 0.312,
        clickRate: 0.076,
        conversionRate: 0.142,
      },
      industryAverage: {
        openRate: 0.285,
        clickRate: 0.082,
        conversionRate: 0.134,
      },
    },
    insights: [
      {
        type: 'positive',
        message: 'Open rate increased by 11.2% compared to last month',
        recommendation: 'The subject line optimization is working well. Consider applying similar patterns to other templates.',
      },
      {
        type: 'positive',
        message: 'Performing 21.8% above industry average for open rates',
      },
      {
        type: 'negative',
        message: 'Click rate slightly below industry average',
        recommendation: 'Consider testing different call-to-action button colors and positioning.',
      },
      {
        type: 'neutral',
        message: 'Best performance on Tuesday mornings (9-11 AM)',
        recommendation: 'Schedule more campaigns during this time window for optimal engagement.',
      },
    ],
    dailyMetrics: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sent: Math.floor(Math.random() * 50) + 30,
      opens: Math.floor(Math.random() * 20) + 10,
      clicks: Math.floor(Math.random() * 8) + 2,
      conversions: Math.floor(Math.random() * 4) + 1,
    })),
    deviceBreakdown: [
      { device: 'Desktop', percentage: 45, openRate: 0.38, clickRate: 0.092 },
      { device: 'Mobile', percentage: 48, openRate: 0.31, clickRate: 0.087 },
      { device: 'Tablet', percentage: 7, openRate: 0.35, clickRate: 0.089 },
    ],
    timeOfDayPerformance: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      openRate: Math.random() * 0.2 + 0.25,
      clickRate: Math.random() * 0.05 + 0.05,
      volume: Math.floor(Math.random() * 30) + 5,
    })),
  };

  const performanceData = data || mockData;

  const getMetricTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : 'down',
      color: change > 0 ? 'text-green-600' : 'text-red-600',
    };
  };

  const getPerformanceRating = (metric: number, benchmark: number) => {
    const ratio = metric / benchmark;
    if (ratio >= 1.1) return { rating: 'excellent', color: 'text-green-600' };
    if (ratio >= 0.9) return { rating: 'good', color: 'text-blue-600' };
    return { rating: 'needs improvement', color: 'text-orange-600' };
  };

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights for "{performanceData.templateName}"
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onOptimizeTemplate}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.metrics.totalSent.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Delivery: {(performanceData.metrics.deliveryRate * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceData.metrics.openRate * 100).toFixed(1)}%
            </div>
            <div className="flex items-center text-xs">
              {(() => {
                const trend = getMetricTrend(
                  performanceData.metrics.openRate,
                  performanceData.comparison.previousPeriod.openRate
                );
                return (
                  <>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={trend.color}>
                      {trend.value.toFixed(1)}% vs last period
                    </span>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceData.metrics.clickRate * 100).toFixed(1)}%
            </div>
            <div className="flex items-center text-xs">
              {(() => {
                const trend = getMetricTrend(
                  performanceData.metrics.clickRate,
                  performanceData.comparison.previousPeriod.clickRate
                );
                return (
                  <>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={trend.color}>
                      {trend.value.toFixed(1)}% vs last period
                    </span>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceData.metrics.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="flex items-center text-xs">
              {(() => {
                const trend = getMetricTrend(
                  performanceData.metrics.conversionRate,
                  performanceData.comparison.previousPeriod.conversionRate
                );
                return (
                  <>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={trend.color}>
                      {trend.value.toFixed(1)}% vs last period
                    </span>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve your template performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive'
                    ? 'border-green-500 bg-green-50'
                    : insight.type === 'negative'
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {insight.type === 'positive' && (
                    <Award className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  {insight.type === 'negative' && (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  {insight.type === 'neutral' && (
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{insight.message}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="devices">Device Breakdown</TabsTrigger>
          <TabsTrigger value="timing">Optimal Timing</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance Trends</CardTitle>
              <CardDescription>
                Track your template's daily engagement metrics over time
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opens">Opens</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [value, selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>How your audience reads your emails</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={performanceData.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="percentage"
                      label={({ device, percentage }) => `${device}: ${percentage}%`}
                    >
                      {performanceData.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Performance</CardTitle>
                <CardDescription>Engagement rates by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.deviceBreakdown.map((device, index) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{device.device}</span>
                        <span className="text-sm text-muted-foreground">
                          {device.percentage}% of users
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Open Rate</span>
                            <span>{(device.openRate * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={device.openRate * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Click Rate</span>
                            <span>{(device.clickRate * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={device.clickRate * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time of Day Performance</CardTitle>
              <CardDescription>
                Discover when your audience is most engaged
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData.timeOfDayPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                    formatter={(value: any, name) => [
                      name === 'openRate' ? `${(value * 100).toFixed(1)}%` : value,
                      name === 'openRate' ? 'Open Rate' : 'Volume'
                    ]}
                  />
                  <Bar dataKey="openRate" fill="#3B82F6" />
                  <Bar dataKey="volume" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
              <CardDescription>
                Compare your performance against industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(performanceData.comparison.industryAverage).map(([metric, industryValue]) => {
                  const currentValue = performanceData.metrics[metric as keyof typeof performanceData.metrics] as number;
                  const rating = getPerformanceRating(currentValue, industryValue);
                  
                  return (
                    <div key={metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <Badge variant={rating.rating === 'excellent' ? 'default' : 'secondary'}>
                          {rating.rating}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Your Performance</div>
                          <div className={`text-lg font-bold ${rating.color}`}>
                            {(currentValue * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Industry Average</div>
                          <div className="text-lg font-bold">
                            {(industryValue * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(currentValue / industryValue) * 50} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TemplateAnalytics;