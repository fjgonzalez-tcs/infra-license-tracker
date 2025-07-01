import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: summary } = useQuery({
    queryKey: ["/api/summary"],
  });

  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Alert Indicators */}
          <div className="flex space-x-2">
            {summary?.expiringLicenses > 0 && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="p-2 text-warning-500 hover:bg-warning-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {summary.expiringLicenses}
                </Badge>
              </div>
            )}
            {summary?.lowBalanceAlerts > 0 && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="p-2 text-error-500 hover:bg-error-50"
                >
                  <TriangleAlert className="h-4 w-4" />
                </Button>
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {summary.lowBalanceAlerts}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Date Range Selector */}
          <Select defaultValue={currentMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentMonth}>
                {new Date(currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </SelectItem>
              <SelectItem value={new Date(currentDate.getFullYear(), currentDate.getMonth() - 1).toISOString().slice(0, 7)}>
                {new Date(currentDate.getFullYear(), currentDate.getMonth() - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </SelectItem>
              <SelectItem value={new Date(currentDate.getFullYear(), currentDate.getMonth() - 2).toISOString().slice(0, 7)}>
                {new Date(currentDate.getFullYear(), currentDate.getMonth() - 2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
