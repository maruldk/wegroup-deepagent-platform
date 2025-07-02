
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  BarChart3, 
  Target,
  Brain,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { PredictiveForecastingCharts } from './predictive-forecasting-charts';
import { RiskAnalysisDashboard } from './risk-analysis-dashboard';
import { AIInsightsPanel } from './ai-insights-panel';
import { FinancialScenarioComparison } from './financial-scenario-comparison';
import { RealtimeFinancialMetrics } from './real-time-financial-metrics';

interface DashboardData {
  period: number;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    cashFlow: number;
    outstandingInvoices: number;
    budgetUtilization: number;
  };
  forecasts?: {
    revenue: any[];
    cashFlow: any[];
  };
  risks?: {
    total: number;
    critical: number;
    high: number;
    items: any[];
  };
  insights?: {
    total: number;
    urgent: number;
    critical: number;
    items: any[];
  };
  trends: {
    expenses: any;
    budgets: any[];
  };
  generatedAt: string;
}

export function AdvancedFinancialDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/finance/advanced-analytics/dashboard?period=${selectedPeriod}&forecasts=true&risks=true&insights=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading advanced financial analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Financial Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights, forecasting, and risk analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.summary.totalRevenue)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {dashboardData.summary.netProfit > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span>Profit Margin: {formatPercentage(dashboardData.summary.profitMargin)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.summary.cashFlow)}</div>
            <div className="text-xs text-muted-foreground">
              Outstanding: {formatCurrency(dashboardData.summary.outstandingInvoices)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(dashboardData.summary.budgetUtilization)}</div>
            <Progress value={dashboardData.summary.budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{dashboardData.risks?.total || 0}</div>
              <div className="text-sm">risks</div>
            </div>
            <div className="flex space-x-1 mt-2">
              {(dashboardData.risks?.critical || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {dashboardData.risks?.critical} Critical
                </Badge>
              )}
              {(dashboardData.risks?.high || 0) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {dashboardData.risks?.high} High
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Financial Performance</span>
                </CardTitle>
                <CardDescription>Revenue vs Expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {/* This would be a chart component showing revenue vs expenses */}
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue vs Expenses Chart</p>
                      <p className="text-sm">Implementation with Recharts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Insights Summary</span>
                </CardTitle>
                <CardDescription>Latest financial insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.insights?.items?.slice(0, 3).map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {insight.priority === 'CRITICAL' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : insight.priority === 'HIGH' ? (
                          <Zap className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Brain className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <Badge 
                            variant={
                              insight.priority === 'CRITICAL' ? 'destructive' :
                              insight.priority === 'HIGH' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No insights available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
              <CardDescription>Current budget utilization across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.trends.budgets?.slice(0, 4).map((budget, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{budget.budgetName}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                      </span>
                    </div>
                    <Progress 
                      value={budget.utilizationPercentage} 
                      className={`h-2 ${
                        budget.status === 'OVER_BUDGET' ? 'bg-red-100' :
                        budget.status === 'NEAR_LIMIT' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatPercentage(budget.utilizationPercentage)} used</span>
                      <Badge variant={
                        budget.status === 'OVER_BUDGET' ? 'destructive' :
                        budget.status === 'NEAR_LIMIT' ? 'secondary' : 'default'
                      }>
                        {budget.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No budget data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting">
          <PredictiveForecastingCharts />
        </TabsContent>

        <TabsContent value="risks">
          <RiskAnalysisDashboard />
        </TabsContent>

        <TabsContent value="insights">
          <AIInsightsPanel />
        </TabsContent>

        <TabsContent value="scenarios">
          <FinancialScenarioComparison />
        </TabsContent>

        <TabsContent value="realtime">
          <RealtimeFinancialMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
