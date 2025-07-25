"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Brain, RefreshCw, TrendingUp, Calendar } from "lucide-react";
import { predictIncome, type PredictIncomeOutput } from "@/ai/flows/predict-income";
import AIDataService from "@/services/ai-data.service";
import { useToast } from "@/hooks/use-toast";

interface IncomePredictionWidgetProps {
  userId: string;
  className?: string;
}

export function IncomePredictionWidget({ userId, className }: IncomePredictionWidgetProps) {
  const [prediction, setPrediction] = useState<PredictIncomeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  const { toast } = useToast();

  // Memoize the data service to prevent recreation on every render
  const dataService = useMemo(() => new AIDataService(userId), [userId]);

  const loadPrediction = useCallback(async (isRefresh = false) => {

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('Loading income prediction data...');
      const predictionData = await dataService.getIncomepredictionData(12); // 12 months history
      console.log('Income prediction data:', predictionData);
      
      // Also get current month income for comparison
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const currentMonthData = await dataService.getFinancialAggregation(monthStart, currentMonth);
      setCurrentMonthIncome(currentMonthData.totalIncome);
      console.log('Current month income:', currentMonthData.totalIncome);

      console.log('Generating AI income prediction...');
      const aiPrediction = await predictIncome(predictionData);
      console.log('AI income prediction generated:', aiPrediction);
      setPrediction(aiPrediction);

    } catch (error) {
      console.error('Error loading income prediction:', error);
      
      // Handle specific error types
      if (error instanceof Error && error.message === 'NO_DATA_AVAILABLE') {
        console.log('No data available for income prediction');
        setPrediction(null); // This will show the "no data" message
        return;
      }
      
      if (error instanceof Error && error.message === 'ALL_AI_SERVICES_FAILED') {
        console.error('All AI services failed');
        toast({
          title: "AI Services Unavailable",
          description: "Google AI, local Ollama, and Hugging Face models are all currently unavailable. Please try again later.",
          variant: "destructive"
        });
        setPrediction(null);
        return;
      }
      
      // For other errors, still show toast but don't set mock data
      if (error instanceof Error && !error.message.includes('Failed to get') && !error.message.includes('429')) {
        toast({
          title: "Prediction Error",
          description: "Unable to predict income. Please try again.",
          variant: "destructive"
        });
      }
      
      setPrediction(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dataService, toast]); // Remove isLoading and isRefreshing from deps to prevent unnecessary recreations

  useEffect(() => {
    loadPrediction();
    
    // Cleanup function
    return () => {};
  }, [loadPrediction]); // Remove isLoading dependency to prevent infinite loop

  const handleRefresh = () => {
    loadPrediction(true);
  };

  const getNextMonthName = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calculateProgressPercentage = () => {
    if (!prediction || currentMonthIncome === 0) return 0;
    return Math.min((currentMonthIncome / prediction.predictedIncome) * 100, 100);
  };

  const getConfidenceColor = (confidence: string) => {
    const lowerConf = confidence.toLowerCase();
    if (lowerConf.includes('95%') || lowerConf.includes('high')) {
      return 'text-green-500';
    } else if (lowerConf.includes('80%') || lowerConf.includes('moderate')) {
      return 'text-yellow-500';
    } else {
      return 'text-orange-500';
    }
  };

  if (isLoading) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <CardTitle>Income Prediction</CardTitle>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <CardDescription>AI-powered forecast for next month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className={`hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] hover:border-emerald-500/20 transition-all duration-200 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Income Prediction</CardTitle>
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
            <p className="text-sm">No data available for AI income prediction</p>
            <p className="text-xs mt-1">Add more income history to get predictions (at least 3 months needed)</p>
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
            <CardTitle>Income Prediction</CardTitle>
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
        <CardDescription>AI-powered forecast for {getNextMonthName()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predicted Amount */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h4 className="font-semibold text-sm">Predicted Income</h4>
          </div>
          <div className="text-2xl font-bold text-primary">
            ₱{prediction.predictedIncome.toLocaleString()}
          </div>
        </div>

        {/* Current Month Progress */}
        {currentMonthIncome > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">This month's progress</span>
              <span className="font-medium">₱{currentMonthIncome.toLocaleString()}</span>
            </div>
            <Progress value={calculateProgressPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {calculateProgressPercentage().toFixed(0)}% of predicted amount
            </p>
          </div>
        )}

        {/* Confidence Interval */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <h4 className="font-semibold text-sm">Confidence Level</h4>
          </div>
          <p className={`text-sm font-medium ${getConfidenceColor(prediction.confidenceInterval)}`}>
            {prediction.confidenceInterval}
          </p>
        </div>

        {/* Influencing Factors */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Key Factors</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {prediction.factors}
          </p>
        </div>

        {/* Status Badge */}
        <div className="pt-2 border-t">
          <Badge variant="secondary" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            ML Prediction
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}