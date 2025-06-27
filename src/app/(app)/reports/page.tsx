/**
 * Financial Reports Page for Chaching Financial Management Platform
 * 
 * Comprehensive reporting dashboard providing business intelligence,
 * financial analytics, and export capabilities for freelancers and consultants.
 * 
 * User Stories: US-006 (Financial Reports - 5 points)
 * Dependencies: ReportService, ExportUtils, Charts components
 * Architecture: Multi-tab interface with real-time data and export options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  FileText,
  CalendarIcon,
  Users,
  DollarSign,
  Receipt,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { reportService } from '@/services/report.service';
import { downloadCSV, downloadJSON, generateReportFilename } from '@/utils/export.util';
import type { 
  BusinessSummary,
  PLStatement,
  TaxReport,
  ClientReport,
  ReportTemplate 
} from '@/services/report.service';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ReportFilters {
  dateRange: DateRange;
  reportType: string;
  currency: 'all' | 'PHP' | 'USD' | 'EUR';
  clientId?: string;
  category?: string;
}

// ============================================================================
// FINANCIAL REPORTS PAGE COMPONENT
// ============================================================================

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report Data State
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [profitLoss, setProfitLoss] = useState<PLStatement | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [clientReports, setClientReports] = useState<ClientReport[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);

  // Filter State
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
      endDate: new Date()
    },
    reportType: 'business-summary',
    currency: 'all'
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  /**
   * Load all report data based on current filters
   */
  const loadReportData = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load business summary
      const summaryResult = await reportService.generateBusinessSummary(
        user.uid,
        filters.dateRange
      );
      if (summaryResult.success) {
        setBusinessSummary(summaryResult.data!);
      }

      // Load P&L statement
      const plResult = await reportService.getProfitLossStatement(
        user.uid,
        filters.dateRange
      );
      if (plResult.success) {
        setProfitLoss(plResult.data!);
      }

      // Load tax report for current year
      const currentYear = filters.dateRange.endDate.getFullYear();
      const taxResult = await reportService.getTaxReadyReport(user.uid, currentYear);
      if (taxResult.success) {
        setTaxReport(taxResult.data!);
      }

      // Load client profitability reports
      const clientResult = await reportService.getClientProfitabilityReport(user.uid);
      if (clientResult.success) {
        setClientReports(clientResult.data!);
      }

      // Load available templates
      setReportTemplates(reportService.getReportTemplates());

    } catch (err) {
      console.error('Error loading report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle date range updates
   */
  const updateDateRange = (field: 'startDate' | 'endDate', date: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }));
  };

  /**
   * Export report data in various formats
   */
  const handleExport = async (format: 'csv' | 'json', reportType: string) => {
    if (!user?.uid) return;

    try {
      setIsExporting(true);

      const filename = generateReportFilename(reportType, filters.dateRange, format);

      if (format === 'csv') {
        const csvResult = await reportService.generateCSVExport(user.uid, {
          startDate: { toDate: () => filters.dateRange.startDate } as any,
          endDate: { toDate: () => filters.dateRange.endDate } as any,
          currency: filters.currency !== 'all' ? filters.currency : undefined
        });

        if (csvResult.success) {
          downloadCSV(csvResult.data!, filename);
        } else {
          throw new Error(csvResult.error);
        }
      } else if (format === 'json') {
        let data: any = {};
        
        switch (reportType) {
          case 'business-summary':
            data = businessSummary;
            break;
          case 'profit-loss':
            data = profitLoss;
            break;
          case 'tax-report':
            data = taxReport;
            break;
          case 'client-reports':
            data = clientReports;
            break;
          default:
            data = { businessSummary, profitLoss, taxReport, clientReports };
        }

        downloadJSON(data, filename);
      }

    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Apply quick date range filters
   */
  const applyQuickDateRange = (type: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (type) {
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last-month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth;
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this-quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStart, 1);
        break;
      case 'this-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last-year':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    loadReportData();
  }, [user?.uid, filters.dateRange]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Please log in to access financial reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive business analytics and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadReportData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.dateRange.startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.startDate}
                    onSelect={(date) => {
                      if (date) {
                        updateDateRange('startDate', date);
                        setShowStartDatePicker(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.dateRange.endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.endDate}
                    onSelect={(date) => {
                      if (date) {
                        updateDateRange('endDate', date);
                        setShowEndDatePicker(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Currency Filter */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={filters.currency}
                onValueChange={(value: any) => 
                  setFilters(prev => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="PHP">PHP (₱)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <Label>Quick Filters</Label>
              <Select onValueChange={applyQuickDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
          <TabsTrigger value="clients">Client Reports</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
          <TabsTrigger value="export">Export & Templates</TabsTrigger>
        </TabsList>

        {/* Business Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Loading business summary...</p>
              </CardContent>
            </Card>
          ) : businessSummary ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-bold text-green-600">
                        ₱{businessSummary.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Expenses</span>
                      <span className="font-bold text-red-600">
                        ₱{businessSummary.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-gray-900 font-medium">Net Profit</span>
                      <span className={`font-bold ${businessSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₱{businessSummary.netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Profit Margin</span>
                      <Badge variant={businessSummary.profitMargin >= 20 ? 'default' : 'secondary'}>
                        {businessSummary.profitMargin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {businessSummary.topCategories.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                            {category.type}
                          </Badge>
                          <span className="text-sm">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₱{category.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {businessSummary.monthlyTrends.map((trend, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Month</div>
                          <div className="font-medium">{trend.month}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Revenue</div>
                          <div className="font-medium text-green-600">₱{trend.revenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Expenses</div>
                          <div className="font-medium text-red-600">₱{trend.expenses.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Net Profit</div>
                          <div className={`font-medium ${trend.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₱{trend.netProfit.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p>No data available for the selected period.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* P&L Statement Tab */}
        <TabsContent value="profit-loss" className="space-y-6">
          {profitLoss ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Profit & Loss Statement
                </CardTitle>
                <CardDescription>
                  {format(profitLoss.period.startDate, 'MMM dd, yyyy')} - {format(profitLoss.period.endDate, 'MMM dd, yyyy')}
                </CardDescription>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('csv', 'profit-loss')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('json', 'profit-loss')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">REVENUE</h4>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between">
                        <span>Total Revenue</span>
                        <span className="font-medium">₱{profitLoss.revenue.totalRevenue.toLocaleString()}</span>
                      </div>
                      {profitLoss.revenue.revenueByCategory.slice(0, 3).map((cat, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600 ml-4">
                          <span>{cat.category}</span>
                          <span>₱{cat.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">EXPENSES</h4>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between">
                        <span>Total Expenses</span>
                        <span className="font-medium">₱{profitLoss.expenses.totalExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 ml-4">
                        <span>Tax Deductible</span>
                        <span>₱{profitLoss.expenses.deductibleExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 ml-4">
                        <span>Non-Deductible</span>
                        <span>₱{profitLoss.expenses.nonDeductibleExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">NET INCOME</h4>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between">
                        <span>Gross Profit</span>
                        <span className="font-medium">₱{profitLoss.netIncome.grossProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Net Profit</span>
                        <span className={profitLoss.netIncome.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₱{profitLoss.netIncome.netProfit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Profit Margin</span>
                        <Badge>{profitLoss.netIncome.profitMargin.toFixed(2)}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Loading P&L statement...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Client Reports Tab */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Profitability Report
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('csv', 'client-reports')}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientReports.length > 0 ? (
                <div className="space-y-4">
                  {clientReports.map((client, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{client.clientName}</h4>
                          <p className="text-sm text-gray-600">Client ID: {client.clientId}</p>
                        </div>
                        <Badge 
                          variant={
                            client.profitability === 'high' ? 'default' :
                            client.profitability === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {client.profitability} value
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Revenue</span>
                          <div className="font-medium">₱{client.totalRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Transactions</span>
                          <div className="font-medium">{client.transactionCount}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Transaction</span>
                          <div className="font-medium">₱{client.averageTransactionValue.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Payment Frequency</span>
                          <div className="font-medium">{client.paymentFrequency.toFixed(0)} days</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">No client data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Reports Tab */}
        <TabsContent value="tax" className="space-y-6">
          {taxReport ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Tax Report {taxReport.taxYear}
                </CardTitle>
                <CardDescription>
                  Philippines tax compliance report for freelancers
                </CardDescription>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('csv', 'tax-report')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tax Summary */}
                  <div>
                    <h4 className="font-semibold mb-4">Tax Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Income</span>
                        <span className="font-medium">₱{taxReport.totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deductible Expenses</span>
                        <span className="font-medium">₱{taxReport.totalDeductibleExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Taxable Income</span>
                        <span className="font-medium">₱{taxReport.taxableIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Tax</span>
                        <span className="font-bold text-red-600">₱{taxReport.estimatedTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quarterly Breakdown */}
                  <div>
                    <h4 className="font-semibold mb-4">Quarterly Breakdown</h4>
                    <div className="space-y-3">
                      {taxReport.quarterlyBreakdown.map((quarter, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded">
                          <div className="font-medium mb-2">Q{quarter.quarter}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Income: ₱{quarter.income.toLocaleString()}</div>
                            <div>Tax: ₱{quarter.estimatedTax.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Loading tax report...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export & Templates Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => handleExport('csv', 'complete-report')}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Complete Report (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('json', 'complete-report')}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data (JSON)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('csv', 'business-summary')}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export Business Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Report Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportTemplates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <Badge>{template.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}