"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sparkles, RefreshCw, Target, TrendingUp, Settings } from "lucide-react";
import AICategorizationService from "@/services/ai-categorization.service";
import { useToast } from "@/hooks/use-toast";

interface SmartCategorizationWidgetProps {
  userId: string;
  className?: string;
}

interface CategorizationMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  accuracy: number;
  averageConfidence: number;
}

export function SmartCategorizationWidget({ userId, className }: SmartCategorizationWidgetProps) {
  const [metrics, setMetrics] = useState<CategorizationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  // Memoize the categorization service to prevent recreation on every render
  const categorizationService = useMemo(() => new AICategorizationService(userId), [userId]);

  const loadMetrics = useCallback(async (isRefresh = false) => {
    

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('Loading categorization metrics...');
      const metricsData = await categorizationService.getCategorizationMetrics();
      console.log('Categorization metrics loaded:', metricsData);
      
      setMetrics(metricsData);

    } catch (error) {
      console.error('Error loading categorization metrics:', error);
      setMetrics(null);
      
      // Only show toast for actual errors, not rate limits or empty data
      if (error instanceof Error && !error.message.includes('Failed to get') && !error.message.includes('429')) {
        toast({
          title: "Metrics Error",
          description: "Unable to load categorization metrics. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [categorizationService, toast]); // Remove isLoading and isRefreshing from deps to prevent unnecessary recreations

  const handleMigrateUncategorized = useCallback(async () => {
    try {
      setIsMigrating(true);
      const result = await categorizationService.migrateUncategorizedTransactions(20);
      
      toast({
        title: "Migration Complete",
        description: `Processed ${result.processed} transactions, categorized ${result.categorized} automatically.`,
      });

      // Refresh metrics after migration
      await loadMetrics(true);

    } catch (error) {
      console.error('Error migrating transactions:', error);
      toast({
        title: "Migration Error",
        description: "Unable to migrate uncategorized transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  }, [categorizationService, loadMetrics, toast]);

  useEffect(() => {
    loadMetrics();
    
    // Cleanup function
    return () => {};
  }, [loadMetrics]); // Remove isLoading dependency to prevent infinite loop

  const handleRefresh = () => {
    loadMetrics(true);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-500';
    if (accuracy >= 0.6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy >= 0.9) return 'Excellent';
    if (accuracy >= 0.8) return 'Very Good';
    if (accuracy >= 0.6) return 'Good';
    if (accuracy >= 0.4) return 'Fair';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle>Smart Categorization</CardTitle>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <CardDescription>AI-powered transaction categorization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Smart Categorization</CardTitle>
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
        <CardDescription>AI-powered transaction categorization performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!metrics || metrics.totalSuggestions === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No categorization data yet</p>
              <p className="text-xs mt-1">Start categorizing transactions to see AI performance</p>
            </div>
            
            <Button
              onClick={handleMigrateUncategorized}
              disabled={isMigrating}
              className="w-full"
              variant="outline"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Categorizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Categorize Transactions
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Accuracy Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">Accuracy</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getAccuracyColor(metrics.accuracy)}`}>
                    {(metrics.accuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getAccuracyLabel(metrics.accuracy)}
                  </div>
                </div>
              </div>
              
              <Progress value={metrics.accuracy * 100} className="h-2" />
              
              <div className="text-xs text-muted-foreground">
                {metrics.acceptedSuggestions} of {metrics.totalSuggestions} suggestions accepted
              </div>
            </div>

            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-sm">Average Confidence</span>
                </div>
                <div className="font-bold text-green-500">
                  {(metrics.averageConfidence * 100).toFixed(0)}%
                </div>
              </div>
              
              <Progress value={metrics.averageConfidence * 100} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-bold text-lg">{metrics.totalSuggestions}</div>
                <div className="text-xs text-muted-foreground">Total Suggestions</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="font-bold text-lg">{metrics.acceptedSuggestions}</div>
                <div className="text-xs text-muted-foreground">Accepted</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                onClick={handleMigrateUncategorized}
                disabled={isMigrating}
                className="w-full"
                variant="outline"
                size="sm"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Categorize More
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Status Badge */}
        <div className="pt-2">
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}