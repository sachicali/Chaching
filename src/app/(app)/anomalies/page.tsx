
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { detectSpendingAnomalies, type DetectSpendingAnomaliesInput, type DetectSpendingAnomaliesOutput } from "@/ai/flows/detect-spending-anomalies";
import { useToast } from "@/hooks/use-toast";

export default function AnomaliesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<DetectSpendingAnomaliesOutput['anomalies']>([]);
  const [inputData, setInputData] = useState<DetectSpendingAnomaliesInput>({
    spendingData: JSON.stringify([], null, 2),
    averageSpendingByCategory: JSON.stringify({}, null, 2),
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof DetectSpendingAnomaliesInput, value: string) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setAnomalies([]);
    try {
      // Validate JSON inputs before sending to AI
      JSON.parse(inputData.spendingData);
      JSON.parse(inputData.averageSpendingByCategory);

      const result = await detectSpendingAnomalies(inputData);
      setAnomalies(result.anomalies);
      if (result.anomalies.length > 0) {
        toast({ title: "Anomalies Detected", description: `Found ${result.anomalies.length} potential spending anomalies.` });
      } else {
        toast({ title: "No Anomalies Found", description: "Your spending looks normal." });
      }
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      if (error instanceof SyntaxError) {
         toast({ title: "Invalid JSON", description: "Please check your input data format.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to detect anomalies. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Spending Anomaly Alerts</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
            Detect Spending Anomalies
          </CardTitle>
          <CardDescription>Input spending data and averages to identify unusual spending patterns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="spendingData">Spending Data (JSON Array)</Label>
            <Textarea 
              id="spendingData" 
              rows={5}
              placeholder='[{"category": "Groceries", "amount": 200}]'
              value={inputData.spendingData}
              onChange={(e) => handleInputChange('spendingData', e.target.value)}
            />
          </div>
           <div>
            <Label htmlFor="averageSpending">Average Spending by Category (JSON Object)</Label>
            <Textarea 
              id="averageSpending" 
              rows={5}
              placeholder='{"Groceries": 150, "Utilities": 100}'
              value={inputData.averageSpendingByCategory}
              onChange={(e) => handleInputChange('averageSpendingByCategory', e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Detect Anomalies
          </Button>
        </CardContent>
      </Card>

      {anomalies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deviation</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly, index) => (
                  <TableRow key={index}>
                    <TableCell>{anomaly.category}</TableCell>
                    <TableCell>₱{anomaly.amount.toLocaleString()}</TableCell>
                    <TableCell>{anomaly.deviation}</TableCell>
                    <TableCell>{anomaly.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
       { !isLoading && anomalies.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>No anomalies detected or analysis not yet run.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
