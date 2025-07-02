
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIRecommendations } from '@/components/ai/ai-recommendations';
import { AIDashboardWidget } from '@/components/ai/ai-dashboard-widget';

interface InsightCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  count: number;
}

interface AIInsight {
  id: string;
  category: string;
  type: 'market_trend' | 'customer_behavior' | 'sales_opportunity' | 'risk_alert' | 'process_optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  dataPoints: string[];
  recommendations: string[];
  estimatedValue?: number;
  timeframe: string;
  created: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [categories, setCategories] = useState<InsightCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'confidence' | 'impact' | 'urgency' | 'created'>('confidence');

  const generateMockCategories = (): InsightCategory[] => {
    return [
      {
        id: 'all',
        name: 'Alle Insights',
        description: 'Alle verfügbaren KI-Erkenntnisse',
        icon: Brain,
        color: 'bg-blue-500',
        count: 23
      },
      {
        id: 'sales',
        name: 'Sales & Revenue',
        description: 'Verkaufs- und Umsatz-Insights',
        icon: DollarSign,
        color: 'bg-green-500',
        count: 8
      },
      {
        id: 'customers',
        name: 'Kunden-Verhalten',
        description: 'Kundenanalyse und -verhalten',
        icon: Users,
        color: 'bg-purple-500',
        count: 6
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Marketing-Effektivität und -Trends',
        icon: Target,
        color: 'bg-orange-500',
        count: 5
      },
      {
        id: 'operations',
        name: 'Operations',
        description: 'Betriebsabläufe und Effizienz',
        icon: TrendingUp,
        color: 'bg-blue-600',
        count: 4
      }
    ];
  };

  const generateMockInsights = (): AIInsight[] => {
    return [
      {
        id: '1',
        category: 'sales',
        type: 'sales_opportunity',
        title: 'Untapped Enterprise Market Potential',
        description: 'Analyse zeigt erhebliches ungenutztes Potenzial im Enterprise-Segment mit 67% höherer Conversion-Rate als aktuelle Zielgruppe.',
        confidence: 0.94,
        impact: 'high',
        urgency: 'high',
        dataPoints: [
          'Enterprise-Kunden zeigen 67% höhere Conversion-Rate',
          'Durchschnittlicher Deal-Wert 3.2x höher als SMB',
          'Kürzere Sales-Zyklen bei Fortune 500 Unternehmen',
          'Nur 23% des TAM im Enterprise-Bereich erschlossen'
        ],
        recommendations: [
          'Dedicated Enterprise Sales Team aufbauen',
          'Enterprise-spezifische Features entwickeln',
          'Strategic Account Management implementieren',
          'Executive-Level Outreach-Kampagne starten'
        ],
        estimatedValue: 2400000,
        timeframe: '6-12 Monate',
        created: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        category: 'customers',
        type: 'customer_behavior',
        title: 'Early Warning: Customer Churn Indicators',
        description: 'KI-Modell identifiziert 34 Kunden mit hohem Churn-Risiko basierend auf Nutzungsmustern und Support-Interaktionen.',
        confidence: 0.87,
        impact: 'high',
        urgency: 'critical',
        dataPoints: [
          '34 Kunden mit >80% Churn-Wahrscheinlichkeit',
          'Durchschnittlich 45% Rückgang der Platform-Nutzung',
          'Anstieg der Support-Tickets um 156%',
          'Verzögerte Rechnungsbegleichung als Indikator'
        ],
        recommendations: [
          'Sofortige Intervention bei High-Risk Kunden',
          'Personalisierte Retention-Kampagne starten',
          'Success Manager Calls within 48h',
          'Spezielle Angebote oder Feature-Demos anbieten'
        ],
        estimatedValue: -850000,
        timeframe: 'Sofort - 30 Tage',
        created: '2024-01-14T16:45:00Z'
      },
      {
        id: '3',
        category: 'marketing',
        type: 'market_trend',
        title: 'Healthcare Sector Surge',
        description: 'Signifikanter Anstieg der Nachfrage im Healthcare-Sektor um 156% in den letzten 3 Monaten. Regulatorische Änderungen treiben Digitalisierung.',
        confidence: 0.81,
        impact: 'medium',
        urgency: 'medium',
        dataPoints: [
          '156% Anstieg der Healthcare-Anfragen',
          'Neue GDPR-ähnliche Regulations in der EU',
          'Venture Capital Investment +78% in HealthTech',
          'Konkurrenten noch nicht in diesem Segment aktiv'
        ],
        recommendations: [
          'Healthcare-Compliance Features priorisieren',
          'HIPAA/GDPR Zertifizierung anstreben',
          'Healthcare-spezifische Case Studies entwickeln',
          'Partnerships mit HealthTech-Unternehmen'
        ],
        estimatedValue: 1200000,
        timeframe: '3-6 Monate',
        created: '2024-01-13T09:15:00Z'
      },
      {
        id: '4',
        category: 'operations',
        type: 'process_optimization',
        title: 'Lead Qualification Automation Opportunity',
        description: 'Automatisierung der Lead-Qualifizierung kann 47% der manuellen Arbeit einsparen und Conversion-Rate um 23% steigern.',
        confidence: 0.89,
        impact: 'medium',
        urgency: 'low',
        dataPoints: [
          '47% Zeitersparnis bei manueller Lead-Qualifizierung',
          '23% höhere Conversion durch konsistente Bewertung',
          'Reduzierung von Follow-up Zeit um 2.3 Tage',
          'Sales Team kann sich auf High-Value Activities fokussieren'
        ],
        recommendations: [
          'ML-basiertes Lead-Scoring implementieren',
          'Automatische Lead-Routing einführen',
          'Sales Team für neue Prozesse trainieren',
          'A/B Test für 30% der Leads durchführen'
        ],
        estimatedValue: 450000,
        timeframe: '2-4 Monate',
        created: '2024-01-12T14:20:00Z'
      },
      {
        id: '5',
        category: 'sales',
        type: 'risk_alert',
        title: 'Q4 Revenue Target Risk',
        description: 'Aktuelle Pipeline-Analyse zeigt 34% Wahrscheinlichkeit, Q4-Umsatzziele zu verfehlen. Frühzeitige Intervention erforderlich.',
        confidence: 0.76,
        impact: 'high',
        urgency: 'high',
        dataPoints: [
          'Pipeline-Wert 23% unter Ziel für Q4',
          'Durchschnittliche Deal-Close-Rate gesunken auf 67%',
          'Sales-Zyklus verlängert um 12 Tage',
          'Top 3 Deals mit Verzögerungsrisiko identifiziert'
        ],
        recommendations: [
          'Intensive Pipeline-Review mit Sales Management',
          'Accelerated Sales Process für Top Deals',
          'Zusätzliche Ressourcen für kritische Deals',
          'Backup-Opportunities aktivieren'
        ],
        estimatedValue: -1800000,
        timeframe: 'Sofort - 60 Tage',
        created: '2024-01-11T11:00:00Z'
      }
    ];
  };

  const refreshData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCategories(generateMockCategories());
    setInsights(generateMockInsights());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'market_trend': return <TrendingUp className="h-4 w-4" />;
      case 'customer_behavior': return <Users className="h-4 w-4" />;
      case 'sales_opportunity': return <Target className="h-4 w-4" />;
      case 'risk_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'process_optimization': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'market_trend': return 'bg-blue-500';
      case 'customer_behavior': return 'bg-purple-500';
      case 'sales_opportunity': return 'bg-green-500';
      case 'risk_alert': return 'bg-red-500';
      case 'process_optimization': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: AIInsight['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatCurrency = (value: number) => {
    const isNegative = value < 0;
    const absoluteValue = Math.abs(value);
    return `${isNegative ? '-' : ''}€${(absoluteValue / 1000000).toFixed(1)}M`;
  };

  const filteredInsights = insights
    .filter(insight => selectedCategory === 'all' || insight.category === selectedCategory)
    .filter(insight => 
      searchQuery === '' || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return b.confidence - a.confidence;
        case 'impact': 
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'urgency':
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        case 'created': return new Date(b.created).getTime() - new Date(a.created).getTime();
        default: return 0;
      }
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            KI-Erkenntnisse & Insights
          </h1>
          <p className="text-muted-foreground">
            Detaillierte Analyse und actionable Insights aus Ihren Geschäftsdaten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Zeitraum
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Insights durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="confidence">Nach Vertrauen</option>
                <option value="impact">Nach Impact</option>
                <option value="urgency">Nach Dringlichkeit</option>
                <option value="created">Nach Datum</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <h3 className="font-semibold">Kategorien</h3>
          {categories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${category.color} text-white`}>
                      <category.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{category.name}</h4>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* AI Widget */}
          <AIDashboardWidget 
            title="Quick Insights"
            compact={true}
            showActions={false}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
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
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
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
                              <h3 className="font-semibold">{insight.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getUrgencyColor(insight.urgency)} className="text-xs">
                                  {insight.urgency}
                                </Badge>
                                <Badge variant={getImpactColor(insight.impact)} className="text-xs">
                                  {insight.impact} Impact
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(insight.created).toLocaleDateString('de-DE')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Vertrauen</div>
                            <div className="text-lg font-bold">
                              {Math.round(insight.confidence * 100)}%
                            </div>
                            {insight.estimatedValue && (
                              <div className={`text-sm font-medium ${
                                insight.estimatedValue < 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(insight.estimatedValue)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground">{insight.description}</p>

                        {/* Data Points */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Wichtige Datenpunkte:</h4>
                          <ul className="space-y-1">
                            {insight.dataPoints.map((point, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="h-1 w-1 bg-blue-500 rounded-full" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Empfohlene Maßnahmen:</h4>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-blue-500" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Zeitrahmen: {insight.timeframe}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="default" size="sm">
                              <Target className="h-4 w-4 mr-2" />
                              Aktion planen
                            </Button>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {filteredInsights.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="font-medium mb-2">Keine Insights gefunden</h4>
                <p className="text-sm text-muted-foreground">
                  Versuchen Sie andere Suchbegriffe oder Filter-Einstellungen.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Section */}
          <div className="pt-8">
            <AIRecommendations 
              category={selectedCategory === 'all' ? undefined : selectedCategory}
              limit={3}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
