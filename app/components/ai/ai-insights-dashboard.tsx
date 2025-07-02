
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  CheckCircle, 
  Clock,
  Eye,
  EyeOff,
  Zap,
  Target,
  AlertCircle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsight {
  id: string;
  category: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  isRead: boolean;
  isActionable: boolean;
  actionTaken?: string;
  createdAt: string;
  data: any;
}

interface AIPrediction {
  id: string;
  predictionType: string;
  targetDate: string;
  predictedValue: number;
  confidence: number;
  status: string;
}

export function AIInsightsDashboard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchInsights();
    fetchPredictions();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/ai/predictions');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (insightId: string, actionTaken?: string) => {
    try {
      await fetch('/api/ai/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, actionTaken })
      });
      
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, isRead: true, actionTaken }
            : insight
        )
      );
    } catch (error) {
      console.error('Failed to mark insight as read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH': return <AlertCircle className="w-4 h-4" />;
      case 'MEDIUM': return <Activity className="w-4 h-4" />;
      case 'LOW': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANOMALY': return <Zap className="w-4 h-4" />;
      case 'PREDICTION': return <Target className="w-4 h-4" />;
      case 'RISK': return <AlertTriangle className="w-4 h-4" />;
      case 'OPTIMIZATION': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const filteredInsights = selectedCategory === 'ALL' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const unreadInsights = filteredInsights.filter(insight => !insight.isRead);
  const criticalInsights = filteredInsights.filter(insight => 
    insight.severity === 'CRITICAL' || insight.severity === 'HIGH'
  );

  const categories = ['ALL', ...Array.from(new Set(insights.map(i => i.category)))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ungelesene Insights
                  </p>
                  <p className="text-2xl font-bold">{unreadInsights.length}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Kritische Alerts
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {criticalInsights.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Aktive Vorhersagen
                  </p>
                  <p className="text-2xl font-bold">{predictions.length}</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Durchschnittliche Konfidenz
                  </p>
                  <p className="text-2xl font-bold">
                    {insights.length > 0 
                      ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100)
                      : 0}%
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">KI-Insights</TabsTrigger>
          <TabsTrigger value="predictions">Vorhersagen</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'ALL' ? 'Alle' : 
                 category === 'ANALYTICS' ? 'Analytics' :
                 category === 'FINANCE' ? 'Finance' :
                 category === 'PROJECT' ? 'Projekt' : category}
              </Button>
            ))}
          </div>

          {/* Insights List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${!insight.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(insight.type)}
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge variant={getSeverityColor(insight.severity)}>
                            {getSeverityIcon(insight.severity)}
                            {insight.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}% Konfidenz
                          </Badge>
                          {!insight.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(insight.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">
                        {insight.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>{insight.category}</span>
                          <span>•</span>
                          <span>{new Date(insight.createdAt).toLocaleDateString('de-DE')}</span>
                          {insight.isActionable && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                Handlungsbedarf
                              </Badge>
                            </>
                          )}
                        </div>
                        {insight.isRead && insight.actionTaken && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Bearbeitet
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredInsights.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Keine Insights vorhanden</p>
                    <p className="text-muted-foreground">
                      Das KI-System analysiert kontinuierlich Ihre Daten. 
                      Neue Insights werden hier angezeigt.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          <CardTitle className="text-lg">
                            {prediction.predictionType === 'CASHFLOW' ? 'Cashflow-Prognose' :
                             prediction.predictionType === 'PROJECT_COMPLETION' ? 'Projektabschluss' :
                             prediction.predictionType === 'RISK_SCORE' ? 'Risiko-Score' :
                             prediction.predictionType}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">
                          {Math.round(prediction.confidence * 100)}% Konfidenz
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Vorhergesagter Wert
                          </p>
                          <p className="text-2xl font-bold">
                            {prediction.predictionType === 'CASHFLOW' 
                              ? `€${prediction.predictedValue.toLocaleString('de-DE')}`
                              : prediction.predictedValue.toLocaleString('de-DE')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Zieldatum
                          </p>
                          <p className="text-lg font-medium">
                            {new Date(prediction.targetDate).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <Badge variant={prediction.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            <Clock className="w-3 h-3 mr-1" />
                            {prediction.status === 'ACTIVE' ? 'Aktiv' : 'Abgeschlossen'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {predictions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Keine Vorhersagen vorhanden</p>
                    <p className="text-muted-foreground">
                      Das KI-System erstellt Vorhersagen basierend auf Ihren Geschäftsdaten.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
