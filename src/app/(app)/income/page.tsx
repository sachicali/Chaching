
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { useClients } from "@/contexts/ClientContext";
import { useMemo } from "react";

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "₱0.00";
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function IncomePage() {
  const { clients } = useClients();

  const totalClientEarnings = useMemo(() => {
    return clients.reduce((sum, client) => sum + (client.monthlyEarnings || 0), 0);
  }, [clients]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Income Tracking</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Projected Monthly Client Earnings
          </CardTitle>
          <CardDescription>Total estimated monthly income from all your clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-positive">
            {formatCurrency(totalClientEarnings)}
          </div>
           {clients.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No clients added yet. Add clients on the <a href="/clients" className="underline hover:text-primary">Clients page</a> to see projected earnings.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Track Your Income
          </CardTitle>
          <CardDescription>Log and categorize your income for detailed reporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Income tracking, categorization, and reporting tools will be here.</p>
            <p className="text-sm">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
