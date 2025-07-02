
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

interface RealtimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
  unit: 'currency' | 'percentage' | 'count';
}

interface MetricHistory {
  timestamp: string;
  value: number;
  name: string;
}

interface LiveAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  metric?: string;
  value?: number;
}

export function RealtimeFinancialMetrics() {
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([]);
  const [metricHistory, setMetricHistory] = useState<MetricHistory[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize metrics
  useEffect(() => {
    initializeMetrics();
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoRefresh && isConnected) {
      interval = setInterval(() => {
        refreshMetrics();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, isConnected]);

  const initializeMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate connection
      setTimeout(() => {
        setIsConnected(true);
        generateInitialMetrics();
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error initializing metrics:', err);
      setError('Failed to initialize real-time metrics');
      setLoading(false);
    }
  };

  const generateInitialMetrics = () => {
    const initialMetrics: RealtimeMetric[] = [
      {
        id: 'cash_balance',
        name: 'Cash Balance',
        value: 125000,
        previousValue: 120000,
        change: 5000,
        changePercent: 4.17,
        trend: 'up',
        timestamp: new Date().toISOString(),
        unit: 'currency'
      },
      {
        id: 'daily_revenue',
        name: 'Daily Revenue',
        value: 8500,
        previousValue: 7800,
        change: 700,
        changePercent: 8.97,
        trend: 'up',
        timestamp: new Date().toISOString(),
        unit: 'currency'
      },
      {
        id: 'outstanding_invoices',
        name: 'Outstanding Invoices',
        value: 45000,
        previousValue: 48000,
        change: -3000,
        changePercent: -6.25,
        trend: 'down',
        timestamp: new Date().toISOString(),
        unit: 'currency'
      },
      {
        id: 'expense_ratio',
        name: 'Expense Ratio',
        value: 0.68,
        previousValue: 0.72,
        change: -0.04,
        changePercent: -5.56,
        trend: 'down',
        timestamp: new Date().toISOString(),
        unit: 'percentage'
      },
      {
        id: 'budget_utilization',
        name: 'Budget Utilization',
        value: 0.75,
        previousValue: 0.73,
        change: 0.02,
        changePercent: 2.74,
        trend: 'up',
        timestamp: new Date().toISOString(),
        unit: 'percentage'
      },
      {
        id: 'transaction_count',
        name: 'Daily Transactions',
        value: 156,
        previousValue: 142,
        change: 14,
        changePercent: 9.86,
        trend: 'up',
        timestamp: new Date().toISOString(),
        unit: 'count'
      }
    ];

    setMetrics(initialMetrics);
    
    // Generate initial history
    const history: MetricHistory[] = [];
    const now = new Date();
    
    initialMetrics.forEach(metric => {
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000).toISOString(); // Every minute for last 24 minutes
        const baseValue = metric.value;
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        history.push({
          timestamp,
          value: baseValue * (1 + variation),
          name: metric.id
        });
      }
    });

    setMetricHistory(history);
    setLastUpdate(new Date());
  };

  const refreshMetrics = useCallback(() => {
    if (!isConnected) return;

    setMetrics(prevMetrics => {
      const updatedMetrics = prevMetrics.map(metric => {
        // Simulate realistic changes
        const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        const newValue = metric.value * (1 + variation);
        const change = newValue - metric.value;
        const changePercent = (change / metric.value) * 100;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercent) > 1) {
          trend = changePercent > 0 ? 'up' : 'down';
        }

        return {
          ...metric,
          previousValue: metric.value,
          value: newValue,
          change,
          changePercent,
          trend,
          timestamp: new Date().toISOString()
        };
      });

      // Add to history
      const newHistoryEntries: MetricHistory[] = updatedMetrics.map(metric => ({
        timestamp: metric.timestamp,
        value: metric.value,
        name: metric.id
      }));

      setMetricHistory(prev => [...prev, ...newHistoryEntries].slice(-1440)); // Keep last 24 hours

      // Generate alerts for significant changes
      const newAlerts: LiveAlert[] = [];
      updatedMetrics.forEach(metric => {
        if (Math.abs(metric.changePercent) > 10) {
          newAlerts.push({
            id: `${metric.id}_${Date.now()}`,
            type: metric.trend === 'up' ? 'info' : 'warning',
            message: `${metric.name} ${metric.trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(metric.changePercent).toFixed(1)}%`,
            timestamp: new Date().toISOString(),
            metric: metric.name,
            value: metric.value
          });
        }
      });

      if (newAlerts.length > 0) {
        setLiveAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep latest 10 alerts
      }

      return updatedMetrics;
    });

    setLastUpdate(new Date());
  }, [isConnected]);

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'count':
        return value.toFixed(0);
      default:
        return value.toString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Zap className="h-4 w-4 text-blue-600" />;
    }
  };

  const prepareChartData = (metricId: string) => {
    return metricHistory
      .filter(item => item.name === metricId)
      .slice(-20) // Last 20 data points
      .map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('de-DE', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        value: item.value
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Connecting to real-time data stream...</span>
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
          <Button variant="outline" size="sm" onClick={initializeMetrics} className="ml-2">
            Retry Connection
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-time Financial Metrics</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span>Connected - Live Data</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span>Disconnected</span>
              </>
            )}
            {lastUpdate && (
              <span>• Last update: {lastUpdate.toLocaleTimeString('de-DE')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isAutoRefresh}
              onCheckedChange={setIsAutoRefresh}
              disabled={!isConnected}
            />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshMetrics}
            disabled={!isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className="flex items-center space-x-1">
                {getTrendIcon(metric.trend)}
                <Activity className="h-3 w-3 text-muted-foreground animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatValue(metric.value, metric.unit)}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-medium ${getChangeColor(metric.change)}`}>
                    {metric.change > 0 ? '+' : ''}{formatValue(Math.abs(metric.change), metric.unit)}
                  </div>
                  <div className={`text-xs ${getChangeColor(metric.changePercent)}`}>
                    ({metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(metric.timestamp).toLocaleTimeString('de-DE')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Balance Trend</CardTitle>
            <CardDescription>Real-time cash position over the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prepareChartData('cash_balance')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis tickFormatter={(value) => formatValue(value, 'currency')} />
                  <Tooltip formatter={(value) => formatValue(Number(value), 'currency')} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Tracking</CardTitle>
            <CardDescription>Revenue accumulation throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData('daily_revenue')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis tickFormatter={(value) => formatValue(value, 'currency')} />
                  <Tooltip formatter={(value) => formatValue(Number(value), 'currency')} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Alerts */}
      {liveAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Live Alerts</span>
            </CardTitle>
            <CardDescription>Real-time financial alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString('de-DE')}
                      </span>
                      {alert.metric && (
                        <Badge variant="outline" className="text-xs">
                          {alert.metric}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time monitoring system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Data Stream</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">API Connection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAutoRefresh ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Auto-refresh</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Latency: ~{Math.floor(Math.random() * 100 + 50)}ms
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
