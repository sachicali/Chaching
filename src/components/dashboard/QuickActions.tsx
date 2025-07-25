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
  BarChart3,
  Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface QuickActionsProps {
  className?: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Add Income",
    description: "Record a new payment or income",
    href: "/income",
    icon: TrendingUp
  },
  {
    title: "Add Expense", 
    description: "Log a business expense",
    href: "/expenses",
    icon: TrendingDown
  },
  {
    title: "Manage Clients",
    description: "View and manage your clients",
    href: "/clients",
    icon: Users
  },
  {
    title: "Create Invoice",
    description: "Generate a new invoice",
    href: "/invoices",
    icon: FileText
  },
  {
    title: "Set Goal",
    description: "Create a financial goal",
    href: "/goals",
    icon: Target
  },
  {
    title: "View Reports",
    description: "Access financial reports",
    href: "/reports",
    icon: BarChart3
  }
];

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Simple Header */}
      <h3 className="text-lg font-semibold text-foreground">
        Quick Actions
      </h3>

      {/* Clean Action Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <Link key={action.title} href={action.href}>
              <div className="group relative p-4 rounded-xl border border-border bg-gradient-to-b from-card to-card/95 hover:from-card/98 hover:to-card hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center transition-all duration-200 group-hover:from-primary/10 group-hover:to-primary/15 shadow-sm group-hover:shadow-md">
                    <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors duration-200">
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}