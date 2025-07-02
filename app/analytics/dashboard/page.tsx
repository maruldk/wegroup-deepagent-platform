
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { AIDashboardWidget } from '@/components/ai/ai-dashboard-widget';
import { AIInsightsPanel } from '@/components/ai/ai-insights-panel';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalCustomers: number;
    customerGrowth: number;
    activeDeals: number;
    dealsGrowth: number;
    conversionRate: number;
    conversionGrowth: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    prediction: number;
    target: number;
  }>;
  customerData: Array<{
    month: string;
    new: number;
    retained: number;
    churned: number;
  }>;
  dealsData: Array<{
    stage: string;
    count: number;
    value: number;
    color: string;
  }>;
  performanceData: Array<{
    metric: string;
    current: number;
    target: number;
    change: number;
  }>;
}

export default function AnalyticsDashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('12m');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      overview: {
        totalRevenue: 2840000,
        revenueGrowth: 18.5,
        totalCustomers: 1247,
        customerGrowth: 12.3,
        activeDeals: 89,
        dealsGrowth: -3.2,
        conversionRate: 23.8,
        conversionGrowth: 5.7
      },
      revenueData: [
        { month: 'Jan', revenue: 180000, prediction: 185000, target: 175000 },
        { month: 'Feb', revenue: 195000, prediction: 200000, target: 190000 },
        { month: 'Mär', revenue: 220000, prediction: 225000, target: 210000 },
        { month: 'Apr', revenue: 210000, prediction: 235000, target: 220000 },
        { month: 'Mai', revenue: 245000, prediction: 250000, target: 240000 },
        { month: 'Jun', revenue: 268000, prediction: 275000, target: 260000 },
        { month: 'Jul', revenue: 285000, prediction: 290000, target: 280000 },
        { month: 'Aug', revenue: 310000, prediction: 315000, target: 300000 },
        { month: 'Sep', revenue: 295000, prediction: 325000, target: 310000 },
        { month: 'Okt', revenue: 330000, prediction: 340000, target: 325000 },
        { month: 'Nov', revenue: 345000, prediction: 355000, target: 340000 },
        { month: 'Dez', revenue: 0, prediction: 370000, target: 360000 }
      ],
      customerData: [
        { month: 'Jan', new: 45, retained: 234, churned: 12 },
        { month: 'Feb', new: 52, retained: 267, churned: 15 },
        { month: 'Mär', new: 67, retained: 301, churned: 18 },
        { month: 'Apr', new: 58, retained: 325, churned: 22 },
        { month: 'Mai', new: 73, retained: 356, churned: 19 },
        { month: 'Jun', new: 81, retained: 398, churned: 24 },
        { month: 'Jul', new: 89, retained: 445, churned: 27 },
        { month: 'Aug', new: 94, retained: 489, churned: 31 },
        { month: 'Sep', new: 87, retained: 523, churned: 28 },
        { month: 'Okt', new: 102, retained: 578, churned: 35 },
        { month: 'Nov', new: 118, retained: 634, churned: 29 },
        { month: 'Dez', new: 95, retained: 687, churned: 32 }
      ],
      dealsData: [
        { stage: 'Lead', count: 156, value: 890000, color: '#3b82f6' },
        { stage: 'Qualified', count: 89, value: 1240000, color: '#10b981' },
        { stage: 'Proposal', count: 45, value: 980000, color: '#f59e0b' },
        { stage: 'Negotiation', count: 23, value: 750000, color: '#ef4444' },
        { stage: 'Closed Won', count: 12, value: 450000, color: '#8b5cf6' }
      ],
      performanceData: [
        { metric: 'Lead Conversion Rate', current: 23.8, target: 25.0, change: 5.7 },
        { metric: 'Average Deal Size', current: 18500, target: 20000, change: -2.3 },
        { metric: 'Sales Cycle (Tage)', current: 45, target: 40, change: 8.1 },
        { metric: 'Customer Satisfaction', current: 4.2, target: 4.5, change: 12.5 },
        { metric: 'Monthly Churn Rate', current: 2.8, target: 2.0, change: -15.2 },
        { metric: 'Revenue per Customer', current: 2280, target: 2500, change: 3.4 }
      ]
    };
  };

  const refreshData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalyticsData(generateMockAnalyticsData());
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Erweiterte Business Intelligence mit KI-Insights</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-5 bg-muted rounded animate-pulse" />
                  <div className="h-64 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Erweiterte Business Intelligence mit KI-gestützten Insights und Prognosen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Letztes Update: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
              <p className={`text-xs flex items-center gap-1 ${getChangeColor(analyticsData.overview.revenueGrowth)}`}>
                {getChangeIcon(analyticsData.overview.revenueGrowth)}
                {analyticsData.overview.revenueGrowth > 0 ? '+' : ''}{analyticsData.overview.revenueGrowth}% vs. Vormonat
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunden</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalCustomers)}</div>
              <p className={`text-xs flex items-center gap-1 ${getChangeColor(analyticsData.overview.customerGrowth)}`}>
                {getChangeIcon(analyticsData.overview.customerGrowth)}
                {analyticsData.overview.customerGrowth > 0 ? '+' : ''}{analyticsData.overview.customerGrowth}% Wachstum
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Deals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.activeDeals}</div>
              <p className={`text-xs flex items-center gap-1 ${getChangeColor(analyticsData.overview.dealsGrowth)}`}>
                {getChangeIcon(analyticsData.overview.dealsGrowth)}
                {analyticsData.overview.dealsGrowth > 0 ? '+' : ''}{analyticsData.overview.dealsGrowth}% vs. Vormonat
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
              <p className={`text-xs flex items-center gap-1 ${getChangeColor(analyticsData.overview.conversionGrowth)}`}>
                {getChangeIcon(analyticsData.overview.conversionGrowth)}
                {analyticsData.overview.conversionGrowth > 0 ? '+' : ''}{analyticsData.overview.conversionGrowth}% Verbesserung
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Umsatz</TabsTrigger>
          <TabsTrigger value="customers">Kunden</TabsTrigger>
          <TabsTrigger value="sales">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">KI-Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Umsatzentwicklung & KI-Prognose
                </CardTitle>
                <CardDescription>
                  Aktuelle Umsätze mit KI-basierten Vorhersagen für die kommenden Monate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.revenueData}>
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        tickFormatter={(value) => `€${value / 1000}K`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelStyle={{ fontSize: 11 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Ist-Umsatz"
                      />
                      <Area
                        type="monotone"
                        dataKey="prediction"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        strokeDasharray="5 5"
                        name="KI-Prognose"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stackId="3"
                        stroke="#f59e0b"
                        fill="transparent"
                        strokeDasharray="3 3"
                        name="Ziel"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <AIDashboardWidget 
              title="Umsatz-Insights" 
              category="sales"
              compact={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Kunden-Entwicklung
                </CardTitle>
                <CardDescription>
                  Neue Kunden, Retention und Churn-Analyse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.customerData}>
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <Tooltip 
                        labelStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="new" fill="#3b82f6" name="Neue Kunden" />
                      <Bar dataKey="retained" fill="#10b981" name="Bestandskunden" />
                      <Bar dataKey="churned" fill="#ef4444" name="Abgewanderte" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Churn-Risiko Analyse
                </CardTitle>
                <CardDescription>
                  KI-basierte Churn-Prognose und Handlungsempfehlungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hohes Risiko</span>
                    <Badge variant="destructive">23 Kunden</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mittleres Risiko</span>
                    <Badge variant="secondary">67 Kunden</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Niedriges Risiko</span>
                    <Badge variant="outline">1,157 Kunden</Badge>
                  </div>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button className="w-full" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Retention-Kampagne starten
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    KI-Analyse anzeigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Sales Pipeline
                </CardTitle>
                <CardDescription>
                  Aktuelle Verteilung der Deals nach Pipeline-Stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.dealsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.dealsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Wert']}
                        labelStyle={{ fontSize: 11 }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Pipeline Details
                </CardTitle>
                <CardDescription>
                  Anzahl und Wert der Deals pro Stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.dealsData.map((stage, index) => (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{stage.count} Deals</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(stage.value)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Performance Metriken
              </CardTitle>
              <CardDescription>
                Wichtige KPIs mit Ist-Werten, Zielen und Entwicklung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyticsData.performanceData.map((metric, index) => (
                  <motion.div
                    key={metric.metric}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">{metric.metric}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                              {metric.metric.includes('€') || metric.metric.includes('Revenue') ? 
                                formatCurrency(metric.current) : 
                                metric.metric.includes('Rate') || metric.metric.includes('Satisfaction') ?
                                  `${metric.current}${metric.metric.includes('Satisfaction') ? '/5' : '%'}` :
                                  formatNumber(metric.current)
                              }
                            </span>
                            <Badge variant={metric.change >= 0 ? 'default' : 'destructive'} className="text-xs">
                              {metric.change >= 0 ? '+' : ''}{metric.change}%
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ziel: {metric.metric.includes('€') || metric.metric.includes('Revenue') ? 
                              formatCurrency(metric.target) : 
                              metric.metric.includes('Rate') || metric.metric.includes('Satisfaction') ?
                                `${metric.target}${metric.metric.includes('Satisfaction') ? '/5' : '%'}` :
                                formatNumber(metric.target)
                            }
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min((metric.current / metric.target) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <AIInsightsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
