
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard, 
  FileText,
  AlertCircle,
  Plus,
  Filter,
  Download,
  Euro,
  Brain,
  Sparkles,
  PieChart,
  BarChart3,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Calculator
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { ExpenseTracking } from './expense-tracking';
import { toast } from 'sonner';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3', '#72BF78'];

interface FinancialKPI {
  name: string;
  value: number;
  unit: string;
  target?: number;
  change: number;
  metadata?: any;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  outstandingInvoices: number;
  budgetUtilization: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  category?: string;
  reference?: string;
  user?: {
    name?: string;
    email: string;
  };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  status: string;
  date: string;
  category?: {
    name: string;
    color?: string;
  };
}

export function EnhancedFinancialDashboard() {
  const [kpis, setKpis] = useState<FinancialKPI[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTHLY');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFinancialData();
  }, [period, dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      const [kpisResponse, transactionsResponse, expensesResponse] = await Promise.all([
        fetch(`/api/finance/financial-kpis?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/finance/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=100`),
        fetch(`/api/finance/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=50`)
      ]);

      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData.kpis || []);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData.expenses || []);
      }

      // Calculate summary from KPIs
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        const kpiMap = (kpisData.kpis || []).reduce((acc: any, kpi: FinancialKPI) => {
          acc[kpi.name] = kpi.value;
          return acc;
        }, {});

        setSummary({
          totalRevenue: kpiMap.REVENUE || 0,
          totalExpenses: kpiMap.EXPENSES || 0,
          netProfit: kpiMap.NET_CASH_FLOW || 0,
          profitMargin: kpiMap.PROFIT_MARGIN || 0,
          cashFlow: kpiMap.NET_CASH_FLOW || 0,
          outstandingInvoices: kpiMap.OUTSTANDING_INVOICES || 0,
          budgetUtilization: kpiMap.BUDGET_UTILIZATION || 0
        });
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Fehler beim Laden der Finanzdaten');
    } finally {
      setLoading(false);
    }
  };

  // Memoized chart data
  const chartData = useMemo(() => {
    // Cash flow trend from transactions
    const cashflowData = transactions.reduce((acc: any[], transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('de-DE', { month: 'short' });
      const existingMonth = acc.find(item => item.month === month);
      
      if (existingMonth) {
        if (transaction.type === 'INCOME') {
          existingMonth.income += transaction.amount;
        } else if (transaction.type === 'EXPENSE') {
          existingMonth.expenses += Math.abs(transaction.amount);
        }
      } else {
        acc.push({
          month,
          income: transaction.type === 'INCOME' ? transaction.amount : 0,
          expenses: transaction.type === 'EXPENSE' ? Math.abs(transaction.amount) : 0
        });
      }
      
      return acc;
    }, []);

    // Expense categories from expenses
    const expenseCategories = expenses.reduce((acc: any[], expense) => {
      const categoryName = expense.category?.name || 'Uncategorized';
      const existingCategory = acc.find(item => item.name === categoryName);
      
      if (existingCategory) {
        existingCategory.value += expense.amount;
      } else {
        acc.push({
          name: categoryName,
          value: expense.amount,
          fill: expense.category?.color || COLORS[acc.length % COLORS.length]
        });
      }
      
      return acc;
    }, []);

    return {
      cashflow: cashflowData,
      expenseCategories: expenseCategories.slice(0, 8) // Top 8 categories
    };
  }, [transactions, expenses]);

  // KPI Cards with real data
  const kpiCards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        title: 'Gesamtumsatz',
        value: `€${summary.totalRevenue.toLocaleString('de-DE')}`,
        change: kpis.find(k => k.name === 'REVENUE')?.change || 0,
        changeType: (kpis.find(k => k.name === 'REVENUE')?.change || 0) >= 0 ? 'positive' : 'negative',
        icon: Euro,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        target: kpis.find(k => k.name === 'REVENUE')?.target
      },
      {
        title: 'Ausgaben',
        value: `€${summary.totalExpenses.toLocaleString('de-DE')}`,
        change: kpis.find(k => k.name === 'EXPENSES')?.change || 0,
        changeType: (kpis.find(k => k.name === 'EXPENSES')?.change || 0) <= 0 ? 'positive' : 'negative',
        icon: CreditCard,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        target: kpis.find(k => k.name === 'EXPENSES')?.target
      },
      {
        title: 'Nettogewinn',
        value: `€${summary.netProfit.toLocaleString('de-DE')}`,
        change: kpis.find(k => k.name === 'NET_CASH_FLOW')?.change || 0,
        changeType: (kpis.find(k => k.name === 'NET_CASH_FLOW')?.change || 0) >= 0 ? 'positive' : 'negative',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        target: kpis.find(k => k.name === 'NET_CASH_FLOW')?.target
      },
      {
        title: 'Offene Rechnungen',
        value: `€${summary.outstandingInvoices.toLocaleString('de-DE')}`,
        change: kpis.find(k => k.name === 'OUTSTANDING_INVOICES')?.change || 0,
        changeType: (kpis.find(k => k.name === 'OUTSTANDING_INVOICES')?.change || 0) <= 0 ? 'positive' : 'negative',
        icon: FileText,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        target: kpis.find(k => k.name === 'OUTSTANDING_INVOICES')?.target
      }
    ];
  }, [summary, kpis]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time Finanzübersicht mit KI-gestützter Analyse und Prognosen
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Täglich</SelectItem>
              <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
              <SelectItem value="MONTHLY">Monatlich</SelectItem>
              <SelectItem value="QUARTERLY">Quartalsweise</SelectItem>
              <SelectItem value="YEARLY">Jährlich</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Neue Transaktion
          </Button>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Ausgaben
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            KI-Analytics
            <Badge variant="secondary" className="ml-1">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              const changeValue = Math.abs(kpi.change);
              return (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                          <div className="flex items-center mt-2">
                            {kpi.changeType === 'positive' ? (
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${
                              kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {changeValue > 0 ? `${changeValue.toFixed(1)}%` : 'Keine Änderung'}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">vs. Vorperiode</span>
                          </div>
                          {kpi.target && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Ziel</span>
                                <span>{typeof kpi.target === 'number' ? `€${kpi.target.toLocaleString('de-DE')}` : kpi.target}</span>
                              </div>
                            </div>
                          )}
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cashflow Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cashflow-Entwicklung
                  </CardTitle>
                  <CardDescription>
                    Einnahmen vs. Ausgaben über die Zeit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.cashflow}>
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
                        formatter={(value) => [`€${Number(value).toLocaleString('de-DE')}`, '']}
                        labelStyle={{ fontSize: 12 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stackId="1" 
                        stroke={COLORS[1]} 
                        fill={COLORS[1]}
                        fillOpacity={0.6}
                        name="Einnahmen"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stackId="2" 
                        stroke={COLORS[3]} 
                        fill={COLORS[3]}
                        fillOpacity={0.6}
                        name="Ausgaben"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expense Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Ausgaben-Kategorien
                  </CardTitle>
                  <CardDescription>
                    Verteilung der Ausgaben nach Kategorien
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.expenseCategories.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                          <Pie
                            data={chartData.expenseCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                          >
                            {chartData.expenseCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`€${Number(value).toLocaleString('de-DE')}`, 'Betrag']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {chartData.expenseCategories.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm text-gray-600">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Ausgabendaten verfügbar</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Letzte Transaktionen</CardTitle>
                <CardDescription>
                  Übersicht der neuesten Ein- und Ausgaben
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 8).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'INCOME' ? (
                              <ArrowUpRight className={`h-4 w-4 text-green-600`} />
                            ) : (
                              <ArrowDownLeft className={`h-4 w-4 text-red-600`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{new Date(transaction.date).toLocaleDateString('de-DE')}</span>
                              {transaction.category && (
                                <>
                                  <span>•</span>
                                  <span>{transaction.category}</span>
                                </>
                              )}
                              {transaction.user && (
                                <>
                                  <span>•</span>
                                  <span>{transaction.user.name || transaction.user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}€{Math.abs(transaction.amount).toLocaleString('de-DE')}
                          </p>
                          <Badge variant={transaction.type === 'INCOME' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.type === 'INCOME' ? 'Einnahme' : 'Ausgabe'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Keine Transaktionen verfügbar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseTracking />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Management</h3>
            <p className="text-gray-600 mb-6">
              Erweiterte Budget-Features werden hier implementiert
            </p>
            <Button variant="outline">
              Zu Budget-Management
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">KI-Analytics</h3>
            <p className="text-gray-600 mb-6">
              KI-gestützte Finanzanalyse und Prognosen
            </p>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Insights anzeigen
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
