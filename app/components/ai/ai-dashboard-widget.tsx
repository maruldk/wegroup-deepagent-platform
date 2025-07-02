
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  timestamp: string;
  actionable: boolean;
}

interface AIDashboardWidgetProps {
  title?: string;
  category?: string;
  showActions?: boolean;
  compact?: boolean;
}

export function AIDashboardWidget({ 
  title = "AI-Insights", 
  category,
  showActions = true,
  compact = false 
}: AIDashboardWidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const generateMockInsights = (): AIInsight[] => {
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'prediction',
        title: 'Umsatz-Prognose Q4',
        description: 'Basierend auf aktuellen Trends wird der Umsatz um 15% steigen',
        confidence: 0.87,
        impact: 'high',
        category: 'sales',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '2',
        type: 'recommendation',
        title: 'Lead-Priorität',
        description: 'Enterprise-Leads zeigen 40% höhere Conversion-Rate',
        confidence: 0.93,
        impact: 'high',
        category: 'crm',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '3',
        type: 'alert',
        title: 'Anomalie erkannt',
        description: 'Ungewöhnlicher Rückgang der Website-Conversion',
        confidence: 0.76,
        impact: 'medium',
        category: 'marketing',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '4',
        type: 'optimization',
        title: 'Prozess-Optimierung',
        description: 'Automatisierung kann 30% Zeit bei HR-Prozessen sparen',
        confidence: 0.82,
        impact: 'medium',
        category: 'hr',
        timestamp: new Date().toISOString(),
        actionable: true
      }
    ];

    return category 
      ? mockInsights.filter(insight => insight.category === category)
      : mockInsights;
  };

  const refreshInsights = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setInsights(generateMockInsights());
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshInsights();
  }, [category]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Target className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction': return 'bg-blue-500';
      case 'recommendation': return 'bg-green-500';
      case 'alert': return 'bg-orange-500';
      case 'optimization': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.slice(0, 2).map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <div className={`h-2 w-2 rounded-full ${getInsightColor(insight.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{insight.title}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(insight.confidence * 100)}% sicher
                </p>
              </div>
            </motion.div>
          ))}
          {showActions && (
            <Button variant="outline" size="sm" className="w-full mt-2">
              Alle anzeigen
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              {title}
            </CardTitle>
            <CardDescription>
              KI-gestützte Erkenntnisse und Empfehlungen
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
            {showActions && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshInsights}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getInsightColor(insight.type)} text-white`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactColor(insight.impact)} className="text-xs">
                          {insight.impact}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Vertrauen:</span>
                        <Progress 
                          value={insight.confidence * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-xs font-medium">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      {insight.actionable && showActions && (
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Aktion
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showActions && !loading && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailanalyse
            </Button>
            <Button variant="default" className="flex-1">
              <Brain className="h-4 w-4 mr-2" />
              KI-Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
