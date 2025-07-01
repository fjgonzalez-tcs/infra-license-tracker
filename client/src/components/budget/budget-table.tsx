import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BudgetItem {
  id: number;
  name: string;
  categoryName?: string;
  serviceName?: string;
  budgetType: string;
  budgetAmount: number;
  budgetPeriod: string;
  currentSpend: number;
  utilization: number;
  alertThreshold: number;
  isActive: boolean;
  status: 'within_budget' | 'approaching_limit' | 'over_budget';
}

export default function BudgetTable() {
  const [selectedBudget, setSelectedBudget] = useState<BudgetItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery<BudgetItem[]>({
    queryKey: ['/api/budgets'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      toast({
        title: "Budget deleted",
        description: "Budget has been successfully deleted.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'within_budget':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Within Budget</Badge>;
      case 'approaching_limit':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Approaching Limit</Badge>;
      case 'over_budget':
        return <Badge variant="destructive">Over Budget</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Manage your budget allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Manage your budget allocations and track spending</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No budgets configured yet.</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{budget.name}</h4>
                    {getStatusBadge(budget.status)}
                    <Badge variant="outline" className="text-xs">
                      {budget.budgetType}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {budget.categoryName && <span>Category: {budget.categoryName}</span>}
                    {budget.serviceName && <span>Service: {budget.serviceName}</span>}
                    <span className="ml-4">Period: {budget.budgetPeriod}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">${budget.currentSpend.toLocaleString()}</span>
                      <span className="text-gray-500"> / ${budget.budgetAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <Progress value={Math.min(budget.utilization, 100)} className="h-2" />
                    </div>
                    <div className={`text-sm font-medium ${getUtilizationColor(budget.utilization)}`}>
                      {budget.utilization.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(budget.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}