
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Trash2,
  Calculator,
  Activity
} from 'lucide-react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics || []);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const filteredMetrics = metrics.filter(metric =>
    metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (metric.description && metric.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getProgressPercentage = (current: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getTrendIcon = (current: number, target: number) => {
    if (!target) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const percentage = (current / target) * 100;
    if (percentage >= 90) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentage >= 70) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (current: number, target: number) => {
    if (!target) return 'text-gray-600';
    
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (value: number, metricName: string) => {
    if (metricName.toLowerCase().includes('rate') || metricName.toLowerCase().includes('percentage')) {
      return `${value}%`;
    }
    if (metricName.toLowerCase().includes('revenue') || metricName.toLowerCase().includes('value')) {
      return `€${value?.toLocaleString()}`;
    }
    return value?.toLocaleString() || '0';
  };

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
          <h1 className="text-3xl font-bold text-gray-900">KPI Metriken</h1>
          <p className="text-gray-600 mt-2">
            Verwalten und überwachen Sie wichtige Leistungsindikatoren
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neue Metrik
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Metriken durchsuchen..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Aktive Metriken', value: metrics.length, icon: Target },
          { title: 'Ziele erreicht', value: metrics.filter(m => m.target && m.currentValue >= m.target).length, icon: TrendingUp },
          { title: 'In Bearbeitung', value: metrics.filter(m => m.target && m.currentValue < m.target && m.currentValue >= m.target * 0.7).length, icon: Activity },
          { title: 'Unter Ziel', value: metrics.filter(m => m.target && m.currentValue < m.target * 0.7).length, icon: TrendingDown },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {filteredMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMetrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{metric.name}</CardTitle>
                          {metric.description && (
                            <CardDescription className="mt-1">
                              {metric.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Value */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Aktueller Wert:</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.currentValue, metric.target)}
                          <span className={`text-lg font-bold ${getStatusColor(metric.currentValue, metric.target)}`}>
                            {formatValue(metric.currentValue, metric.name)}
                          </span>
                        </div>
                      </div>

                      {/* Target Value */}
                      {metric.target && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Zielwert:</span>
                          <span className="font-medium text-gray-900">
                            {formatValue(metric.target, metric.name)}
                          </span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {metric.target && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Fortschritt:</span>
                            <span className="text-sm font-medium">
                              {Math.round(getProgressPercentage(metric.currentValue, metric.target))}%
                            </span>
                          </div>
                          <Progress 
                            value={getProgressPercentage(metric.currentValue, metric.target)}
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Formula */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Formel:</span>
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 block">
                          {metric.formula}
                        </code>
                      </div>

                      {/* Last Updated */}
                      <div className="text-xs text-gray-500">
                        Zuletzt aktualisiert: {new Date(metric.updatedAt).toLocaleDateString('de-DE')}
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
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Metriken gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Keine Metriken entsprechen Ihrer Suche.' 
                  : 'Erstellen Sie Ihre ersten KPI-Metriken zur Performance-Überwachung.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Metrik erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Metric Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Metrik-Kategorien</CardTitle>
            <CardDescription>
              Vorgefertigte Metriken für verschiedene Geschäftsbereiche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Vertrieb & Marketing',
                  metrics: ['Conversion Rate', 'Customer Acquisition Cost', 'Lead Velocity'],
                  color: 'bg-blue-50 text-blue-700'
                },
                {
                  name: 'Finanzen',
                  metrics: ['Monthly Recurring Revenue', 'Profit Margin', 'Cash Flow'],
                  color: 'bg-green-50 text-green-700'
                },
                {
                  name: 'Projekte',
                  metrics: ['On-Time Delivery', 'Budget Variance', 'Team Productivity'],
                  color: 'bg-purple-50 text-purple-700'
                }
              ].map((category) => (
                <div
                  key={category.name}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
                  <div className="space-y-2">
                    {category.metrics.map((metric) => (
                      <Badge 
                        key={metric}
                        variant="secondary" 
                        className={category.color}
                      >
                        {metric}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Metriken hinzufügen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
