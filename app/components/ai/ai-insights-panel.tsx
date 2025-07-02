
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export interface AIInsightData {
  id: string;
  category: 'sales' | 'marketing' | 'customer' | 'operations' | 'finance';
  type: 'trend' | 'prediction' | 'anomaly' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  value: number;
  change: number;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  impact: string;
  actionItems?: string[];
  chartData?: any[];
}

interface AIInsightsPanelProps {
  className?: string;
}

export function AIInsightsPanel({ className }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const generateMockInsights = (): AIInsightData[] => {
    return [
      {
        id: '1',
        category: 'sales',
        type: 'prediction',
        title: 'Umsatz-Prognose Q4',
        description: 'Basierend auf aktuellen Trends wird der Umsatz um 15% steigen',
        value: 15,
        change: 5.2,
        confidence: 0.89,
        priority: 'high',
        timeframe: 'Nächste 3 Monate',
        impact: 'Zusätzliche €450K Umsatz erwartet',
        actionItems: [
          'Sales-Team auf erhöhte Nachfrage vorbereiten',
          'Lagerbestände entsprechend aufstocken',
          'Marketing-Budget für Q4 optimieren'
        ],
        chartData: [
          { month: 'Aug', value: 100 },
          { month: 'Sep', value: 108 },
          { month: 'Okt', value: 112 },
          { month: 'Nov', value: 115 }
        ]
      },
      {
        id: '2',
        category: 'customer',
        type: 'anomaly',
        title: 'Ungewöhnliche Churn-Rate',
        description: 'Kundenverlustrate ist in den letzten 2 Wochen um 23% gestiegen',
        value: 23,
        change: -23,
        confidence: 0.94,
        priority: 'high',
        timeframe: 'Letzte 2 Wochen',
        impact: 'Potentieller Verlust von €85K MRR',
        actionItems: [
          'Betroffene Kunden identifizieren und kontaktieren',
          'Feedback-Umfrage durchführen',
          'Retention-Kampagne starten'
        ],
        chartData: [
          { week: 'KW1', churn: 2.1 },
          { week: 'KW2', churn: 2.3 },
          { week: 'KW3', churn: 2.8 },
          { week: 'KW4', churn: 2.6 }
        ]
      },
      {
        id: '3',
        category: 'marketing',
        type: 'opportunity',
        title: 'Healthcare-Sektor Potenzial',
        description: 'Steigende Nachfrage im Healthcare-Bereich um 45%',
        value: 45,
        change: 18.5,
        confidence: 0.76,
        priority: 'medium',
        timeframe: 'Nächste 6 Monate',
        impact: 'Möglichkeit für neue Markterschließung',
        actionItems: [
          'Healthcare-spezifische Features entwickeln',
          'Compliance-Anforderungen prüfen',
          'Branchenexperten kontaktieren'
        ]
      },
      {
        id: '4',
        category: 'operations',
        type: 'recommendation',
        title: 'Prozess-Automatisierung',
        description: 'Automatisierung kann 32% der manuellen Aufgaben reduzieren',
        value: 32,
        change: 12.8,
        confidence: 0.82,
        priority: 'medium',
        timeframe: '3-6 Monate Umsetzung',
        impact: 'Einsparung von 2.5 FTE',
        actionItems: [
          'Automatisierbare Prozesse identifizieren',
          'RPA-Tools evaluieren',
          'Pilotprojekt starten'
        ]
      },
      {
        id: '5',
        category: 'finance',
        type: 'trend',
        title: 'Cash-Flow Optimierung',
        description: 'Zahlungseingänge beschleunigen sich um durchschnittlich 12 Tage',
        value: 12,
        change: 8.3,
        confidence: 0.87,
        priority: 'low',
        timeframe: 'Letzte 30 Tage',
        impact: 'Verbesserte Liquidität',
        actionItems: [
          'Zahlungsbedingungen optimieren',
          'Mahnprozess automatisieren'
        ]
      }
    ];
  };

  const refreshInsights = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInsights(generateMockInsights());
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshInsights();
  }, []);

  const getTypeIcon = (type: AIInsightData['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'prediction': return <BarChart3 className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: AIInsightData['type']) => {
    switch (type) {
      case 'trend': return 'bg-blue-500';
      case 'prediction': return 'bg-green-500';
      case 'anomaly': return 'bg-red-500';
      case 'opportunity': return 'bg-orange-500';
      case 'recommendation': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: AIInsightData['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: AIInsightData['category']) => {
    switch (category) {
      case 'sales': return <DollarSign className="h-4 w-4" />;
      case 'marketing': return <Target className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'operations': return <Zap className="h-4 w-4" />;
      case 'finance': return <BarChart3 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const insightsByCategory = insights.reduce((acc, insight) => {
    acc[insight.category] = (acc[insight.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(insightsByCategory).map(([category, count]) => ({
    name: category,
    value: count,
    color: category === 'sales' ? '#3b82f6' : 
           category === 'marketing' ? '#10b981' :
           category === 'customer' ? '#f59e0b' :
           category === 'operations' ? '#8b5cf6' : '#ef4444'
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                KI-Erkenntnisse Dashboard
              </CardTitle>
              <CardDescription>
                Intelligente Analyse Ihrer Geschäftsdaten mit actionable Insights
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {lastUpdate.toLocaleTimeString()}
              </Badge>
              <Button variant="outline" size="sm" onClick={refreshInsights} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="customer">Kunden</TabsTrigger>
              <TabsTrigger value="operations">Ops</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Overview Stats */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Gesamt Insights</p>
                        <p className="text-2xl font-bold">{insights.length}</p>
                      </div>
                      <Brain className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Hohe Priorität</p>
                        <p className="text-2xl font-bold text-red-500">
                          {insights.filter(i => i.priority === 'high').length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ø Vertrauen</p>
                        <p className="text-2xl font-bold">
                          {Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length * 100)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Aktionen</p>
                        <p className="text-2xl font-bold">
                          {insights.reduce((acc, i) => acc + (i.actionItems?.length || 0), 0)}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution */}
              {selectedCategory === 'all' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Insights nach Kategorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-5 bg-muted rounded animate-pulse" />
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-16 bg-muted rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInsights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getTypeColor(insight.type)} text-white`}>
                                  {getTypeIcon(insight.type)}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{insight.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                                      {insight.priority} Priorität
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      <span className="flex items-center gap-1">
                                        {getCategoryIcon(insight.category)}
                                        {insight.category}
                                      </span>
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {insight.timeframe}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold flex items-center gap-1">
                                  {insight.value}
                                  {insight.change > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* Description & Impact */}
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {insight.description}
                              </p>
                              <p className="text-sm font-medium text-blue-600">
                                💡 {insight.impact}
                              </p>
                            </div>

                            {/* Confidence Score */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>KI-Vertrauen:</span>
                                <span className="font-medium">
                                  {Math.round(insight.confidence * 100)}%
                                </span>
                              </div>
                              <Progress value={insight.confidence * 100} className="h-2" />
                            </div>

                            {/* Chart Data */}
                            {insight.chartData && (
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={insight.chartData}>
                                    <XAxis 
                                      dataKey={Object.keys(insight.chartData[0])[0]}
                                      tick={{ fontSize: 10 }}
                                      tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Area
                                      type="monotone"
                                      dataKey={Object.keys(insight.chartData[0])[1]}
                                      stroke="#3b82f6"
                                      fill="#3b82f6"
                                      fillOpacity={0.2}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Action Items */}
                            {insight.actionItems && insight.actionItems.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2">Empfohlene Maßnahmen:</h5>
                                <ul className="space-y-1">
                                  {insight.actionItems.map((action, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                      <ArrowRight className="h-3 w-3 text-blue-500" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button variant="default" size="sm">
                                <Target className="h-4 w-4 mr-2" />
                                Maßnahme planen
                              </Button>
                              <Button variant="outline" size="sm">
                                Details anzeigen
                              </Button>
                              <Button variant="ghost" size="sm">
                                Exportieren
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {filteredInsights.length === 0 && !loading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="font-medium mb-2">Keine Insights für diese Kategorie</h4>
                    <p className="text-sm text-muted-foreground">
                      Die KI analysiert kontinuierlich Ihre Daten und wird neue Erkenntnisse bereitstellen.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
