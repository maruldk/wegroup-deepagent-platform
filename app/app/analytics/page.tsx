
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIEnhancedAnalytics } from '@/components/ai/ai-enhanced-analytics';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Euro, 
  Target,
  Activity,
  Plus,
  Filter,
  Download,
  AlertCircle,
  Loader2,
  Brain,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Dashboard, Metric } from '@/lib/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface KPIData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color?: string;
  bgColor?: string;
}

export default function AnalyticsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000, expenses: 8000 },
    { month: 'Feb', revenue: 15000, expenses: 9000 },
    { month: 'Mar', revenue: 18000, expenses: 11000 },
    { month: 'Apr', revenue: 22000, expenses: 13000 },
    { month: 'Mai', revenue: 28000, expenses: 15000 },
    { month: 'Jun', revenue: 32000, expenses: 18000 },
  ];

  const leadData = [
    { status: 'Neu', count: 25, fill: COLORS[0] },
    { status: 'Qualifiziert', count: 18, fill: COLORS[1] },
    { status: 'Angebot', count: 12, fill: COLORS[2] },
    { status: 'Gewonnen', count: 8, fill: COLORS[3] },
  ];

  const projectData = [
    { name: 'Aktiv', value: 12, fill: COLORS[0] },
    { name: 'Geplant', value: 5, fill: COLORS[1] },
    { name: 'Abgeschlossen', value: 23, fill: COLORS[2] },
    { name: 'Pausiert', value: 3, fill: COLORS[3] },
  ];

  // Optimized data fetching with error handling and retry logic
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardsRes, metricsRes] = await Promise.all([
        fetch('/api/analytics/dashboards'),
        fetch('/api/analytics/metrics')
      ]);

      // Handle dashboards response
      if (dashboardsRes.ok) {
        const data = await dashboardsRes.json();
        setDashboards(data.dashboards || []);
      } else if (dashboardsRes.status !== 401) {
        console.warn('Failed to fetch dashboards:', dashboardsRes.status);
      }

      // Handle metrics response
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || []);
      } else if (metricsRes.status !== 401) {
        console.warn('Failed to fetch metrics:', metricsRes.status);
      }

      // If both requests failed, show error
      if (!dashboardsRes.ok && !metricsRes.ok && dashboardsRes.status !== 401) {
        throw new Error('Fehler beim Laden der Analytics-Daten');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der Daten';
      setError(errorMessage);
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry function with exponential backoff
  const retryFetch = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(fetchData, Math.pow(2, retryCount) * 1000);
    }
  }, [fetchData, retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized KPI cards for performance optimization
  const kpiCards: KPIData[] = useMemo(() => [
    {
      title: 'Gesamtumsatz',
      value: '€127,000',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Euro,
    },
    {
      title: 'Neue Kunden',
      value: '23',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Target,
    },
    {
      title: 'Projektfortschritt',
      value: '78%',
      change: '+5.3%',
      changeType: 'positive' as const,
      icon: Activity,
    },
  ], []);

  // Memoized chart data for performance
  const chartData = useMemo(() => ({
    revenue: revenueData,
    leads: leadData,
    projects: projectData,
  }), [revenueData, leadData, projectData]);

  // Loading Component with Skeleton
  const LoadingState = () => (
    <div className="max-w-7xl mx-auto p-6 space-y-8" role="status" aria-label="Loading analytics data">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );

  // Error Component with Retry
  const ErrorState = () => (
    <div className="max-w-7xl mx-auto p-6">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={retryFetch}
            disabled={loading}
            className="ml-4"
            aria-label="Retry loading data"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Wiederholen'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );

  if (loading && dashboards.length === 0 && metrics.length === 0) {
    return <LoadingState />;
  }

  if (error && dashboards.length === 0 && metrics.length === 0) {
    return <ErrorState />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Übersicht über wichtige Geschäftskennzahlen und Performance-Indikatoren
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Neues Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="standard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Standard Analytics
          </TabsTrigger>
          <TabsTrigger value="ai-enhanced" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            KI-Enhanced Analytics
            <Badge variant="secondary" className="ml-1">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">{kpi.change}</span>
                        <span className="text-sm text-gray-500 ml-1">vs. letzter Monat</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                      <Icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Umsatz & Ausgaben Entwicklung
              </CardTitle>
              <CardDescription>
                Monatliche Entwicklung der wichtigsten Finanzmetriken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, '']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke={COLORS[0]} 
                    fill={COLORS[0]}
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2" 
                    stroke={COLORS[3]} 
                    fill={COLORS[3]}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lead Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Pipeline
              </CardTitle>
              <CardDescription>
                Verteilung der Leads nach Status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Anzahl']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Projekt Status
              </CardTitle>
              <CardDescription>
                Übersicht über alle Projekte nach Status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={projectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {projectData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Wichtige Kennzahlen</CardTitle>
              <CardDescription>
                Aktuelle Performance-Indikatoren im Überblick
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.length > 0 ? (
                metrics.slice(0, 4).map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{metric.name}</p>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {metric.currentValue}
                        {metric.name.includes('Rate') ? '%' : ''}
                      </p>
                      {metric.target && (
                        <p className="text-xs text-gray-500">
                          Ziel: {metric.target}
                          {metric.name.includes('Rate') ? '%' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Metriken verfügbar</p>
                  <p className="text-sm">Erstellen Sie Ihre ersten KPI-Metriken</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Dashboards */}
      {dashboards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Meine Dashboards</CardTitle>
              <CardDescription>
                Zuletzt verwendete und erstellte Dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.slice(0, 6).map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{dashboard.name}</h3>
                        <p className="text-sm text-gray-600">{dashboard.description}</p>
                        {dashboard.isDefault && (
                          <Badge variant="secondary" className="mt-1">
                            Standard
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
        </TabsContent>

        <TabsContent value="ai-enhanced" className="space-y-6">
          <AIEnhancedAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
