import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TriangleAlert, Info, Download } from "lucide-react";
import { SiAws, SiMicrosoft } from "react-icons/si";
import { Bot } from "lucide-react";

export default function RecentActivities() {
  const { data: summary } = useQuery({
    queryKey: ["/api/summary"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProviderIcon = (providerName: string) => {
    const name = providerName?.toLowerCase() || '';
    if (name.includes('amazon') || name.includes('aws')) {
      return <SiAws className="text-orange-600" />;
    }
    if (name.includes('microsoft')) {
      return <SiMicrosoft className="text-blue-600" />;
    }
    if (name.includes('openai')) {
      return <Bot className="text-green-600" />;
    }
    return <div className="w-4 h-4 bg-gray-400 rounded" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices && invoices.length > 0 ? (
              invoices.slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      {getProviderIcon(invoice.provider?.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.service?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.invoiceMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(invoice.amount))}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent invoices found</p>
                <p className="text-sm">Start by adding infrastructure services and their monthly costs</p>
              </div>
            )}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-primary-600 hover:text-primary-700">
            View all invoices
          </Button>
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.alerts?.expiring && summary.alerts.expiring.length > 0 && (
              summary.alerts.expiring.slice(0, 2).map((alert: any) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-warning-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">License Expiring Soon</p>
                    <p className="text-sm text-gray-600">{alert.service?.name} expires soon</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(alert.annualCommitmentEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}

            {summary?.alerts?.lowBalance && summary.alerts.lowBalance.length > 0 && (
              summary.alerts.lowBalance.slice(0, 1).map((alert: any) => (
                <div key={alert.serviceId} className="flex items-start space-x-3 p-3 bg-error-50 rounded-lg">
                  <TriangleAlert className="h-5 w-5 text-error-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Low Balance Alert</p>
                    <p className="text-sm text-gray-600">{alert.serviceName} balance below 20%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {formatCurrency(alert.balance)} / Total: {formatCurrency(alert.totalPurchased)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {(!summary?.alerts?.expiring?.length && !summary?.alerts?.lowBalance?.length) && (
              <>
                <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
                  <Info className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Welcome to CostWatch</p>
                    <p className="text-sm text-gray-600">Start by adding your services and tracking costs</p>
                    <Button variant="link" className="text-xs text-primary-600 hover:text-primary-700 p-0 h-auto mt-1">
                      Get started
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
                  <Download className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Monthly Report Ready</p>
                    <p className="text-sm text-gray-600">Cost analysis available for download</p>
                    <Button variant="link" className="text-xs text-primary-600 hover:text-primary-700 p-0 h-auto mt-1">
                      Download report
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
