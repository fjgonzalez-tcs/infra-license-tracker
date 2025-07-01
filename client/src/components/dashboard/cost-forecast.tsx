import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ForecastData {
  month: string;
  projected: number;
  confidence: 'high' | 'medium' | 'low';
}

interface CostForecast {
  nextMonthProjection: number;
  quarterProjection: number;
  yearProjection: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  forecasts: ForecastData[];
  budgetAlert?: {
    message: string;
    severity: 'warning' | 'critical';
  };
}

export default function CostForecast() {
  const { data: forecast, isLoading } = useQuery<CostForecast>({
    queryKey: ['/api/cost-forecast'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Forecast</CardTitle>
          <CardDescription>AI-powered spending predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Forecast</CardTitle>
          <CardDescription>AI-powered spending predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No forecast data available. Add more historical data for predictions.</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cost Forecast
          {getTrendIcon()}
        </CardTitle>
        <CardDescription>AI-powered spending predictions based on historical trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Alert */}
        {forecast.budgetAlert && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            forecast.budgetAlert.severity === 'critical' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              forecast.budgetAlert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <span className="text-sm font-medium">{forecast.budgetAlert.message}</span>
          </div>
        )}

        {/* Trend Summary */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Trend</p>
            <p className={`text-lg font-semibold capitalize ${getTrendColor()}`}>
              {forecast.trend} {Math.abs(forecast.trendPercentage)}%
            </p>
          </div>
        </div>

        {/* Forecast Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Next Month</p>
            <p className="text-2xl font-bold text-blue-700">
              ${forecast.nextMonthProjection.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">This Quarter</p>
            <p className="text-2xl font-bold text-purple-700">
              ${forecast.quarterProjection.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-600 font-medium">This Year</p>
            <p className="text-2xl font-bold text-indigo-700">
              ${forecast.yearProjection.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">6-Month Projection</h4>
          <div className="space-y-2">
            {forecast.forecasts.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.confidence} confidence
                  </span>
                </div>
                <span className="font-semibold">${item.projected.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology Note */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>Forecast based on 12-month historical data, seasonal patterns, and current growth trends. 
          Accuracy improves with more data points.</p>
        </div>
      </CardContent>
    </Card>
  );
}