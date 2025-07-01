import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function CategoryChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["/api/summary"],
  });

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Sample data based on summary
    const totalSpend = summary?.currentMonthTotal || 12347;
    const infraSpend = totalSpend * 0.79; // ~79%
    const licenseSpend = totalSpend * 0.18; // ~18%
    const usageSpend = totalSpend * 0.03; // ~3%

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Infrastructure', 'Licenses', 'Usage'],
        datasets: [{
          data: [infraSpend, licenseSpend, usageSpend],
          backgroundColor: [
            'hsl(207, 90%, 54%)',
            'hsl(142, 76%, 36%)',
            'hsl(32, 95%, 44%)',
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Current Month Breakdown</CardTitle>
          <span className="text-sm text-gray-500">{currentMonth}</span>
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
