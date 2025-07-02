
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart, 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Euro,
  FileText,
  Calculator,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  BarChart, 
  Bar,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';
import { DatevExport } from '@/lib/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ExpenseCategoryData {
  name: string;
  value: number;
  fill: string;
}

export default function FinanceReportsPage() {
  const [datevExports, setDatevExports] = useState<DatevExport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Mock data for financial reports
  const expensesByCategory = [
    { name: 'Personal', value: 45000, fill: COLORS[0] },
    { name: 'Marketing', value: 15000, fill: COLORS[1] },
    { name: 'Infrastruktur', value: 12000, fill: COLORS[2] },
    { name: 'Software', value: 8000, fill: COLORS[3] },
    { name: 'Büro', value: 5000, fill: COLORS[4] },
  ];

  const monthlyProfitLoss = [
    { month: 'Jan', revenue: 45000, expenses: 35000, profit: 10000 },
    { month: 'Feb', revenue: 52000, expenses: 38000, profit: 14000 },
    { month: 'Mar', revenue: 48000, expenses: 40000, profit: 8000 },
    { month: 'Apr', revenue: 61000, expenses: 42000, profit: 19000 },
    { month: 'Mai', revenue: 55000, expenses: 39000, profit: 16000 },
    { month: 'Jun', revenue: 67000, expenses: 45000, profit: 22000 },
  ];

  const cashFlowData = [
    { month: 'Jan', operating: 15000, investing: -5000, financing: 10000 },
    { month: 'Feb', operating: 18000, investing: -2000, financing: 0 },
    { month: 'Mar', operating: 12000, investing: -8000, financing: 15000 },
    { month: 'Apr', operating: 22000, investing: -3000, financing: 0 },
    { month: 'Mai', operating: 25000, investing: -10000, financing: 5000 },
    { month: 'Jun', operating: 28000, investing: -4000, financing: 0 },
  ];

  // Optimized data fetching with error handling and retry logic
  const fetchDatevExports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/finance/datev-export');
      
      if (response.ok) {
        const data = await response.json();
        setDatevExports(data.exports || []);
      } else if (response.status !== 401) {
        throw new Error(`Fehler beim Laden der DATEV-Exporte: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der DATEV-Exporte';
      setError(errorMessage);
      console.error('Error fetching DATEV exports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry function with exponential backoff
  const retryFetch = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(fetchDatevExports, Math.pow(2, retryCount) * 1000);
    }
  }, [fetchDatevExports, retryCount]);

  useEffect(() => {
    fetchDatevExports();
  }, [fetchDatevExports]);

  // Memoized chart data for performance optimization
  const chartData = useMemo(() => ({
    expenses: expensesByCategory,
    profitLoss: monthlyProfitLoss,
    cashFlow: cashFlowData,
  }), [expensesByCategory, monthlyProfitLoss, cashFlowData]);

  // Memoized KPI calculations
  const kpiMetrics = useMemo(() => [
    {
      title: 'Gesamtumsatz',
      value: formatCurrency(monthlyProfitLoss.reduce((sum: number, item: ChartDataPoint) => sum + item.revenue, 0)),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Euro,
    },
    {
      title: 'Gesamtausgaben',
      value: formatCurrency(monthlyProfitLoss.reduce((sum: number, item: ChartDataPoint) => sum + item.expenses, 0)),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Calculator,
    },
    {
      title: 'Nettogewinn',
      value: formatCurrency(monthlyProfitLoss.reduce((sum: number, item: ChartDataPoint) => sum + item.profit, 0)),
      change: '+18.7%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'DATEV Exporte',
      value: datevExports.length.toString(),
      change: '+3',
      changeType: 'positive' as const,
      icon: FileText,
    },
  ], [monthlyProfitLoss, datevExports.length]);

  // Loading Component with Skeleton
  const LoadingState = () => (
    <div className="max-w-7xl mx-auto p-6 space-y-8" role="status" aria-label="Loading finance reports">
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
        {Array.from({ length: 3 }).map((_, i) => (
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

  if (loading && datevExports.length === 0) {
    return <LoadingState />;
  }

  if (error && datevExports.length === 0) {
    return <ErrorState />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const staticKpiData = [
    {
      title: 'Bruttogewinn',
      value: formatCurrency(89000),
      change: '+15.3%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Betriebskosten',
      value: formatCurrency(67000),
      change: '+8.7%',
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Nettogewinn',
      value: formatCurrency(22000),
      change: '+28.5%',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Liquidität',
      value: formatCurrency(125000),
      change: '+5.2%',
      icon: Euro,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Finanzberichte</h1>
          <p className="text-gray-600 mt-2">
            Detaillierte Analysen und Berichte zu Ihrer Finanzlage
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            DATEV Export
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Neuer Bericht
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {staticKpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">{kpi.change}</span>
                        <span className="text-sm text-gray-500 ml-1">vs. Vormonat</span>
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
        {/* Profit & Loss Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gewinn & Verlust
              </CardTitle>
              <CardDescription>
                Monatliche Übersicht über Umsatz, Kosten und Gewinn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyProfitLoss}>
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
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Umsatz"
                    fill={COLORS[1]} 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="expenses" 
                    name="Ausgaben"
                    fill={COLORS[3]} 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="profit" 
                    name="Gewinn"
                    fill={COLORS[0]} 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Ausgaben nach Kategorie
              </CardTitle>
              <CardDescription>
                Verteilung der Ausgaben im aktuellen Monat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {expensesByCategory.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name}: {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Flow Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cashflow-Analyse
              </CardTitle>
              <CardDescription>
                Operative, investive und finanzielle Cashflows im Zeitverlauf
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData}>
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
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="operating" 
                    name="Operativ"
                    stroke={COLORS[1]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="investing" 
                    name="Investiv"
                    stroke={COLORS[3]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="financing" 
                    name="Finanzierung"
                    stroke={COLORS[0]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* DATEV Exports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              DATEV Exporte
            </CardTitle>
            <CardDescription>
              Übersicht über erstellte DATEV-Exportdateien
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datevExports.length > 0 ? (
              <div className="space-y-4">
                {datevExports.map((exportItem) => (
                  <div
                    key={exportItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{exportItem.filename}</h4>
                        <p className="text-sm text-gray-600">
                          Zeitraum: {formatDate(exportItem.startDate)} - {formatDate(exportItem.endDate)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Erstellt am {formatDate(exportItem.createdAt)} von {exportItem.user?.name || exportItem.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {exportItem.data?.transactions || 0} Transaktionen
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Keine DATEV-Exporte verfügbar</p>
                <p className="text-sm">Erstellen Sie Ihren ersten Export für die Buchhaltung</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Berichtsvorlagen</CardTitle>
            <CardDescription>
              Vorgefertigte Finanzberichte für verschiedene Zwecke
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Monatlicher Finanzbericht',
                  description: 'Komplette Übersicht über Einnahmen, Ausgaben und Gewinn',
                  icon: BarChart3
                },
                {
                  name: 'Quartalsanalyse',
                  description: 'Detaillierte Analyse der Geschäftsentwicklung',
                  icon: TrendingUp
                },
                {
                  name: 'Jahresabschluss Vorbereitung',
                  description: 'Daten für Steuerberater und Jahresabschluss',
                  icon: Calculator
                }
              ].map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.name}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <Button size="sm" variant="outline" className="mt-3">
                          Erstellen
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
