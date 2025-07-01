import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Building, Tag, Server } from "lucide-react";

interface MonthlyDetailItem {
  serviceName: string;
  providerName: string;
  category: string;
  monthlyAmount: number;
  type: 'infrastructure' | 'license' | 'usage';
  status?: string;
}

export default function MonthlyDetailTable() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const { data: monthlyDetails, isLoading } = useQuery({
    queryKey: [`/api/monthly-details/${currentYear}/${currentMonth}`],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'infrastructure':
        return <Server className="w-4 h-4 text-blue-600" />;
      case 'license':
        return <Tag className="w-4 h-4 text-green-600" />;
      case 'usage':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Building className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'infrastructure':
        return 'bg-blue-100 text-blue-800';
      case 'license':
        return 'bg-green-100 text-green-800';
      case 'usage':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAmount = Array.isArray(monthlyDetails) 
    ? monthlyDetails.reduce((sum: number, item: MonthlyDetailItem) => sum + item.monthlyAmount, 0)
    : 0;

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <CardTitle>Monthly Detail - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>Monthly Detail - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-gray-500">Total this month</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!Array.isArray(monthlyDetails) || monthlyDetails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No data for this month</p>
            <p className="text-sm">Start by adding services, licenses, or usage records</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
              <div className="col-span-4">Service</div>
              <div className="col-span-3">Provider</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {monthlyDetails.map((item: MonthlyDetailItem, index: number) => (
                <div 
                  key={index} 
                  className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="col-span-4">
                    <div className="font-medium text-gray-900">{item.serviceName}</div>
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.category)}
                      <span className="text-gray-700">{item.providerName}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Badge className={`${getTypeBadgeColor(item.type)} text-xs`}>
                      {item.type}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{item.category}</span>
                  </div>
                  
                  <div className="col-span-1 text-right">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.monthlyAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}