
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Newspaper, Loader2, Sparkles } from "lucide-react";
import { generateWeeklySummary, type GenerateWeeklySummaryInput, type GenerateWeeklySummaryOutput } from "@/ai/flows/generate-weekly-summary";
import { useToast } from "@/hooks/use-toast";

export default function DigestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<GenerateWeeklySummaryOutput | null>(null);
  const [inputData, setInputData] = useState<GenerateWeeklySummaryInput>({
    income: 0,
    expenses: 0,
    savings: 0,
    spendingByCategory: {},
    previousWeekIncome: 0,
    previousWeekExpenses: 0,
    previousWeekSavings: 0,
  });
  const { toast } = useToast();
  
  const handleInputChange = (field: keyof GenerateWeeklySummaryInput, value: string | number | Record<string, number>) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonInputChange = (field: 'spendingByCategory', value: string) => {
    try {
      const parsed = JSON.parse(value);
      setInputData(prev => ({ ...prev, [field]: parsed }));
    } catch (error) {
       toast({ title: "Invalid JSON", description: `Please enter valid JSON for ${field}.`, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await generateWeeklySummary(inputData);
      setSummary(result);
      toast({ title: "Weekly Summary Generated", description: "Successfully generated your weekly digest." });
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      toast({ title: "Error", description: "Failed to generate weekly summary. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Weekly Financial Digest</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2 h-5 w-5 text-primary" />
            Generate Weekly Summary
          </CardTitle>
          <CardDescription>Input your weekly financial data to get an AI-generated summary, trends, and saving opportunities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="income">This Week's Income</Label>
              <Input id="income" type="number" value={inputData.income} onChange={(e) => handleInputChange('income', parseFloat(e.target.value) || 0)} />
            </div>
             <div>
              <Label htmlFor="expenses">This Week's Expenses</Label>
              <Input id="expenses" type="number" value={inputData.expenses} onChange={(e) => handleInputChange('expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="savings">This Week's Savings</Label>
              <Input id="savings" type="number" value={inputData.savings} onChange={(e) => handleInputChange('savings', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="prevIncome">Previous Week's Income</Label>
              <Input id="prevIncome" type="number" value={inputData.previousWeekIncome} onChange={(e) => handleInputChange('previousWeekIncome', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="prevExpenses">Previous Week's Expenses</Label>
              <Input id="prevExpenses" type="number" value={inputData.previousWeekExpenses} onChange={(e) => handleInputChange('previousWeekExpenses', parseFloat(e.target.value) || 0)} />
            </div>
             <div>
              <Label htmlFor="prevSavings">Previous Week's Savings</Label>
              <Input id="prevSavings" type="number" value={inputData.previousWeekSavings} onChange={(e) => handleInputChange('previousWeekSavings', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
           <div>
            <Label htmlFor="spendingByCategory">This Week's Spending By Category (JSON)</Label>
            <Textarea 
              id="spendingByCategory" 
              rows={3}
              placeholder='{ "Groceries": 0, "Dining": 0 }'
              defaultValue={JSON.stringify(inputData.spendingByCategory, null, 2)}
              onChange={(e) => handleJsonInputChange('spendingByCategory', e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Weekly Digest
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Weekly Digest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Summary</h3>
              <p className="text-muted-foreground">{summary.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Key Trends</h3>
              <p className="text-muted-foreground">{summary.trends}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Saving Opportunities</h3>
              <p className="text-muted-foreground">{summary.opportunities}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
