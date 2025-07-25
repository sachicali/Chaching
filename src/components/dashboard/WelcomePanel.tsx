"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomePanelProps {
  userName?: string;
  completedSteps: {
    accountCreated: boolean;
    addedIncome: boolean;
    addedExpense: boolean;
    categorizedTransaction: boolean;
    addedClient: boolean;
  };
  onGetStarted?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export function WelcomePanel({
  userName = "there",
  completedSteps,
  onGetStarted,
  onAddIncome,
  onAddExpense,
}: WelcomePanelProps) {
  const steps = [
    { id: 'accountCreated', label: 'Account Created', completed: completedSteps.accountCreated },
    { id: 'addedIncome', label: 'Add Income', completed: completedSteps.addedIncome },
    { id: 'addedExpense', label: 'Add Expense', completed: completedSteps.addedExpense },
    { id: 'categorizedTransaction', label: 'Categorize a Transaction', completed: completedSteps.categorizedTransaction },
    { id: 'addedClient', label: 'Add Client', completed: completedSteps.addedClient },
  ];

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              👋 Welcome, {userName}!
            </h2>
            <p className="text-muted-foreground">
              Let's get your financial management journey started. Complete these steps to unlock powerful insights.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Getting Started</span>
              <span className="text-muted-foreground">{completedCount} of {steps.length} completed</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 text-sm",
                  step.completed ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={cn(
                  "transition-all duration-200",
                  step.completed && "line-through"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Get Started
            </Button>
            <Button 
              onClick={onAddIncome}
              variant="outline"
              size="lg"
              className="hover:border-primary/50"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button 
              onClick={onAddExpense}
              variant="outline"
              size="lg"
              className="hover:border-primary/50"
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}