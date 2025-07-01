import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import KpiCards from "@/components/dashboard/kpi-cards";
import MonthlySpendChart from "@/components/dashboard/monthly-spend-chart";
import CategoryChart from "@/components/dashboard/category-chart";
import RecentActivities from "@/components/dashboard/recent-activities";
import MonthlyDetailTable from "@/components/dashboard/monthly-detail-table";
import CostForecast from "@/components/dashboard/cost-forecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";

export default function Dashboard() {
  const [showWidgets, setShowWidgets] = useState({
    monthlyDetail: true,
    kpiCards: true,
    monthlyChart: true,
    categoryChart: true,
    recentActivities: true,
    costForecast: true,
  });

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Dashboard"
          subtitle="Overview of your infrastructure and service costs"
        />
        <main className="p-8">
          {/* Widget Settings Panel */}
          <div className="mb-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Widget Settings
            </button>
            
            {showSettings && (
              <Card className="mt-4 max-w-md">
                <CardHeader>
                  <CardTitle className="text-lg">Show/Hide Widgets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monthly-detail"
                      checked={showWidgets.monthlyDetail}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, monthlyDetail: checked === true }))
                      }
                    />
                    <label htmlFor="monthly-detail" className="text-sm font-medium">
                      Monthly Detail Table
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kpi-cards"
                      checked={showWidgets.kpiCards}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, kpiCards: checked === true }))
                      }
                    />
                    <label htmlFor="kpi-cards" className="text-sm font-medium">
                      KPI Cards
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monthly-chart"
                      checked={showWidgets.monthlyChart}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, monthlyChart: checked === true }))
                      }
                    />
                    <label htmlFor="monthly-chart" className="text-sm font-medium">
                      Monthly Spend Chart
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="category-chart"
                      checked={showWidgets.categoryChart}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, categoryChart: checked === true }))
                      }
                    />
                    <label htmlFor="category-chart" className="text-sm font-medium">
                      Category Chart
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recent-activities"
                      checked={showWidgets.recentActivities}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, recentActivities: checked === true }))
                      }
                    />
                    <label htmlFor="recent-activities" className="text-sm font-medium">
                      Recent Activities & Alerts
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cost-forecast"
                      checked={showWidgets.costForecast}
                      onCheckedChange={(checked) =>
                        setShowWidgets(prev => ({ ...prev, costForecast: checked === true }))
                      }
                    />
                    <label htmlFor="cost-forecast" className="text-sm font-medium">
                      Cost Forecast & Trends
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conditional Widget Rendering */}
          {showWidgets.monthlyDetail && <MonthlyDetailTable />}
          
          {showWidgets.kpiCards && <KpiCards />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {showWidgets.monthlyChart && <MonthlySpendChart />}
            {showWidgets.categoryChart && <CategoryChart />}
          </div>

          {showWidgets.recentActivities && <RecentActivities />}
          
          {showWidgets.costForecast && <CostForecast />}
        </main>
      </div>
    </div>
  );
}
