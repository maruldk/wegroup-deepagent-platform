
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Euro,
  Target
} from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch('/api/finance/budgets');
        if (response.ok) {
          const data = await response.json();
          setBudgets(data.budgets || []);
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  const filteredBudgets = budgets.filter((budget: any) =>
    budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    budget.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalBudgets = budgets.length;
    const totalAllocated = budgets.reduce((sum: number, b: any) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum: number, b: any) => sum + b.spentAmount, 0);
    const exceededBudgets = budgets.filter((b: any) => getBudgetStatus(b.spentAmount, b.budgetAmount) === 'exceeded').length;

    return { totalBudgets, totalAllocated, totalSpent, exceededBudgets };
  };

  const stats = calculateStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600 mt-2">
            Planen und überwachen Sie Ihre Ausgaben nach Kategorien
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neues Budget
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Aktive Budgets', 
            value: stats.totalBudgets, 
            icon: Calculator,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          { 
            title: 'Budget gesamt', 
            value: formatCurrency(stats.totalAllocated), 
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          { 
            title: 'Ausgegeben', 
            value: formatCurrency(stats.totalSpent), 
            icon: TrendingDown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          { 
            title: 'Überschritten', 
            value: stats.exceededBudgets, 
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
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

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Budgets durchsuchen..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>

      {/* Budgets Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {filteredBudgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget: any, index: number) => {
              const status = getBudgetStatus(budget.spentAmount, budget.budgetAmount);
              const progressPercentage = getProgressPercentage(budget.spentAmount, budget.budgetAmount);
              const remaining = budget.budgetAmount - budget.spentAmount;
              
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calculator className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{budget.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {budget.category}
                            </Badge>
                          </div>
                        </div>
                        {getStatusIcon(status)}
                      </div>
                      {budget.description && (
                        <CardDescription className="mt-2">
                          {budget.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Budget Amounts */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Budget</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(budget.budgetAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Ausgegeben</p>
                            <p className={`text-lg font-bold ${getStatusColor(status)}`}>
                              {formatCurrency(budget.spentAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Verbrauch</span>
                            <span className="font-medium">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <Progress 
                            value={progressPercentage} 
                            className={`h-2 ${
                              status === 'exceeded' ? '[&>div]:bg-red-500' :
                              status === 'warning' ? '[&>div]:bg-yellow-500' :
                              '[&>div]:bg-green-500'
                            }`}
                          />
                        </div>

                        {/* Remaining Budget */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Verbleibendes Budget:</span>
                          <span className={`font-bold ${
                            remaining >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(remaining)}
                          </span>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(budget.startDate)}</span>
                          </div>
                          <span>bis</span>
                          <span>{formatDate(budget.endDate)}</span>
                        </div>

                        {/* Created by */}
                        {budget.user && (
                          <div className="text-xs text-gray-500 border-t pt-3">
                            Erstellt von: {budget.user.name || budget.user.email}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Budgets gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Keine Budgets entsprechen Ihrer Suche.' 
                  : 'Erstellen Sie Ihr erstes Budget zur Ausgabenkontrolle.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Budget erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Budget Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Budget-Kategorien</CardTitle>
            <CardDescription>
              Häufig verwendete Budget-Kategorien für schnelle Erstellung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: 'Marketing', icon: TrendingUp, color: 'bg-blue-50 text-blue-700' },
                { name: 'Entwicklung', icon: Calculator, color: 'bg-green-50 text-green-700' },
                { name: 'Personal', icon: Target, color: 'bg-purple-50 text-purple-700' },
                { name: 'Infrastruktur', icon: Euro, color: 'bg-orange-50 text-orange-700' },
              ].map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.name}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color.replace('text-', 'bg-').replace('-700', '-100')}`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">Budget erstellen</p>
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
