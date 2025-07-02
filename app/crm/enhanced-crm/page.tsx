
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Search, 
  Filter, 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Star,
  Phone,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AIDashboardWidget } from '@/components/ai/ai-dashboard-widget';
import { AIRecommendations } from '@/components/ai/ai-recommendations';
import { AISearchComponent } from '@/components/ai/ai-search-component';
import { SmartForm } from '@/components/ai/smart-form';
import { AIInsightsPanel } from '@/components/ai/ai-insights-panel';

interface AILeadScore {
  leadId: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  score: number;
  confidence: number;
  factors: string[];
  nextAction: string;
  estimatedValue: number;
  conversionProbability: number;
  lastInteraction: string;
  source: string;
}

interface CustomerInsight {
  customerId: string;
  name: string;
  company: string;
  churnRisk: number;
  lifetimeValue: number;
  healthScore: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  predictedActions: string[];
  riskFactors: string[];
  opportunities: string[];
}

export default function EnhancedCRMPage() {
  const [aiLeads, setAiLeads] = useState<AILeadScore[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('ai-leads');

  const generateMockAILeads = (): AILeadScore[] => {
    return [
      {
        leadId: 'lead-001',
        name: 'Michael Schmidt',
        company: 'TechCorp Solutions GmbH',
        email: 'michael.schmidt@techcorp.de',
        phone: '+49 123 456 7890',
        score: 92,
        confidence: 0.89,
        factors: [
          'Enterprise-Größe (500+ Mitarbeiter)',
          'Tech-Branche (High-fit)',
          'Mehrfache Website-Besuche',
          'C-Level Kontakt',
          'Budget-Signale erkannt'
        ],
        nextAction: 'Direkter Anruf innerhalb 24h',
        estimatedValue: 85000,
        conversionProbability: 0.73,
        lastInteraction: '2024-01-15T09:30:00Z',
        source: 'LinkedIn Campaign'
      },
      {
        leadId: 'lead-002',
        name: 'Sarah Weber',
        company: 'InnovateMed Healthcare',
        email: 'sarah.weber@innovatemed.com',
        score: 87,
        confidence: 0.91,
        factors: [
          'Healthcare-Sektor (Wachstumsmarkt)',
          'Compliance-Keywords in Anfrage',
          'Konkrete Projektbeschreibung',
          'Budget-Range angegeben',
          'Zeitdruck erwähnt'
        ],
        nextAction: 'Demo-Termin vorschlagen',
        estimatedValue: 125000,
        conversionProbability: 0.68,
        lastInteraction: '2024-01-14T16:45:00Z',
        source: 'Website Form'
      },
      {
        leadId: 'lead-003',
        name: 'Thomas Müller',
        company: 'RetailMax Deutschland',
        email: 'thomas.mueller@retailmax.de',
        score: 78,
        confidence: 0.82,
        factors: [
          'Retail-Erfahrung vorhanden',
          'Skalierung als Ziel genannt',
          'Aktuelle Lösung unzufrieden',
          'Empfehlung durch Partner',
          'Q1 Implementierung gewünscht'
        ],
        nextAction: 'ROI-Kalkulation zusenden',
        estimatedValue: 45000,
        conversionProbability: 0.61,
        lastInteraction: '2024-01-13T11:20:00Z',
        source: 'Partner Referral'
      },
      {
        leadId: 'lead-004',
        name: 'Lisa Chen',
        company: 'FinTech Innovations',
        email: 'lisa.chen@fintech-innov.com',
        score: 84,
        confidence: 0.86,
        factors: [
          'FinTech-Expertise erforderlich',
          'Compliance-Anforderungen hoch',
          'Internationale Expansion geplant',
          'Mehrere Stakeholder involviert',
          'Proof of Concept interesse'
        ],
        nextAction: 'Technical Deep-Dive Meeting',
        estimatedValue: 150000,
        conversionProbability: 0.71,
        lastInteraction: '2024-01-12T14:15:00Z',
        source: 'Conference Lead'
      }
    ];
  };

  const generateMockCustomerInsights = (): CustomerInsight[] => {
    return [
      {
        customerId: 'cust-001',
        name: 'Maximilian König',
        company: 'König & Partner Consulting',
        churnRisk: 0.23,
        lifetimeValue: 245000,
        healthScore: 85,
        engagementTrend: 'stable',
        predictedActions: [
          'Vertragsverlängerung wahrscheinlich',
          'Upselling-Opportunity für Premium Features',
          'Referral-Potential sehr hoch'
        ],
        riskFactors: [
          'Leichte Reduktion der Login-Häufigkeit',
          'Support-Tickets leicht gestiegen'
        ],
        opportunities: [
          'Expansion in neue Abteilungen',
          'Add-on Services verkaufen',
          'Case Study entwickeln'
        ]
      },
      {
        customerId: 'cust-002',
        name: 'Jennifer Adams',
        company: 'Global Manufacturing Corp',
        churnRisk: 0.67,
        lifetimeValue: 180000,
        healthScore: 42,
        engagementTrend: 'decreasing',
        predictedActions: [
          'Sofortige Intervention erforderlich',
          'Success Manager Call innerhalb 48h',
          'Retention-Angebot vorbereiten'
        ],
        riskFactors: [
          'Login-Häufigkeit um 65% gesunken',
          'Hauptansprechpartner gewechselt',
          'Lizenz-Downgrade angefragt',
          'Konkurrenz-Gespräche vermutet'
        ],
        opportunities: [
          'Neue Ansprechpartner onboarden',
          'Value-added Services anbieten',
          'Strategische Partnership diskutieren'
        ]
      },
      {
        customerId: 'cust-003',
        name: 'Robert Schmidt',
        company: 'Schmidt Digital Agency',
        churnRisk: 0.15,
        lifetimeValue: 95000,
        healthScore: 92,
        engagementTrend: 'increasing',
        predictedActions: [
          'Upselling in den nächsten 60 Tagen',
          'Referral-Request stellen',
          'Success Story dokumentieren'
        ],
        riskFactors: [],
        opportunities: [
          'Premium-Tier upgrade',
          'Multi-Jahr Vertrag anbieten',
          'White-Label Partnership'
        ]
      }
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiLeads(generateMockAILeads());
      setCustomerInsights(generateMockCustomerInsights());
      setLoading(false);
    };

    loadData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getChurnRiskColor = (risk: number) => {
    if (risk >= 0.6) return 'text-red-600 bg-red-100';
    if (risk >= 0.3) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getEngagementIcon = (trend: CustomerInsight['engagementTrend']) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    }
  };

  const smartFormFields = [
    {
      name: 'name',
      type: 'text' as const,
      label: 'Name',
      placeholder: 'Max Mustermann',
      required: true
    },
    {
      name: 'company',
      type: 'text' as const,
      label: 'Unternehmen',
      placeholder: 'Mustermann GmbH',
      required: true
    },
    {
      name: 'email',
      type: 'email' as const,
      label: 'E-Mail',
      placeholder: 'max@mustermann.de',
      required: true
    },
    {
      name: 'phone',
      type: 'text' as const,
      label: 'Telefon',
      placeholder: '+49 123 456 789'
    },
    {
      name: 'industry',
      type: 'text' as const,
      label: 'Branche',
      placeholder: 'Technology'
    },
    {
      name: 'notes',
      type: 'textarea' as const,
      label: 'Notizen',
      placeholder: 'Interesse an Enterprise-Lösung...'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-500" />
              Enhanced CRM mit KI
            </h1>
            <p className="text-muted-foreground">Intelligente Kundenbeziehungsverwaltung mit AI-Insights</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Enhanced CRM mit KI
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Intelligente Kundenbeziehungsverwaltung mit AI-gestützten Insights und Empfehlungen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            AI-Filter
          </Button>
          <Button variant="default">
            <Zap className="h-4 w-4 mr-2" />
            AI-Analyse
          </Button>
        </div>
      </div>

      {/* AI Search */}
      <div className="max-w-2xl">
        <AISearchComponent 
          placeholder="Intelligente CRM-Suche mit KI..."
          categories={['contact', 'company', 'deal', 'opportunity']}
          showAIInsights={true}
          maxResults={6}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI-Lead-Score</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.3</div>
              <p className="text-xs text-muted-foreground">
                Durchschnittlicher AI-Score der Top-Leads
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn-Risiko</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                Kunden mit hohem Abwanderungsrisiko
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion-Rate</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-xs text-muted-foreground">
                AI-prognostizierte Conversion-Rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline-Wert</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€405K</div>
              <p className="text-xs text-muted-foreground">
                AI-bewertete Pipeline-Opportunities
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-leads">AI-Lead-Scoring</TabsTrigger>
          <TabsTrigger value="customer-insights">Kunden-Insights</TabsTrigger>
          <TabsTrigger value="smart-forms">Smart Forms</TabsTrigger>
          <TabsTrigger value="recommendations">AI-Empfehlungen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-leads" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top AI-bewertete Leads
                </h3>
                <Badge variant="secondary">Live-Scoring</Badge>
              </div>

              {aiLeads.map((lead, index) => (
                <motion.div
                  key={lead.leadId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{lead.name}</h4>
                            <p className="text-sm text-muted-foreground">{lead.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{lead.email}</span>
                              {lead.phone && (
                                <>
                                  <Phone className="h-3 w-3 text-gray-400 ml-2" />
                                  <span className="text-xs text-gray-600">{lead.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                              getScoreColor(lead.score)
                            )}>
                              <Brain className="h-3 w-3 mr-1" />
                              {lead.score}/100
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(lead.confidence * 100)}% Vertrauen
                            </div>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Est. Wert:</span>
                            <div className="font-medium">€{lead.estimatedValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Conversion:</span>
                            <div className="font-medium">{Math.round(lead.conversionProbability * 100)}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quelle:</span>
                            <div className="font-medium">{lead.source}</div>
                          </div>
                        </div>

                        {/* Factors */}
                        <div>
                          <h5 className="text-sm font-medium mb-2">AI-Bewertungsfaktoren:</h5>
                          <div className="flex flex-wrap gap-1">
                            {lead.factors.slice(0, 3).map((factor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                            {lead.factors.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{lead.factors.length - 3} weitere
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Next Action */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              Empfohlene Aktion:
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 mt-1">{lead.nextAction}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Phone className="h-4 w-4 mr-2" />
                            Anrufen
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            E-Mail
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            Termin
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <AIDashboardWidget 
              title="Lead-Scoring Insights"
              category="crm"
              compact={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="customer-insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  AI-Kunden-Insights
                </h3>
                <Badge variant="secondary">Real-time</Badge>
              </div>

              {customerInsights.map((customer, index) => (
                <motion.div
                  key={customer.customerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{customer.name}</h4>
                            <p className="text-sm text-muted-foreground">{customer.company}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEngagementIcon(customer.engagementTrend)}
                            <span className="text-sm capitalize">{customer.engagementTrend}</span>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Health Score:</span>
                            <div className="font-medium">{customer.healthScore}/100</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Churn Risk:</span>
                            <div className={cn(
                              'font-medium px-2 py-1 rounded text-xs',
                              getChurnRiskColor(customer.churnRisk)
                            )}>
                              {Math.round(customer.churnRisk * 100)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">LTV:</span>
                            <div className="font-medium">€{customer.lifetimeValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="flex items-center gap-1">
                              {customer.churnRisk < 0.3 ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                              )}
                              <span className="text-xs">
                                {customer.churnRisk < 0.3 ? 'Healthy' : 'At Risk'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Predictions */}
                        <div>
                          <h5 className="text-sm font-medium mb-2">AI-Vorhersagen:</h5>
                          <ul className="space-y-1">
                            {customer.predictedActions.map((action, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-blue-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Risk Factors & Opportunities */}
                        <div className="grid grid-cols-2 gap-4">
                          {customer.riskFactors.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-red-600">Risikofaktoren:</h5>
                              <ul className="space-y-1">
                                {customer.riskFactors.slice(0, 2).map((risk, idx) => (
                                  <li key={idx} className="text-xs text-red-600">• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div>
                            <h5 className="text-sm font-medium mb-2 text-green-600">Opportunities:</h5>
                            <ul className="space-y-1">
                              {customer.opportunities.slice(0, 2).map((opp, idx) => (
                                <li key={idx} className="text-xs text-green-600">• {opp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {customer.churnRisk > 0.5 ? (
                            <Button size="sm" variant="destructive" className="flex-1">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Retention-Aktion
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Upselling
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="flex-1">
                            Kontaktieren
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <AIDashboardWidget 
              title="Customer Health Insights"
              category="customer"
              compact={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="smart-forms" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SmartForm
              title="Intelligentes Lead-Formular"
              description="KI-gestütztes Formular mit automatischen Vervollständigungen und Verbesserungsvorschlägen"
              fields={smartFormFields}
              onSubmit={(data) => {
                console.log('Form submitted:', data);
                // Handle form submission
              }}
              enableAISuggestions={true}
              enableAutoCompletion={true}
              showConfidenceScores={true}
            />

            <div className="space-y-6">
              <AIDashboardWidget 
                title="Form Insights"
                category="crm"
                compact={false}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Smart Form Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Completion Rate:</span>
                      <div className="font-medium">89.2%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">AI Suggestions:</span>
                      <div className="font-medium">156 angewandt</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    KI-Optimierungen haben die Conversion-Rate um 23% verbessert
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <AIRecommendations 
            category="sales"
            limit={5}
            showFeedback={true}
            compact={false}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AIInsightsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
