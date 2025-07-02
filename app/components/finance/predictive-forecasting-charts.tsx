
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  BarChart3,
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts';

interface ForecastData {
  id: string;
  type: string;
  period: string;
  targetDate: string;
  predictedValue: number;
  confidence: number;
  scenarios: any[];
  modelVersion: string;
  features: any;
}

export function PredictiveForecastingCharts() {
  const [revenueForecasts, setRevenueForecasts] = useState<ForecastData[]>([]);
  const [cashFlowForecasts, setCashFlowForecasts] = useState<ForecastData[]>([]);
  const [expenseForecasts, setExpenseForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState('6');
  const [selectedForecastPeriod, setSelectedForecastPeriod] = useState('MONTHLY');

  useEffect(() => {
    loadForecastData();
  }, [selectedPeriods, selectedForecastPeriod]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [revenueResponse, cashFlowResponse, expenseResponse] = await Promise.all([
        fetch(`/api/finance/forecasting/revenue?periods=${selectedPeriods}&period=${selectedForecastPeriod}`),
        fetch(`/api/finance/forecasting/cash-flow?periods=${selectedPeriods}`),
        fetch(`/api/finance/forecasting/expenses?periods=${selectedPeriods}`)
      ]);

      if (!revenueResponse.ok || !cashFlowResponse.ok || !expenseResponse.ok) {
        throw new Error('Failed to load forecast data');
      }

      const [revenueData, cashFlowData, expenseData] = await Promise.all([
        revenueResponse.json(),
        cashFlowResponse.json(),
        expenseResponse.json()
      ]);

      setRevenueForecasts(revenueData.data || []);
      setCashFlowForecasts(cashFlowData.data || []);
      setExpenseForecasts(expenseData.data || []);
    } catch (err) {
      console.error('Error loading forecast data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: 'short',
      year: 'numeric'
    });
  };

  const prepareChartData = (forecasts: ForecastData[]) => {
    return forecasts.map(forecast => ({
      date: formatDate(forecast.targetDate),
      predicted: forecast.predictedValue,
      confidence: forecast.confidence * 100,
      optimistic: forecast.scenarios.find(s => s.name === 'Optimistic')?.predictedValue || forecast.predictedValue,
      pessimistic: forecast.scenarios.find(s => s.name === 'Pessimistic')?.predictedValue || forecast.predictedValue
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Generating predictive forecasts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={loadForecastData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Forecasting</h2>
          <p className="text-muted-foreground">AI-powered financial predictions with scenario analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedForecastPeriod} onValueChange={setSelectedForecastPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriods} onValueChange={setSelectedPeriods}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 periods</SelectItem>
              <SelectItem value="6">6 periods</SelectItem>
              <SelectItem value="12">12 periods</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadForecastData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueForecasts[0] ? formatCurrency(revenueForecasts[0].predictedValue) : 'N/A'}
            </div>
            {revenueForecasts[0] && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className={getConfidenceColor(revenueForecasts[0].confidence)}>
                  {getConfidenceBadge(revenueForecasts[0].confidence)} Confidence
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(revenueForecasts[0].confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Period Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashFlowForecasts[0] ? formatCurrency(cashFlowForecasts[0].predictedValue) : 'N/A'}
            </div>
            {cashFlowForecasts[0] && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className={getConfidenceColor(cashFlowForecasts[0].confidence)}>
                  {getConfidenceBadge(cashFlowForecasts[0].confidence)} Confidence
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(cashFlowForecasts[0].confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Period Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenseForecasts[0] ? formatCurrency(expenseForecasts[0].predictedValue) : 'N/A'}
            </div>
            {expenseForecasts[0] && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className={getConfidenceColor(expenseForecasts[0].confidence)}>
                  {getConfidenceBadge(expenseForecasts[0].confidence)} Confidence
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(expenseForecasts[0].confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecast Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Forecast</TabsTrigger>
          <TabsTrigger value="expenses">Expense Forecast</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting with Scenarios</CardTitle>
              <CardDescription>
                Predicted revenue with optimistic and pessimistic scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={prepareChartData(revenueForecasts)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                      name="Optimistic"
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.2}
                      name="Pessimistic"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Most Likely"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecasting</CardTitle>
              <CardDescription>
                Monte Carlo simulation-based cash flow predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareChartData(cashFlowForecasts)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="optimistic"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      name="Optimistic"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Expected"
                    />
                    <Line
                      type="monotone"
                      dataKey="pessimistic"
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      name="Pessimistic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Forecasting</CardTitle>
              <CardDescription>
                Pattern-based expense predictions with trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(expenseForecasts)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="predicted" fill="#f59e0b" name="Predicted Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combined">
          <Card>
            <CardHeader>
              <CardTitle>Combined Financial Forecast</CardTitle>
              <CardDescription>
                Overview of all financial forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareChartData(revenueForecasts).map((item, index) => ({
                    ...item,
                    expenses: expenseForecasts[index]?.predictedValue || 0,
                    cashFlow: cashFlowForecasts[index]?.predictedValue || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="cashFlow"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Cash Flow"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forecast Details */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Details</CardTitle>
          <CardDescription>Detailed breakdown of all predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueForecasts.slice(0, 3).map((forecast, index) => (
              <div key={forecast.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{formatDate(forecast.targetDate)}</p>
                  <p className="text-sm text-muted-foreground">{forecast.type} Forecast</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-semibold">{formatCurrency(forecast.predictedValue)}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getConfidenceColor(forecast.confidence)}>
                      {(forecast.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
