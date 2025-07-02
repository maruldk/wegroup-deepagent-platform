
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus, 
  Search,
  Download,
  Filter,
  Calendar,
  Euro,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock chart data for cash flow
  const cashFlowData = [
    { month: 'Jan', income: 15000, expense: 8000, net: 7000 },
    { month: 'Feb', income: 18000, expense: 9500, net: 8500 },
    { month: 'Mar', income: 22000, expense: 11000, net: 11000 },
    { month: 'Apr', income: 25000, expense: 12500, net: 12500 },
    { month: 'Mai', income: 28000, expense: 14000, net: 14000 },
    { month: 'Jun', income: 32000, expense: 16000, net: 16000 },
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        
        const response = await fetch(`/api/finance/transactions?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [typeFilter, categoryFilter]);

  const filteredTransactions = transactions.filter((transaction: any) =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-green-100 text-green-700';
      case 'EXPENSE':
        return 'bg-red-100 text-red-700';
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'INCOME': 'Einnahme',
      'EXPENSE': 'Ausgabe',
      'TRANSFER': 'Transfer'
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'EXPENSE':
        return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
      case 'TRANSFER':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Euro className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  };

  const calculateStats = () => {
    const totalIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    
    const netCashFlow = totalIncome - totalExpenses;
    const transactionCount = transactions.length;

    return { totalIncome, totalExpenses, netCashFlow, transactionCount };
  };

  const stats = calculateStats();

  const categories = [...new Set(transactions.map((t: any) => t.category).filter(Boolean))];

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
          <h1 className="text-3xl font-bold text-gray-900">Transaktionen</h1>
          <p className="text-gray-600 mt-2">
            Übersicht über alle Einnahmen und Ausgaben
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neue Transaktion
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Einnahmen', 
            value: formatCurrency(stats.totalIncome), 
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          { 
            title: 'Ausgaben', 
            value: formatCurrency(stats.totalExpenses), 
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          },
          { 
            title: 'Netto Cashflow', 
            value: formatCurrency(stats.netCashFlow), 
            icon: stats.netCashFlow >= 0 ? TrendingUp : TrendingDown,
            color: stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600',
            bgColor: stats.netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'
          },
          { 
            title: 'Transaktionen', 
            value: stats.transactionCount, 
            icon: Receipt,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cash Flow Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Cashflow Entwicklung</CardTitle>
            <CardDescription>
              Monatliche Übersicht über Einnahmen und Ausgaben
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
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Transaktionen durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Typ auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="INCOME">Einnahme</SelectItem>
            <SelectItem value="EXPENSE">Ausgabe</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {filteredTransactions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Transaktionshistorie</CardTitle>
              <CardDescription>
                {filteredTransactions.length} Transaktion(en) gefunden
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referenz
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction: any) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.description}
                              </div>
                              {transaction.user && (
                                <div className="text-sm text-gray-500">
                                  von {transaction.user.name || transaction.user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.category && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              {transaction.category}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getTypeColor(transaction.type)}>
                            {getTypeText(transaction.type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference || '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Transaktionen gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Keine Transaktionen entsprechen Ihren Suchkriterien.' 
                  : 'Erfassen Sie Ihre erste Transaktion.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Transaktion erfassen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
