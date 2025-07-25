
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { predictIncome, type PredictIncomeInput, type PredictIncomeOutput } from "@/ai/flows/predict-income";
import { useToast } from "@/hooks/use-toast";

export default function PredictionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictIncomeOutput | null>(null);
  const [inputData, setInputData] = useState<PredictIncomeInput>({
    historicalIncomeData: JSON.stringify([], null, 2),
    seasonality: "",
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof PredictIncomeInput, value: string) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setPrediction(null);
    try {
      // Validate JSON input
      JSON.parse(inputData.historicalIncomeData);

      const result = await predictIncome(inputData);
      setPrediction(result);
      toast({ title: "Income Prediction Generated", description: "Successfully predicted your next month's income." });
    } catch (error) {
      console.error("Error predicting income:", error);
      if (error instanceof SyntaxError) {
         toast({ title: "Invalid JSON", description: "Please check your historical income data format.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to predict income. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Income Predictive Analytics</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            Predict Future Income
          </CardTitle>
          <CardDescription>Provide historical income data and seasonality to predict next month's income.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="historicalData">Historical Income Data (JSON Array)</Label>
            <Textarea 
              id="historicalData" 
              rows={8}
              placeholder='[{"date": "YYYY-MM-DD", "income": 0}]'
              value={inputData.historicalIncomeData}
              onChange={(e) => handleInputChange('historicalIncomeData', e.target.value)}
            />
          </div>
           <div>
            <Label htmlFor="seasonality">Seasonality (Optional)</Label>
            <Input 
              id="seasonality" 
              placeholder="e.g., Income is higher in Q2"
              value={inputData.seasonality || ""}
              onChange={(e) => handleInputChange('seasonality', e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} variant="default">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Predict Income
          </Button>
        </CardContent>
      </Card>

      {prediction && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Income Prediction Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Predicted Income (Next Month)</h3>
              <p className="text-2xl font-bold text-primary">₱{prediction.predictedIncome.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Confidence Interval</h3>
              <p className="text-muted-foreground">{prediction.confidenceInterval}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Influencing Factors</h3>
              <p className="text-muted-foreground">{prediction.factors}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
