import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";

interface BudgetChartData {
  labels: string[];
  budgetData: number[];
  spentData: number[];
}

export default function BudgetChart() {
  const { data, isLoading } = useQuery<BudgetChartData>({
    queryKey: ['/api/budget/chart'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Monthly budget performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.labels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Monthly budget performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No budget data available. Create budgets to see performance charts.
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Budget',
        data: data.budgetData,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Actual Spend',
        data: data.spentData,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
        <CardDescription>Monthly budget performance comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}