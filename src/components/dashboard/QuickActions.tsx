"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Target,
  BarChart3
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  variant: "default" | "outline" | "secondary";
  color: string;
}

interface QuickActionsProps {
  className?: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Add Income",
    description: "Record a new payment or income",
    href: "/income",
    icon: TrendingUp,
    variant: "default",
    color: "text-green-600"
  },
  {
    title: "Add Expense", 
    description: "Log a business expense",
    href: "/expenses",
    icon: TrendingDown,
    variant: "outline",
    color: "text-red-600"
  },
  {
    title: "Manage Clients",
    description: "View and manage your clients",
    href: "/clients",
    icon: Users,
    variant: "outline", 
    color: "text-blue-600"
  },
  {
    title: "Create Invoice",
    description: "Generate a new invoice",
    href: "/invoices",
    icon: FileText,
    variant: "outline",
    color: "text-purple-600"
  },
  {
    title: "Set Goal",
    description: "Create a financial goal",
    href: "/goals",
    icon: Target,
    variant: "outline",
    color: "text-orange-600"
  },
  {
    title: "View Reports",
    description: "Access financial reports",
    href: "/reports",
    icon: BarChart3,
    variant: "outline",
    color: "text-indigo-600"
  }
];

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Link key={action.title} href={action.href}>
                <Button 
                  variant={action.variant} 
                  className="w-full h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`p-2 rounded-md bg-background ${action.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{action.title}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-left w-full">
                    {action.description}
                  </p>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}