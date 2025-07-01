import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">CostWatch</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A unified dashboard for tracking infrastructure, license, and usage-based service costs.
            Get complete visibility into your technology spending.
          </p>
          <Button
            size="lg"
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle>Cost Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track monthly infrastructure costs, license fees, and usage-based service spending in one place.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-success-600" />
              </div>
              <CardTitle>License Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor license renewals, track quantities, and get alerts for expiring commitments.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-warning-600" />
              </div>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor API consumption, track balances, and receive low-balance alerts for prepaid services.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to take control of your costs?
              </h2>
              <p className="text-gray-600 mb-6">
                Sign in to get started with your cost management dashboard.
              </p>
              <Button
                size="lg"
                className="bg-primary-500 hover:bg-primary-600 text-white"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
