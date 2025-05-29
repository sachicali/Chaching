
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoalTracker } from "@/components/features/goal-tracker";
import { Target, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Goals</h1>
        <Button variant="primary">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-primary" />
            Your Savings Goals
          </CardTitle>
          <CardDescription>Set financial goals and track your progress visually.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GoalTracker goalName="New Laptop" targetAmount={80000} currentAmount={25000} />
          <GoalTracker goalName="Emergency Fund" targetAmount={150000} currentAmount={145000} />
          <GoalTracker goalName="Office Renovation" targetAmount={200000} currentAmount={10000} />
           <div className="text-center py-10 text-muted-foreground md:col-span-2 lg:col-span-3">
            <p>More goals will appear here once added.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
