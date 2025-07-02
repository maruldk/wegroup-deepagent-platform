
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  X,
  Lightbulb,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AIRecommendation {
  id: string;
  type: 'lead_prioritization' | 'sales_strategy' | 'customer_retention' | 'process_optimization' | 'market_opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  category: string;
  actionItems: string[];
  estimatedROI?: number;
  timeToImplement?: string;
  requiredResources?: string[];
  relatedData?: any;
  created: string;
}

interface AIRecommendationsProps {
  category?: string;
  limit?: number;
  showFeedback?: boolean;
  compact?: boolean;
}

export function AIRecommendations({
  category,
  limit = 5,
  showFeedback = true,
  compact = false
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const generateMockRecommendations = (): AIRecommendation[] => {
    const mockRecommendations: AIRecommendation[] = [
      {
        id: '1',
        type: 'lead_prioritization',
        title: 'Fokus auf Enterprise-Leads',
        description: 'Enterprise-Kunden zeigen 40% höhere Conversion-Rate und 3x höheren Lifetime Value',
        confidence: 0.92,
        impact: 'high',
        priority: 1,
        category: 'sales',
        actionItems: [
          'Identifiziere Unternehmen mit 100+ Mitarbeitern',
          'Erstelle Enterprise-spezifische Pitch-Decks',
          'Plane direkte Outreach-Kampagne'
        ],
        estimatedROI: 2.4,
        timeToImplement: '2-3 Wochen',
        requiredResources: ['Sales Team', 'Marketing Materials'],
        created: new Date().toISOString()
      },
      {
        id: '2',
        type: 'customer_retention',
        title: 'Proaktive Kundenbetreuung',
        description: 'Kunden mit geringer Aktivität in den letzten 30 Tagen haben 65% Churn-Risiko',
        confidence: 0.87,
        impact: 'high',
        priority: 2,
        category: 'retention',
        actionItems: [
          'Identifiziere inaktive Kunden',
          'Erstelle personalisierte Reaktivierungs-E-Mails',
          'Biete exklusive Features oder Rabatte an'
        ],
        estimatedROI: 1.8,
        timeToImplement: '1 Woche',
        requiredResources: ['Customer Success Team', 'Marketing Automation'],
        created: new Date().toISOString()
      },
      {
        id: '3',
        type: 'market_opportunity',
        title: 'Healthcare-Sektor Expansion',
        description: 'Healthcare-Branche zeigt 25% Wachstum und hohe Nachfrage nach digitalen Lösungen',
        confidence: 0.78,
        impact: 'medium',
        priority: 3,
        category: 'strategy',
        actionItems: [
          'Analysiere Healthcare-spezifische Compliance-Anforderungen',
          'Entwickle Healthcare-fokussierte Produktfeatures',
          'Knüpfe Kontakte zu Healthcare-Entscheidern'
        ],
        estimatedROI: 3.2,
        timeToImplement: '3-6 Monate',
        requiredResources: ['Product Team', 'Compliance Specialist', 'Business Development'],
        created: new Date().toISOString()
      },
      {
        id: '4',
        type: 'process_optimization',
        title: 'Automatisierung der Lead-Qualifizierung',
        description: 'KI-basierte Lead-Scoring kann 45% Zeit bei der Qualifizierung sparen',
        confidence: 0.85,
        impact: 'medium',
        priority: 4,
        category: 'efficiency',
        actionItems: [
          'Implementiere automatisches Lead-Scoring',
          'Definiere Schwellenwerte für Qualifizierung',
          'Trainiere Sales-Team auf neue Prozesse'
        ],
        estimatedROI: 1.6,
        timeToImplement: '4-6 Wochen',
        requiredResources: ['Development Team', 'Sales Operations'],
        created: new Date().toISOString()
      },
      {
        id: '5',
        type: 'sales_strategy',
        title: 'Cross-Selling Opportunities',
        description: 'Bestehende Kunden zeigen 30% Interesse an zusätzlichen Services',
        confidence: 0.81,
        impact: 'medium',
        priority: 5,
        category: 'sales',
        actionItems: [
          'Identifiziere Cross-Selling-geeignete Kunden',
          'Erstelle Service-Bundles',
          'Plane Account-Manager Gespräche'
        ],
        estimatedROI: 2.1,
        timeToImplement: '2-4 Wochen',
        requiredResources: ['Account Managers', 'Product Marketing'],
        created: new Date().toISOString()
      }
    ];

    return mockRecommendations
      .filter(rec => !category || rec.category === category)
      .filter(rec => !dismissedIds.has(rec.id))
      .slice(0, limit);
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRecommendations(generateMockRecommendations());
      setLoading(false);
    }, 1000);
  }, [category, limit, dismissedIds]);

  const handleFeedback = (recommendationId: string, liked: boolean) => {
    console.log(`Feedback for ${recommendationId}: ${liked ? 'liked' : 'disliked'}`);
    // Here you would typically send feedback to your AI service
  };

  const dismissRecommendation = (recommendationId: string) => {
    setDismissedIds(prev => new Set(prev.add(recommendationId)));
  };

  const getTypeIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'lead_prioritization': return <Target className="h-4 w-4" />;
      case 'sales_strategy': return <TrendingUp className="h-4 w-4" />;
      case 'customer_retention': return <Users className="h-4 w-4" />;
      case 'process_optimization': return <Zap className="h-4 w-4" />;
      case 'market_opportunity': return <DollarSign className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'lead_prioritization': return 'bg-blue-500';
      case 'sales_strategy': return 'bg-green-500';
      case 'customer_retention': return 'bg-orange-500';
      case 'process_optimization': return 'bg-purple-500';
      case 'market_opportunity': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: AIRecommendation['impact']) => {
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
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            KI-Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {recommendations.slice(0, 2).map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2 rounded-lg bg-muted/50 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getTypeColor(rec.type)}`} />
                    <span className="text-xs font-medium">{rec.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(rec.confidence * 100)}% sicher
                    </span>
                    <Badge variant={getImpactColor(rec.impact)} className="text-xs">
                      {rec.impact}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                Alle anzeigen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            KI-Empfehlungen
          </h3>
          <p className="text-sm text-muted-foreground">
            Personalisierte Empfehlungen basierend auf Ihren Daten
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {recommendations.length} Empfehlungen
        </Badge>
      </div>

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
        <AnimatePresence>
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getTypeColor(recommendation.type)} text-white`}>
                        {getTypeIcon(recommendation.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{recommendation.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getImpactColor(recommendation.impact)} className="text-xs">
                            {recommendation.impact} Impact
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-muted-foreground">
                              Priorität {recommendation.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissRecommendation(recommendation.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>

                  {/* Confidence Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Vertrauen:</span>
                      <span className="font-medium">
                        {Math.round(recommendation.confidence * 100)}%
                      </span>
                    </div>
                    <Progress value={recommendation.confidence * 100} className="h-2" />
                  </div>

                  {/* ROI and Timeline */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {recommendation.estimatedROI && (
                      <div>
                        <span className="text-muted-foreground">Erwarteter ROI:</span>
                        <p className="font-medium text-green-600">
                          {recommendation.estimatedROI}x
                        </p>
                      </div>
                    )}
                    {recommendation.timeToImplement && (
                      <div>
                        <span className="text-muted-foreground">Umsetzung:</span>
                        <p className="font-medium">{recommendation.timeToImplement}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Items */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Empfohlene Maßnahmen:</h5>
                    <ul className="space-y-1">
                      {recommendation.actionItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-blue-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required Resources */}
                  {recommendation.requiredResources && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Benötigte Ressourcen:</h5>
                      <div className="flex gap-1 flex-wrap">
                        {recommendation.requiredResources.map((resource, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="default" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Umsetzen
                      </Button>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                    
                    {showFeedback && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(recommendation.id, true)}
                          className="p-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(recommendation.id, false)}
                          className="p-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {recommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="font-medium mb-2">Keine Empfehlungen verfügbar</h4>
            <p className="text-sm text-muted-foreground">
              Die KI analysiert Ihre Daten und wird in Kürze personalisierte Empfehlungen bereitstellen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
