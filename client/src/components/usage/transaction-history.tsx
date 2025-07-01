import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { SiOpenai, SiTwilio } from "react-icons/si";

export default function TransactionHistory() {
  const { data: topups } = useQuery({
    queryKey: ["/api/usage/topups"],
  });

  const { data: consumption } = useQuery({
    queryKey: ["/api/usage/consumption"],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getServiceIcon = (serviceName: string, providerName: string) => {
    const service = serviceName?.toLowerCase() || '';
    const provider = providerName?.toLowerCase() || '';
    
    if (service.includes('openai') || provider.includes('openai')) {
      return <SiOpenai className="text-green-600" />;
    }
    if (service.includes('twilio') || provider.includes('twilio')) {
      return <SiTwilio className="text-blue-600" />;
    }
    if (service.includes('sms') || service.includes('message')) {
      return <MessageSquare className="text-blue-600" />;
    }
    return <Bot className="text-green-600" />;
  };

  // Combine and sort transactions
  const allTransactions = [
    ...(topups?.map((topup: any) => ({
      id: `topup-${topup.id}`,
      date: topup.topupDate,
      service: topup.service,
      provider: topup.provider,
      type: 'topup',
      amount: Number(topup.amountPurchased),
      balance: 0, // We'll calculate this if needed
    })) || []),
    ...(consumption?.map((cons: any) => ({
      id: `consumption-${cons.id}`,
      date: cons.consumptionDate,
      service: cons.service,
      provider: cons.provider,
      type: 'consumption',
      amount: -Number(cons.amountConsumed),
      balance: 0, // We'll calculate this if needed
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter only usage services
  const usageServices = services?.filter((service: any) => 
    service.category?.name?.toLowerCase().includes('usage')
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex space-x-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {usageServices.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="30days">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allTransactions.slice(0, 20).map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getServiceIcon(transaction.service?.name, transaction.provider?.name)}
                        <span className="text-gray-900">{transaction.service?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {transaction.type === 'topup' ? (
                          <TrendingUp className="h-4 w-4 text-success-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-error-500" />
                        )}
                        <Badge 
                          variant={transaction.type === 'topup' ? 'default' : 'secondary'}
                          className={transaction.type === 'topup' 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-error-100 text-error-800'
                          }
                        >
                          {transaction.type === 'topup' ? 'Top-up' : 'Consumption'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        transaction.amount > 0 ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-2">
              <TrendingUp className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Start by adding top-ups or recording usage consumption</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
