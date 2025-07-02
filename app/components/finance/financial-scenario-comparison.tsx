
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts';

interface FinancialScenario {
  name: string;
  description: string;
  probability: number;
  predictedValue: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  assumptions: Record<string, any>;
}

interface ScenarioForecast {
  id: string;
  type: string;
  targetDate: string;
  scenarios: FinancialScenario[];
  baselinePrediction: number;
  confidence: number;
}

interface ScenarioComparison {
  period: string;
  baseline: number;
  optimistic: number;
  pessimistic: number;
  mostLikely: number;
  variance: number;
}

export function FinancialScenarioComparison() {
  const [scenarios, setScenarios] = useState<ScenarioForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForecastType, setSelectedForecastType] = useState('REVENUE');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6');

  useEffect(() => {
    loadScenarioData();
  }, [selectedForecastType, selectedTimeframe]);

  const loadScenarioData = async () => {
    try {
      setLoading(true);
      setError(null);

      let apiEndpoint = '';
      switch (selectedForecastType) {
        case 'REVENUE':
          apiEndpoint = `/api/finance/forecasting/revenue?periods=${selectedTimeframe}`;
          break;
        case 'CASH_FLOW':
          apiEndpoint = `/api/finance/forecasting/cash-flow?periods=${selectedTimeframe}`;
          break;
        case 'EXPENSE':
          apiEndpoint = `/api/finance/forecasting/expenses?periods=${selectedTimeframe}`;
          break;
        default:
          apiEndpoint = `/api/finance/forecasting/revenue?periods=${selectedTimeframe}`;
      }

      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load scenario data');
      }

      const result = await response.json();
      setScenarios(result.data || []);
    } catch (err) {
      console.error('Error loading scenario data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const prepareComparisonData = (): ScenarioComparison[] => {
    return scenarios.map(forecast => {
      const optimisticScenario = forecast.scenarios.find(s => s.name === 'Optimistic');
      const pessimisticScenario = forecast.scenarios.find(s => s.name === 'Pessimistic');
      const mostLikelyScenario = forecast.scenarios.find(s => s.name === 'Most Likely');

      const optimistic = optimisticScenario?.predictedValue || forecast.baselinePrediction * 1.15;
      const pessimistic = pessimisticScenario?.predictedValue || forecast.baselinePrediction * 0.85;
      const mostLikely = mostLikelyScenario?.predictedValue || forecast.baselinePrediction;

      return {
        period: formatDate(forecast.targetDate),
        baseline: forecast.baselinePrediction,
        optimistic,
        pessimistic,
        mostLikely,
        variance: optimistic - pessimistic
      };
    });
  };

  const getScenarioSummary = () => {
    if (scenarios.length === 0) return null;

    const comparisonData = prepareComparisonData();
    const totalOptimistic = comparisonData.reduce((sum, item) => sum + item.optimistic, 0);
    const totalPessimistic = comparisonData.reduce((sum, item) => sum + item.pessimistic, 0);
    const totalMostLikely = comparisonData.reduce((sum, item) => sum + item.mostLikely, 0);
    const averageVariance = comparisonData.reduce((sum, item) => sum + item.variance, 0) / comparisonData.length;

    return {
      totalOptimistic,
      totalPessimistic,
      totalMostLikely,
      averageVariance,
      riskRange: totalOptimistic - totalPessimistic
    };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'POSITIVE': return 'text-green-600';
      case 'NEGATIVE': return 'text-red-600';
      case 'MIXED': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'POSITIVE': return 'default';
      case 'NEGATIVE': return 'destructive';
      case 'MIXED': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading scenario analysis...</span>
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
          <Button variant="outline" size="sm" onClick={loadScenarioData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const summary = getScenarioSummary();
  const comparisonData = prepareComparisonData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Scenario Analysis</h2>
          <p className="text-muted-foreground">Compare different financial scenarios and their potential outcomes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedForecastType} onValueChange={setSelectedForecastType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REVENUE">Revenue</SelectItem>
              <SelectItem value="CASH_FLOW">Cash Flow</SelectItem>
              <SelectItem value="EXPENSE">Expenses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadScenarioData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimistic Scenario</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalOptimistic)}
              </div>
              <p className="text-xs text-muted-foreground">
                Best case outcome
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Likely</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalMostLikely)}
              </div>
              <p className="text-xs text-muted-foreground">
                Expected outcome
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pessimistic Scenario</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalPessimistic)}
              </div>
              <p className="text-xs text-muted-foreground">
                Worst case outcome
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Range</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.riskRange)}
              </div>
              <p className="text-xs text-muted-foreground">
                Potential variance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Scenario Comparison</TabsTrigger>
          <TabsTrigger value="details">Scenario Details</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          {/* Scenario Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison Over Time</CardTitle>
              <CardDescription>
                Visual comparison of optimistic, most likely, and pessimistic scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    
                    {/* Area for uncertainty range */}
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                      name="Optimistic Range"
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      name="Pessimistic Range"
                    />
                    
                    {/* Lines for specific scenarios */}
                    <Line
                      type="monotone"
                      dataKey="optimistic"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Optimistic"
                    />
                    <Line
                      type="monotone"
                      dataKey="mostLikely"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Most Likely"
                    />
                    <Line
                      type="monotone"
                      dataKey="pessimistic"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Pessimistic"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Variance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Variance Analysis</CardTitle>
              <CardDescription>
                Risk analysis showing potential variance between scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="variance" fill="#f59e0b" name="Scenario Variance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            {scenarios.map((forecast, index) => (
              <Card key={forecast.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <GitBranch className="h-5 w-5" />
                      <span>{formatDate(forecast.targetDate)} - {forecast.type} Scenarios</span>
                    </CardTitle>
                    <Badge variant="outline">
                      {formatPercentage(forecast.confidence)} confidence
                    </Badge>
                  </div>
                  <CardDescription>
                    Baseline prediction: {formatCurrency(forecast.baselinePrediction)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {forecast.scenarios.map((scenario, scenarioIndex) => (
                      <div key={scenarioIndex} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{scenario.name}</h4>
                          <Badge variant={getImpactBadge(scenario.impact)}>
                            {scenario.impact}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Predicted Value:</span>
                            <div className={`text-lg font-semibold ${getImpactColor(scenario.impact)}`}>
                              {formatCurrency(scenario.predictedValue)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm text-muted-foreground">Probability:</span>
                            <div className="text-lg font-semibold">
                              {formatPercentage(scenario.probability)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm text-muted-foreground">Description:</span>
                            <p className="text-sm mt-1">{scenario.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assumptions">
          <div className="space-y-4">
            {scenarios.map((forecast, index) => (
              <Card key={forecast.id}>
                <CardHeader>
                  <CardTitle>{formatDate(forecast.targetDate)} - Scenario Assumptions</CardTitle>
                  <CardDescription>
                    Key assumptions driving each scenario outcome
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecast.scenarios.map((scenario, scenarioIndex) => (
                      <div key={scenarioIndex} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{scenario.name} Scenario</h4>
                          <Badge variant={getImpactBadge(scenario.impact)}>
                            {scenario.impact}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                          {Object.entries(scenario.assumptions).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-muted-foreground font-medium">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                              </span>
                              <span className="ml-2">
                                {typeof value === 'number' ? 
                                  (key.toLowerCase().includes('rate') || key.toLowerCase().includes('growth') ? 
                                    formatPercentage(value) : value.toLocaleString()) :
                                  value.toString()
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
              <CardDescription>
                Impact of key variables on scenario outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sensitivity Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.map(item => ({
                      period: item.period,
                      upside: item.optimistic - item.mostLikely,
                      downside: item.mostLikely - item.pessimistic
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="upside" fill="#10b981" name="Upside Potential" />
                      <Bar dataKey="downside" fill="#ef4444" name="Downside Risk" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Key Sensitivity Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">High Impact Factors</h4>
                    <div className="space-y-2">
                      {[
                        { factor: 'Market Growth Rate', impact: 'High', direction: 'Positive' },
                        { factor: 'Customer Retention', impact: 'High', direction: 'Positive' },
                        { factor: 'Economic Conditions', impact: 'Medium', direction: 'Mixed' },
                        { factor: 'Competition', impact: 'Medium', direction: 'Negative' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{item.factor}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{item.impact}</Badge>
                            <Badge variant={
                              item.direction === 'Positive' ? 'default' :
                              item.direction === 'Negative' ? 'destructive' : 'secondary'
                            }>
                              {item.direction}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Risk Mitigation</h4>
                    <div className="space-y-2 text-sm">
                      <p>• Diversify revenue streams to reduce market dependency</p>
                      <p>• Maintain flexible cost structure for downside protection</p>
                      <p>• Monitor key leading indicators for early warning</p>
                      <p>• Prepare contingency plans for worst-case scenarios</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Planning Actions</CardTitle>
          <CardDescription>Take action based on scenario analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Detailed Analysis
            </Button>
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set Targets
            </Button>
            <Button variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Create Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
