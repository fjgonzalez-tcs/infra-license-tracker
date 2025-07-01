import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpent: number;
  budgetUtilization: number;
  overBudgetCount: number;
  alertCount: number;
}

export default function BudgetCards() {
  const { data: summary, isLoading } = useQuery<BudgetSummary>({
    queryKey: ['/api/budget/summary'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>No Budget Data</CardTitle>
            <CardDescription>Create your first budget to get started</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const utilizationColor = summary.budgetUtilization > 90 ? 'text-red-600' : 
                          summary.budgetUtilization > 80 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.totalBudgetAmount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {summary.activeBudgets} of {summary.totalBudgets} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.totalSpent.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Current month spending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${utilizationColor}`}>
            {summary.budgetUtilization.toFixed(1)}%
          </div>
          <Progress value={summary.budgetUtilization} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.alertCount}</div>
          <p className="text-xs text-muted-foreground">
            {summary.overBudgetCount} over budget
          </p>
        </CardContent>
      </Card>
    </div>
  );
}