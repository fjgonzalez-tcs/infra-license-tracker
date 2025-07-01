import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Tag, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiCards() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/summary"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Month</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary?.currentMonthTotal || 0)}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">+8.2%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">YoY Growth</p>
              <p className="text-3xl font-bold text-gray-900">+23.5%</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">vs last year</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Licenses</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.activeLicenses || 0}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-warning-600 font-medium">
                  {summary?.expiringLicenses || 0} expiring soon
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-warning-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Balance Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.lowBalanceAlerts || 0}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-error-600 font-medium">
                  Services below threshold
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-error-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-error-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
