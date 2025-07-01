import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function MonthlySpendChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["/api/summary"],
  });

  useEffect(() => {
    if (!chartRef.current || !summary?.monthlySpend) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Generate sample data for the last 6 months
    const currentDate = new Date();
    const months = [];
    const infraData = [];
    const licenseData = [];
    const usageData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
      
      // Sample data for visualization
      infraData.push(8000 + Math.random() * 2000);
      licenseData.push(2000 + Math.random() * 500);
      usageData.push(200 + Math.random() * 200);
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Infrastructure',
            data: infraData,
            backgroundColor: 'hsl(207, 90%, 54%)',
          },
          {
            label: 'Licenses',
            data: licenseData,
            backgroundColor: 'hsl(142, 76%, 36%)',
          },
          {
            label: 'Usage',
            data: usageData,
            backgroundColor: 'hsl(32, 95%, 44%)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [summary]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Monthly Spend by Category</CardTitle>
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}
