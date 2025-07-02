import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, Plus, TrendingUp, Upload } from "lucide-react";
import { SiOpenai, SiTwilio } from "react-icons/si";
import AddTopupModal from "./add-topup-modal";
import AddConsumptionModal from "./add-consumption-modal";
import BulkImportModal from "./bulk-import-modal";

export default function UsageCards() {
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: topups } = useQuery({
    queryKey: ["/api/usage/topups"],
  });

  const { data: consumption } = useQuery({
    queryKey: ["/api/usage/consumption"],
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

  const getUsageBalance = (serviceId: number) => {
    const serviceTopups = Array.isArray(topups) ? topups.filter((t: any) => t.service?.id === serviceId) : [];
    const serviceConsumption = Array.isArray(consumption) ? consumption.filter((c: any) => c.service?.id === serviceId) : [];
    
    const totalPurchased = serviceTopups.reduce((sum: number, topup: any) => 
      sum + Number(topup.amountPurchased), 0);
    const totalConsumed = serviceConsumption.reduce((sum: number, cons: any) => 
      sum + Number(cons.amountConsumed), 0);
    
    const balance = totalPurchased - totalConsumed;
    const percentRemaining = totalPurchased > 0 ? (balance / totalPurchased) * 100 : 0;
    
    return { balance, totalPurchased, totalConsumed, percentRemaining };
  };

  const getBalanceStatus = (percentRemaining: number) => {
    if (percentRemaining < 20) {
      return { label: "Low Balance", variant: "destructive" as const, color: "error" };
    } else if (percentRemaining < 50) {
      return { label: "Medium", variant: "secondary" as const, color: "warning" };
    } else {
      return { label: "Healthy", variant: "default" as const, color: "success" };
    }
  };

  const handleTopup = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsTopupModalOpen(true);
  };

  const handleConsumption = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsConsumptionModalOpen(true);
  };

  // Filter only usage services
  const usageServices = services?.filter((service: any) => 
    service.category?.name?.toLowerCase().includes('usage')
  ) || [];

  if (usageServices.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => setIsTopupModalOpen(true)}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Top-up
          </Button>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-2">
              <TrendingUp className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No usage services found</p>
              <p className="text-sm">Add usage-based services to track balances and consumption</p>
            </div>
          </CardContent>
        </Card>

        <AddTopupModal 
          isOpen={isTopupModalOpen}
          onClose={() => setIsTopupModalOpen(false)}
          selectedServiceId={selectedServiceId}
        />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={() => setIsTopupModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Top-up
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usageServices.map((service: any) => {
          const { balance, totalPurchased, totalConsumed, percentRemaining } = getUsageBalance(service.id);
          const status = getBalanceStatus(percentRemaining);

          return (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      {getServiceIcon(service.name, service.provider?.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.provider?.name}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </div>
                
                {/* Balance Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Balance</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Purchased</span>
                    <span className="text-gray-700">{formatCurrency(totalPurchased)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Consumed</span>
                    <span className="text-gray-700">{formatCurrency(totalConsumed)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Balance Usage</span>
                    <span>{percentRemaining.toFixed(1)}% remaining</span>
                  </div>
                  <Progress 
                    value={100 - percentRemaining} 
                    className="h-2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 px-3"
                    onClick={() => handleTopup(service.id)}
                  >
                    Top Up
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 text-sm py-2 px-3"
                    onClick={() => handleConsumption(service.id)}
                  >
                    Add Usage
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddTopupModal 
        isOpen={isTopupModalOpen}
        onClose={() => {
          setIsTopupModalOpen(false);
          setSelectedServiceId(null);
        }}
        selectedServiceId={selectedServiceId}
      />

      <AddConsumptionModal 
        isOpen={isConsumptionModalOpen}
        onClose={() => {
          setIsConsumptionModalOpen(false);
          setSelectedServiceId(null);
        }}
        selectedServiceId={selectedServiceId}
      />
    </div>
  );
}
