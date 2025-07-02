
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Filter,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Euro,
  Calendar,
  User,
  Edit,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  user: {
    id: string;
    name?: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name?: string;
    email: string;
  };
  merchantName?: string;
  receiptUrl?: string;
  rejectedReason?: string;
  createdAt: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface ExpenseFormData {
  title: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  merchantName: string;
  notes: string;
}

export function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [stats, setStats] = useState<any>({});

  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    merchantName: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [statusFilter, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);

      const response = await fetch(`/api/finance/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Fehler beim Laden der Ausgaben');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/finance/expense-categories?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = selectedExpense ? 'PUT' : 'POST';
      const url = selectedExpense 
        ? `/api/finance/expenses/${selectedExpense.id}`
        : '/api/finance/expenses';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedExpense ? 'Ausgabe aktualisiert' : 'Ausgabe erstellt');
        setShowExpenseForm(false);
        setSelectedExpense(null);
        resetForm();
        fetchExpenses();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleApproveExpense = async (expenseId: string, approved: boolean, reason?: string) => {
    try {
      const response = await fetch(`/api/finance/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approved ? 'APPROVED' : 'REJECTED',
          rejectedReason: reason
        })
      });

      if (response.ok) {
        toast.success(approved ? 'Ausgabe genehmigt' : 'Ausgabe abgelehnt');
        fetchExpenses();
      } else {
        toast.error('Fehler bei der Bearbeitung');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Fehler bei der Bearbeitung');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Ausgabe wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/finance/expenses/${expenseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Ausgabe gelöscht');
        fetchExpenses();
      } else {
        toast.error('Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      merchantName: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PAID': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'PAID': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Ausstehend',
      'APPROVED': 'Genehmigt',
      'REJECTED': 'Abgelehnt',
      'PAID': 'Bezahlt',
      'CANCELLED': 'Storniert'
    };
    return statusMap[status] || status;
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.merchantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Ausgaben-Tracking</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ausgaben mit Kategorisierung und Genehmigungsworkflow
          </p>
        </div>
        <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Ausgabe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie eine neue Ausgabe mit Details und Kategorisierung
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Betrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">Kategorie</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Keine Kategorie</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="merchantName">Händler/Anbieter</Label>
                  <Input
                    id="merchantName"
                    value={formData.merchantName}
                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
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
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowExpenseForm(false);
                    setSelectedExpense(null);
                    resetForm();
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit">
                  {selectedExpense ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Gesamtausgaben', 
            value: `€${(stats.totalAmount || 0).toLocaleString('de-DE')}`, 
            icon: Euro,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          { 
            title: 'Ausstehend', 
            value: stats.statusCounts?.PENDING || 0, 
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
          },
          { 
            title: 'Genehmigt', 
            value: stats.statusCounts?.APPROVED || 0, 
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          { 
            title: 'Abgelehnt', 
            value: stats.statusCounts?.REJECTED || 0, 
            icon: XCircle,
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

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Ausgaben durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="PENDING">Ausstehend</SelectItem>
            <SelectItem value="APPROVED">Genehmigt</SelectItem>
            <SelectItem value="REJECTED">Abgelehnt</SelectItem>
            <SelectItem value="PAID">Bezahlt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {filteredExpenses.length > 0 ? (
          <div className="space-y-4">
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {expense.title}
                          </h3>
                          <Badge className={getStatusColor(expense.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(expense.status)}
                              {getStatusText(expense.status)}
                            </div>
                          </Badge>
                          {expense.category && (
                            <Badge 
                              variant="secondary"
                              style={{ 
                                backgroundColor: expense.category.color + '20',
                                color: expense.category.color
                              }}
                            >
                              {expense.category.name}
                            </Badge>
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-gray-600 mb-2">{expense.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Euro className="h-4 w-4" />
                            <span className="font-semibold">
                              €{expense.amount.toLocaleString('de-DE')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(expense.date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{expense.user.name || expense.user.email}</span>
                          </div>
                        </div>
                        {expense.merchantName && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Händler:</span> {expense.merchantName}
                          </div>
                        )}
                        {expense.rejectedReason && (
                          <Alert className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Ablehnungsgrund:</strong> {expense.rejectedReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {expense.receiptUrl && (
                          <Button size="sm" variant="outline">
                            <Receipt className="h-4 w-4" />
                          </Button>
                        )}
                        {expense.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApproveExpense(expense.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                const reason = prompt('Ablehnungsgrund:');
                                if (reason) handleApproveExpense(expense.id, false, reason);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setFormData({
                              title: expense.title,
                              description: expense.description || '',
                              amount: expense.amount,
                              date: expense.date.split('T')[0],
                              categoryId: expense.category?.id || '',
                              merchantName: expense.merchantName || '',
                              notes: ''
                            });
                            setShowExpenseForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Ausgaben gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Keine Ausgaben entsprechen Ihren Suchkriterien.' 
                  : 'Erfassen Sie Ihre erste Ausgabe.'
                }
              </p>
              <Button onClick={() => setShowExpenseForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Ausgabe erfassen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
