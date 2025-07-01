import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, RotateCcw, DollarSign, Tag, AlertTriangle } from "lucide-react";
// Removed react-icons imports, using lucide icons
import AddLicenseModal from "./add-license-modal";

export default function LicenseTable() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: licenses, isLoading } = useQuery({
    queryKey: ["/api/licenses"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProviderIcon = (providerName: string) => {
    const name = providerName?.toLowerCase() || '';
    if (name.includes('microsoft')) {
      return <Tag className="text-blue-600" />;
    }
    if (name.includes('adobe')) {
      return <Tag className="text-red-600" />;
    }
    if (name.includes('slack')) {
      return <Tag className="text-purple-600" />;
    }
    return <Tag className="text-gray-600" />;
  };

  const getCommitmentStatus = (plan: any) => {
    if (!plan.annualCommitmentEnd) {
      return { label: "Monthly", variant: "secondary" as const };
    }

    const endDate = new Date(plan.annualCommitmentEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Expired", variant: "destructive" as const };
    } else if (diffDays <= 30) {
      return { label: `Expires in ${diffDays} days`, variant: "destructive" as const };
    } else {
      const diffMonths = Math.round(diffDays / 30);
      return { label: `${diffMonths} months remaining`, variant: "default" as const };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
            <p className="text-gray-600">Track license plans, quantities, and renewal dates</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add License Plan
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMonthlyCost = licenses?.reduce((sum: number, license: any) => {
    return sum + (Number(license.monthlyUnitCost) * license.qty);
  }, 0) || 0;

  const activeLicenses = licenses?.length || 0;

  const expiringSoon = licenses?.filter((license: any) => {
    if (!license.annualCommitmentEnd) return false;
    const endDate = new Date(license.annualCommitmentEnd);
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
          <p className="text-gray-600">Track license plans, quantities, and renewal dates</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add License Plan
        </Button>
      </div>

      {/* License Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyCost)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Licenses</p>
                <p className="text-2xl font-bold text-gray-900">{activeLicenses}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-warning-600">{expiringSoon}</p>
              </div>
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Service</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantity</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Unit Cost</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Monthly Total</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Period</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Commitment</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {licenses && licenses.length > 0 ? (
                  licenses.map((license: any) => {
                    const commitmentStatus = getCommitmentStatus(license);
                    const monthlyTotal = Number(license.monthlyUnitCost) * license.qty;

                    return (
                      <tr key={license.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getProviderIcon(license.provider?.name)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{license.service?.name}</p>
                              <p className="text-sm text-gray-500">{license.provider?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900 font-medium">{license.qty}</td>
                        <td className="py-4 px-6 text-gray-900">{formatCurrency(Number(license.monthlyUnitCost))}</td>
                        <td className="py-4 px-6 text-gray-900 font-semibold">{formatCurrency(monthlyTotal)}</td>
                        <td className="py-4 px-6 text-gray-900">
                          {new Date(license.startMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {' '}
                          {license.endMonth 
                            ? new Date(license.endMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Ongoing'
                          }
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={commitmentStatus.variant}>
                            {commitmentStatus.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Tag className="h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium">No license plans found</p>
                        <p className="text-sm">Start by adding your first license plan</p>
                        <Button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add License Plan
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddLicenseModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
