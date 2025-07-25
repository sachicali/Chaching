"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { generateFinancialInsights, type FinancialInsightsOutput } from "@/ai/flows/generate-financial-insights";
import AIDataService from "@/services/ai-data.service";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsWidgetProps {
  userId: string;
  className?: string;
}

export function AIInsightsWidget({ userId, className }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<FinancialInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Memoize the data service to prevent recreation on every render
  const dataService = useMemo(() => new AIDataService(userId), [userId]);

  const loadInsights = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('Loading financial insights data...');
      const insightsData = await dataService.getFinancialInsightsData();
      console.log('Financial insights data:', insightsData);
      
      console.log('Generating AI insights...');
      const aiInsights = await generateFinancialInsights(insightsData);
      console.log('AI insights generated:', aiInsights);
      setInsights(aiInsights);

    } catch (error) {
      console.error('Error loading AI insights:', error);
      
      // Handle specific error types
      if (error instanceof Error && error.message === 'NO_DATA_AVAILABLE') {
        console.log('No data available for AI insights');
        setInsights(null); // This will show the "no data" message
        return;
      }
      
      if (error instanceof Error && error.message === 'ALL_AI_SERVICES_FAILED') {
        console.error('All AI services failed');
        toast({
          title: "AI Services Unavailable",
          description: "Google AI, local Ollama, and Hugging Face models are all currently unavailable. Please try again later.",
          variant: "destructive"
        });
        setInsights(null);
        return;
      }
      
      // For other errors, still show toast but don't set mock data
      if (error instanceof Error && !error.message.includes('Failed to get') && !error.message.includes('429')) {
        toast({
          title: "Insights Error",
          description: "Unable to load AI financial insights. Please try again.",
          variant: "destructive"
        });
      }
      
      setInsights(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dataService, toast]); // Remove isLoading and isRefreshing from deps to prevent unnecessary recreations

  useEffect(() => {
    loadInsights();
    
    // Cleanup function
    return () => {};
  }, [loadInsights]); // Remove isLoading dependency to prevent infinite loop

  const handleRefresh = () => {
    loadInsights(true);
  };

  if (isLoading) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <CardTitle>AI Financial Insights</CardTitle>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <CardDescription>AI-powered analysis of your financial health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-muted-foreground" />
              <CardTitle>AI Financial Insights</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No data available for AI insights</p>
            <p className="text-xs mt-1">Add some transactions to get AI-powered financial analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Financial Insights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>AI-powered analysis of your financial health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial Summary */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h4 className="font-semibold text-sm">Financial Summary</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insights.summary}
          </p>
        </div>

        {/* Spending Analysis */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <h4 className="font-semibold text-sm">Spending Analysis</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insights.spendingHabits}
          </p>
        </div>

        {/* Savings Opportunities */}
        {insights.savingsOpportunities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h4 className="font-semibold text-sm">Savings Opportunities</h4>
            </div>
            <div className="space-y-1">
              {insights.savingsOpportunities.slice(0, 3).map((opportunity, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {opportunity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Badge */}
        <div className="pt-2">
          <Badge variant="secondary" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            AI Generated
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}