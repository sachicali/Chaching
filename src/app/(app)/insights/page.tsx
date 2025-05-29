
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { generateFinancialInsights, type FinancialInsightsInput, type FinancialInsightsOutput } from "@/ai/flows/generate-financial-insights";
import { useToast } from "@/hooks/use-toast";

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsightsOutput | null>(null);
  const [inputData, setInputData] = useState<FinancialInsightsInput>({
    income: 0,
    expenses: 0,
    savings: 0,
    spendingByCategory: {},
    recurringExpenses: {},
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof FinancialInsightsInput, value: string | number | Record<string, number>) => {
     if (typeof value === 'string' && !isNaN(parseFloat(value)) && (field === 'income' || field === 'expenses' || field === 'savings')) {
      setInputData(prev => ({ ...prev, [field]: parseFloat(value) }));
    } else {
      setInputData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleJsonInputChange = (field: 'spendingByCategory' | 'recurringExpenses', value: string) => {
    try {
      const parsed = JSON.parse(value);
      setInputData(prev => ({ ...prev, [field]: parsed }));
    } catch (error) {
      toast({ title: "Invalid JSON", description: `Please enter valid JSON for ${field}.`, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setInsights(null);
    try {
      const result = await generateFinancialInsights(inputData);
      setInsights(result);
      toast({ title: "Insights Generated", description: "Successfully generated financial insights." });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({ title: "Error", description: "Failed to generate insights. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Financial Insights</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Generate Insights
          </CardTitle>
          <CardDescription>Enter your financial data to get AI-powered insights and saving opportunities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="income">Total Income</Label>
              <Input id="income" type="number" value={inputData.income} onChange={(e) => handleInputChange('income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="expenses">Total Expenses</Label>
              <Input id="expenses" type="number" value={inputData.expenses} onChange={(e) => handleInputChange('expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="savings">Total Savings</Label>
              <Input id="savings" type="number" value={inputData.savings} onChange={(e) => handleInputChange('savings', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <Label htmlFor="spendingByCategory">Spending By Category (JSON)</Label>
            <Textarea 
              id="spendingByCategory" 
              rows={3}
              placeholder='{ "Food": 0, "Utilities": 0 }'
              defaultValue={JSON.stringify(inputData.spendingByCategory, null, 2)}
              onChange={(e) => handleJsonInputChange('spendingByCategory', e.target.value)} 
            />
          </div>
           <div>
            <Label htmlFor="recurringExpenses">Recurring Expenses (JSON)</Label>
            <Textarea 
              id="recurringExpenses" 
              rows={3}
              placeholder='{ "Rent": 0, "Subscription": 0 }'
              defaultValue={JSON.stringify(inputData.recurringExpenses, null, 2)}
              onChange={(e) => handleJsonInputChange('recurringExpenses', e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Financial Insights
          </Button>
        </CardContent>
      </Card>

      {insights && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Financial Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Summary</h3>
              <p className="text-muted-foreground">{insights.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Spending Habits Analysis</h3>
              <p className="text-muted-foreground">{insights.spendingHabits}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Potential Saving Opportunities</h3>
              {insights.savingsOpportunities.length > 0 ? (
                <ul className="list-disc list-inside text-muted-foreground">
                  {insights.savingsOpportunities.map((opp, index) => (
                    <li key={index}>{opp}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific saving opportunities identified with current data.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
