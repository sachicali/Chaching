
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface GoalTrackerProps {
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  currency?: string;
}

export function GoalTracker({
  goalName,
  targetAmount,
  currentAmount,
  currency = "₱",
}: GoalTrackerProps) {
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Target className="mr-2 h-5 w-5 text-primary" />
          {goalName}
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {currency}{currentAmount.toLocaleString()} / {currency}{targetAmount.toLocaleString()}
        </span>
      </CardHeader>
      <CardContent>
        <Progress value={progressPercentage} aria-label={`${goalName} progress`} className="h-3 my-2"/>
        <CardDescription className="text-xs text-right">
          {Math.round(progressPercentage)}% achieved
        </CardDescription>
      </CardContent>
    </Card>
  );
}
