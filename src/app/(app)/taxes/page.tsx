"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function TaxesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Tax Estimation</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            Estimate Your Tax Obligations
          </CardTitle>
          <CardDescription>Automatically estimate quarterly/annual tax obligations based on your income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Tax estimation tools will be available here.</p>
            <p className="text-sm">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
