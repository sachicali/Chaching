"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Repeat } from "lucide-react";

export default function RecurringPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Recurring Transactions</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Repeat className="mr-2 h-5 w-5 text-primary" />
            Manage Recurring Items
          </CardTitle>
          <CardDescription>Track subscriptions, retainers, rent, utilities, and forecast net income.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Tools for managing recurring income and expenses will be here.</p>
            <p className="text-sm">Smart forecasting of net income month over month. Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
