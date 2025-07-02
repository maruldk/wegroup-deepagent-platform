
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Target,
  PieChart,
  BarChart3,
  Brain,
  Zap,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3', '#72BF78'];

interface Budget {
  id: string;
  name: string;
  description?: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
  user: {
    name?: string;
    email: string;
  };
  allocations?: BudgetAllocation[];
  expenses?: any[];
}

interface BudgetAllocation {
  id: string;
  categoryId: string;
  allocatedAmount: number;
  spentAmount: number;
  category: {
    name: string;
    color?: string;
  };
}

interface BudgetFormData {
  name: string;
  description: string;
  category: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
}

interface BudgetPerformance {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: 'ON_TRACK' | 'NEAR_LIMIT' | 'OVER_BUDGET';
  forecast?: {
    predictedSpending: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: string;
  };
}

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [stats, setStats] = useState<any>({});

  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    description: '',
    category: '',
    budgetAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchBudgets();
    fetchPerformanceData();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Fehler beim Laden der Budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // This would call a budget performance API
      // For now, calculate from existing budget data
      const calculatedPerformance = budgets.map(budget => {
        const utilizationPercentage = budget.budgetAmount > 0 
          ? (budget.spentAmount / budget.budgetAmount) * 100 
          : 0;
        
        const status: 'ON_TRACK' | 'NEAR_LIMIT' | 'OVER_BUDGET' = utilizationPercentage > 100 ? 'OVER_BUDGET' :
                      utilizationPercentage > 80 ? 'NEAR_LIMIT' : 'ON_TRACK';

        // AI-generated forecast (simplified)
        const timeElapsed = (new Date().getTime() - new Date(budget.startDate).getTime()) / 
                           (new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime());
        const predictedSpending = budget.spentAmount + (budget.spentAmount / Math.max(timeElapsed, 0.1)) * (1 - timeElapsed);
        
        const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = predictedSpending > budget.budgetAmount * 1.1 ? 'HIGH' :
                         predictedSpending > budget.budgetAmount * 0.9 ? 'MEDIUM' : 'LOW';

        return {
          budgetId: budget.id,
          budgetName: budget.name,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          remainingAmount: budget.budgetAmount - budget.spentAmount,
          utilizationPercentage,
          status,
          forecast: {
            predictedSpending,
            riskLevel,
            recommendation: riskLevel === 'HIGH' ? 'Budget-Überschreitung wahrscheinlich' :
                           riskLevel === 'MEDIUM' ? 'Budget genau überwachen' :
                           'Budget auf Kurs'
          }
        };
      });

      setBudgetPerformance(calculatedPerformance);
    } catch (error) {
      console.error('Error calculating performance:', error);
    }
  };

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = selectedBudget ? 'PUT' : 'POST';
      const url = selectedBudget 
        ? `/api/finance/budgets/${selectedBudget.id}`
        : '/api/finance/budgets';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedBudget ? 'Budget aktualisiert' : 'Budget erstellt');
        setShowBudgetForm(false);
        setSelectedBudget(null);
        resetForm();
        fetchBudgets();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error submitting budget:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Budget wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/finance/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Budget gelöscht');
        fetchBudgets();
      } else {
        toast.error('Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      budgetAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

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
      case 'OVER_BUDGET':
        return 'text-red-600';
      case 'warning':
      case 'NEAR_LIMIT':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
      case 'OVER_BUDGET':
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
      case 'NEAR_LIMIT':
      case 'MEDIUM':
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

  const filteredBudgets = budgets.filter((budget: Budget) =>
    budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    budget.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data
  const budgetUtilizationData = budgetPerformance.map(p => ({
    name: p.budgetName.length > 12 ? p.budgetName.substring(0, 12) + '...' : p.budgetName,
    utilized: p.utilizationPercentage,
    remaining: Math.max(0, 100 - p.utilizationPercentage)
  }));

  const budgetCategoriesData = budgets.reduce((acc: any[], budget) => {
    const existing = acc.find(item => item.name === budget.category);
    if (existing) {
      existing.value += budget.budgetAmount;
      existing.spent += budget.spentAmount;
    } else {
      acc.push({
        name: budget.category,
        value: budget.budgetAmount,
        spent: budget.spentAmount,
        fill: COLORS[acc.length % COLORS.length]
      });
    }
    return acc;
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-2">
            Intelligente Budget-Planung mit KI-gestützten Prognosen und Optimierungsempfehlungen
          </p>
        </div>
        <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neues Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBudget ? 'Budget bearbeiten' : 'Neues Budget'}
              </DialogTitle>
              <DialogDescription>
                Erstellen Sie ein Budget mit Kategorien und Zeitraum
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitBudget} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Budget-Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Entwicklung">Entwicklung</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
                      <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                      <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budgetAmount">Budget-Betrag (€) *</Label>
                  <Input
                    id="budgetAmount"
                    type="number"
                    step="0.01"
                    value={formData.budgetAmount}
                    onChange={(e) => setFormData({ ...formData, budgetAmount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Enddatum *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowBudgetForm(false);
                    setSelectedBudget(null);
                    resetForm();
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit">
                  {selectedBudget ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Utilization Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Budget-Auslastung
              </CardTitle>
              <CardDescription>
                Aktuelle Nutzung der verfügbaren Budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Bar 
                    dataKey="utilized" 
                    fill={COLORS[0]}
                    name="Genutzt"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Budget-Kategorien
              </CardTitle>
              <CardDescription>
                Verteilung nach Kategorien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={budgetCategoriesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {budgetCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Budget']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {budgetCategoriesData.map((item, index) => (
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              KI-gestützte Budget-Insights
              <Badge variant="secondary" className="ml-2">
                <Zap className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </CardTitle>
            <CardDescription>
              Intelligente Empfehlungen zur Budget-Optimierung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {budgetPerformance.filter(p => p.forecast?.riskLevel !== 'LOW').slice(0, 3).map((item, index) => (
                <Alert key={item.budgetId} className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{item.budgetName}</div>
                    <div className="text-sm mt-1">{item.forecast?.recommendation}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Prognostiziert: {formatCurrency(item.forecast?.predictedSpending || 0)}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              {budgetPerformance.filter(p => p.forecast?.riskLevel !== 'LOW').length === 0 && (
                <Alert className="md:col-span-3 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Alle Budgets auf Kurs</div>
                    <div className="text-sm mt-1">Keine kritischen Budget-Überschreitungen erwartet</div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Budgets durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Entwicklung">Entwicklung</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
            <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
            <SelectItem value="Verwaltung">Verwaltung</SelectItem>
            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Budgets Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {filteredBudgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget, index) => {
              const budgetPerf = budgetPerformance.find(p => p.budgetId === budget.id);
              const status = getBudgetStatus(budget.spentAmount, budget.budgetAmount);
              const progressPercentage = getProgressPercentage(budget.spentAmount, budget.budgetAmount);
              const remaining = budget.budgetAmount - budget.spentAmount;
              
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
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
                        <div className="flex items-center gap-1">
                          {getStatusIcon(status)}
                          {budgetPerf?.forecast && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(budgetPerf.forecast.riskLevel)}`}
                            >
                              {budgetPerf.forecast.riskLevel}
                            </Badge>
                          )}
                        </div>
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

                        {/* AI Forecast */}
                        {budgetPerf?.forecast && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">KI-Prognose</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {budgetPerf.forecast.recommendation}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Erwartet: {formatCurrency(budgetPerf.forecast.predictedSpending)}
                            </p>
                          </div>
                        )}

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

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedBudget(budget);
                              setFormData({
                                name: budget.name,
                                description: budget.description || '',
                                category: budget.category,
                                budgetAmount: budget.budgetAmount,
                                startDate: budget.startDate.split('T')[0],
                                endDate: budget.endDate.split('T')[0]
                              });
                              setShowBudgetForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Created by */}
                        <div className="text-xs text-gray-500 border-t pt-3">
                          Erstellt von: {budget.user.name || budget.user.email}
                        </div>
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
                {searchTerm || categoryFilter !== 'all'
                  ? 'Keine Budgets entsprechen Ihrer Suche.' 
                  : 'Erstellen Sie Ihr erstes Budget zur Ausgabenkontrolle.'
                }
              </p>
              <Button onClick={() => setShowBudgetForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Budget erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
