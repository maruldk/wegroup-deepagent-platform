
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  BarChart3, 
  PieChart, 
  LineChart,
  Zap,
  Target,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface PredictiveInsight {
  title: string;
  description: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  value: number;
  change: number;
}

interface ForecastData {
  period: string;
  actual?: number;
  predicted: number;
  confidence: number;
}

export function AIEnhancedAnalytics() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Generate AI analytics
      const response = await fetch('/api/ai/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'ANALYTICS_GENERATION',
          data: { requestType: 'COMPREHENSIVE_ANALYSIS' },
          resourceType: 'ANALYTICS'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Mock data for demonstration - in real app, this would come from AI
        setInsights([
          {
            title: 'Umsatzwachstum prognostiziert',
            description: 'Basierend auf aktuellen Trends wird ein Umsatzwachstum von 15% im nächsten Quartal erwartet.',
            confidence: 0.87,
            trend: 'up',
            impact: 'high',
            value: 15,
            change: 3.2
          },
          {
            title: 'Kundenretention optimierbar',
            description: 'Die Analyse zeigt Potenzial zur Verbesserung der Kundenretention um 8%.',
            confidence: 0.73,
            trend: 'up',
            impact: 'medium',
            value: 8,
            change: 1.5
          },
          {
            title: 'Kosteneinsparungen identifiziert',
            description: 'Automatisierungspotenzial in Geschäftsprozessen kann Kosten um 12% reduzieren.',
            confidence: 0.92,
            trend: 'down',
            impact: 'high',
            value: 12,
            change: -2.8
          }
        ]);

        setForecastData([
          { period: 'Jan', actual: 45000, predicted: 47000, confidence: 0.9 },
          { period: 'Feb', actual: 48000, predicted: 49500, confidence: 0.88 },
          { period: 'Mär', actual: 52000, predicted: 51000, confidence: 0.85 },
          { period: 'Apr', predicted: 54000, confidence: 0.82 },
          { period: 'Mai', predicted: 57000, confidence: 0.78 },
          { period: 'Jun', predicted: 59000, confidence: 0.75 }
        ]);

        setAnomalies([
          {
            title: 'Ungewöhnlicher Transaktionspeak',
            description: 'Am 15.03. wurde ein 340% höheres Transaktionsvolumen als normal detektiert.',
            severity: 'HIGH',
            confidence: 0.94
          },
          {
            title: 'Projektlaufzeit-Anomalie',
            description: 'Projekt Alpha dauert 45% länger als statistisch erwartet.',
            severity: 'MEDIUM',
            confidence: 0.78
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    setGeneratingInsights(true);
    try {
      await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType: 'PREDICTIVE_ANALYSIS',
          data: { module: 'ANALYTICS' }
        })
      });
      
      // Refresh data
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold">KI-Enhanced Analytics</h2>
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
        <Button 
          onClick={generateNewInsights} 
          disabled={generatingInsights}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generatingInsights ? 'animate-spin' : ''}`} />
          Neue Insights generieren
        </Button>
      </div>

      {/* Predictive Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(insight.trend)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                  <Badge variant={getImpactColor(insight.impact)}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {insight.trend === 'down' ? '-' : '+'}{insight.value}%
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Konfidenz</p>
                    <p className="font-medium">{Math.round(insight.confidence * 100)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Prognosen</TabsTrigger>
          <TabsTrigger value="trends">Trend-Analyse</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalien</TabsTrigger>
          <TabsTrigger value="optimization">Optimierung</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Umsatz-Prognose (KI-generiert)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Umsatz (€)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 11 } 
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `€${value?.toLocaleString('de-DE')}`, 
                      name === 'actual' ? 'Tatsächlich' : 'Prognose'
                    ]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#60B5FF" 
                    strokeWidth={2}
                    name="Tatsächlich"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#FF9149" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Prognose"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Kunden-Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={[
                    { name: 'Neue Kunden', value: 23, growth: 15 },
                    { name: 'Wiederkehrende', value: 67, growth: 8 },
                    { name: 'Churned', value: 10, growth: -12 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#60B5FF" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Produktverkäufe', value: 45 },
                        { name: 'Services', value: 30 },
                        { name: 'Consulting', value: 15 },
                        { name: 'Sonstiges', value: 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="top"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        <CardTitle>{anomaly.title}</CardTitle>
                      </div>
                      <Badge variant={anomaly.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">
                      {anomaly.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>KI-Konfidenz: {Math.round(anomaly.confidence * 100)}%</span>
                      <Button variant="outline" size="sm">
                        Untersuchen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Optimierungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Automatisierung von Berichten</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Potenzielle Zeitersparnis: 12 Stunden/Woche
                  </p>
                  <Badge variant="outline">Impact: Hoch</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Dashboard-Personalisierung</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Erhöhung der Nutzerzufriedenheit um 25%
                  </p>
                  <Badge variant="outline">Impact: Mittel</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Predictive Maintenance</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Reduzierung von Ausfallzeiten um 30%
                  </p>
                  <Badge variant="outline">Impact: Hoch</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance-Metriken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">KI-Modell Genauigkeit</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verarbeitungszeit</span>
                    <span className="font-medium">1.3s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Insights generiert</span>
                    <span className="font-medium">847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aktionen ausgelöst</span>
                    <span className="font-medium">123</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
