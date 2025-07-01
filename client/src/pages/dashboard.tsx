import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import KpiCards from "@/components/dashboard/kpi-cards";
import MonthlySpendChart from "@/components/dashboard/monthly-spend-chart";
import CategoryChart from "@/components/dashboard/category-chart";
import RecentActivities from "@/components/dashboard/recent-activities";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Dashboard"
          subtitle="Overview of your infrastructure and service costs"
        />
        <main className="p-8">
          <KpiCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <MonthlySpendChart />
            <CategoryChart />
          </div>

          <RecentActivities />
        </main>
      </div>
    </div>
  );
}
