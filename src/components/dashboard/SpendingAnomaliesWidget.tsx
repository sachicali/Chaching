"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { detectSpendingAnomalies, type DetectSpendingAnomaliesOutput } from "@/ai/flows/detect-spending-anomalies";
import AIDataService from "@/services/ai-data.service";
import { useToast } from "@/hooks/use-toast";

interface SpendingAnomaliesWidgetProps {
  userId: string;
  className?: string;
}

export function SpendingAnomaliesWidget({ userId, className }: SpendingAnomaliesWidgetProps) {
  const [anomalies, setAnomalies] = useState<DetectSpendingAnomaliesOutput['anomalies']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Memoize the data service to prevent recreation on every render
  const dataService = useMemo(() => new AIDataService(userId), [userId]);

  const loadAnomalies = useCallback(async (isRefresh = false) => {

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('Loading spending anomaly data...');
      const anomalyData = await dataService.getSpendingAnomalyData(30); // Last 30 days
      console.log('Spending anomaly data:', anomalyData);
      
      console.log('Detecting spending anomalies...');
      const result = await detectSpendingAnomalies(anomalyData);
      console.log('Spending anomalies detected:', result);
      setAnomalies(result.anomalies);

    } catch (error) {
      console.error('Error loading spending anomalies:', error);
      
      // Handle specific error types
      if (error instanceof Error && error.message === 'NO_DATA_AVAILABLE') {
        console.log('No data available for spending anomaly detection');
        setAnomalies([]); // This will show the "no anomalies detected" message
        return;
      }
      
      if (error instanceof Error && error.message === 'ALL_AI_SERVICES_FAILED') {
        console.error('All AI services failed');
        toast({
          title: "AI Services Unavailable",
          description: "Google AI, local Ollama, and Hugging Face models are all currently unavailable. Please try again later.",
          variant: "destructive"
        });
        setAnomalies([]);
        return;
      }
      
      // For other errors, still show toast but don't set mock data
      if (error instanceof Error && !error.message.includes('Failed to get') && !error.message.includes('429')) {
        toast({
          title: "Anomaly Detection Error",
          description: "Unable to detect spending anomalies. Please try again.",
          variant: "destructive"
        });
      }
      
      setAnomalies([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dataService, toast]); // Remove isLoading and isRefreshing from deps to prevent unnecessary recreations

  useEffect(() => {
    loadAnomalies();
    
    // Cleanup function
    return () => {};
  }, [loadAnomalies]); // Remove isLoading dependency to prevent infinite loop

  const handleRefresh = () => {
    loadAnomalies(true);
  };

  const getSeverityColor = (deviation: string) => {
    const lowerDev = deviation.toLowerCase();
    if (lowerDev.includes('much higher') || lowerDev.includes('significantly')) {
      return 'text-red-500';
    } else if (lowerDev.includes('higher') || lowerDev.includes('unusual')) {
      return 'text-orange-500';
    } else {
      return 'text-yellow-500';
    }
  };

  const getSeverityIcon = (deviation: string) => {
    const lowerDev = deviation.toLowerCase();
    if (lowerDev.includes('higher') || lowerDev.includes('increase')) {
      return <TrendingUp className="h-4 w-4" />;
    } else {
      return <TrendingDown className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Spending Anomalies</CardTitle>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <CardDescription>AI detection of unusual spending patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-5 w-5 ${anomalies.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <CardTitle>Spending Anomalies</CardTitle>
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
        <CardDescription>AI detection of unusual spending patterns (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No data available for anomaly detection</p>
            <p className="text-xs mt-1">Add more expense transactions to detect spending patterns</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.slice(0, 3).map((anomaly, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={getSeverityColor(anomaly.deviation)}>
                      {getSeverityIcon(anomaly.deviation)}
                    </span>
                    <span className="font-medium text-sm">{anomaly.category}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    ₱{anomaly.amount.toLocaleString()}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Deviation:</span> {anomaly.deviation}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {anomaly.reason}
                  </p>
                </div>
              </div>
            ))}
            
            {anomalies.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View {anomalies.length - 3} more anomalies
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="pt-3 border-t mt-4">
          <Badge 
            variant={anomalies.length > 0 ? "destructive" : "secondary"} 
            className="text-xs"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {anomalies.length > 0 ? `${anomalies.length} Anomalies` : 'All Clear'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}