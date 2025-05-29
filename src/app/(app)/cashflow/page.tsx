
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChartHorizontalBig } from "lucide-react";

export default function CashFlowPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Cash Flow Forecasting</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
            Predict Your Financial Health
          </CardTitle>
          <CardDescription>Forecast upcoming financial health based on trends and scheduled income/expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Cash flow forecasting tools will be available here.</p>
            <p className="text-sm">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
