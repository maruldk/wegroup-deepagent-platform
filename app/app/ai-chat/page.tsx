
import { Metadata } from 'next';
import { AIChat } from '@/components/ai/ai-chat';
import { AIInsightsDashboard } from '@/components/ai/ai-insights-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  BarChart3, 
  TrendingUp,
  Zap,
  Users,
  Target
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'KI-Assistent | weGROUP DeepAgent',
  description: 'Intelligenter KI-Assistent mit modulspezifischen Chat-Funktionen und AI-Insights für Analytics, Finance und Projektmanagement.',
};

export default function AIChatPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-bold">KI-Assistent</h1>
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Intelligente Unterstützung für alle Geschäftsprozesse mit modulspezifischen KI-Experten
          </p>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-indigo-500" />
              <div>
                <h3 className="font-semibold">Smart Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Kontextueller AI-Chat für alle Module
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Analytics AI</h3>
                <p className="text-sm text-muted-foreground">
                  Predictive Analytics & Insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Finance AI</h3>
                <p className="text-sm text-muted-foreground">
                  Cashflow-Prognosen & Fraud Detection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Project AI</h3>
                <p className="text-sm text-muted-foreground">
                  Ressourcen-Optimierung & Zeitschätzung
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden lg:inline">Allgemeiner Chat</span>
            <span className="lg:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline">Analytics AI</span>
            <span className="lg:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden lg:inline">Finance AI</span>
            <span className="lg:hidden">Finance</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Project AI</span>
            <span className="lg:hidden">Project</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden lg:inline">AI-Insights</span>
            <span className="lg:hidden">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Allgemeiner KI-Assistent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AIChat module="GENERAL" />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Empfohlene Fragen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                        <p className="text-sm font-medium">📊 Wie ist die aktuelle Geschäftslage?</p>
                        <p className="text-xs text-muted-foreground">Überblick über alle Module</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                        <p className="text-sm font-medium">💡 Welche Optimierungen sind möglich?</p>
                        <p className="text-xs text-muted-foreground">KI-Verbesserungsvorschläge</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                        <p className="text-sm font-medium">⚠️ Gibt es kritische Risiken?</p>
                        <p className="text-xs text-muted-foreground">Risiko-Assessment</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                        <p className="text-sm font-medium">📈 Wie sind die Zukunftsprognosen?</p>
                        <p className="text-xs text-muted-foreground">Predictive Analytics</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Analytics KI-Spezialist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AIChat 
                    module="ANALYTICS" 
                    context={{ focus: 'analytics', features: ['predictive_analytics', 'trend_analysis', 'anomaly_detection'] }}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analytics-Fragen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <p className="text-sm font-medium">📊 Erstelle eine Umsatz-Prognose für Q2</p>
                        <p className="text-xs text-muted-foreground">Predictive Analytics</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <p className="text-sm font-medium">🔍 Analysiere Kundenverhalten-Trends</p>
                        <p className="text-xs text-muted-foreground">Trend-Analyse</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <p className="text-sm font-medium">⚡ Erkenne Anomalien in den Daten</p>
                        <p className="text-xs text-muted-foreground">Anomalie-Erkennung</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <p className="text-sm font-medium">📈 Optimiere Dashboard-Performance</p>
                        <p className="text-xs text-muted-foreground">Dashboard-Optimierung</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Finance KI-Spezialist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AIChat 
                    module="FINANCE" 
                    context={{ focus: 'finance', features: ['cashflow_prediction', 'fraud_detection', 'budget_optimization'] }}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Finance-Fragen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                        <p className="text-sm font-medium">💰 Erstelle Cashflow-Prognose für 6 Monate</p>
                        <p className="text-xs text-muted-foreground">Liquiditäts-Planung</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                        <p className="text-sm font-medium">🛡️ Prüfe verdächtige Transaktionen</p>
                        <p className="text-xs text-muted-foreground">Fraud Detection</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                        <p className="text-sm font-medium">📊 Optimiere Budget-Allokation</p>
                        <p className="text-xs text-muted-foreground">Budget-Optimierung</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                        <p className="text-sm font-medium">🔄 Automatisiere Rechnungsverarbeitung</p>
                        <p className="text-xs text-muted-foreground">OCR + KI</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Project KI-Spezialist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AIChat 
                    module="PROJECT" 
                    context={{ focus: 'project', features: ['resource_optimization', 'timeline_prediction', 'risk_assessment'] }}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Project-Fragen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                        <p className="text-sm font-medium">👥 Optimiere Team-Ressourcen</p>
                        <p className="text-xs text-muted-foreground">Ressourcen-Planung</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                        <p className="text-sm font-medium">⏱️ Schätze Projektlaufzeiten</p>
                        <p className="text-xs text-muted-foreground">Timeline-Vorhersage</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                        <p className="text-sm font-medium">⚠️ Bewerte Projektrisiken</p>
                        <p className="text-xs text-muted-foreground">Risiko-Assessment</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                        <p className="text-sm font-medium">🎯 Optimiere Task-Priorisierung</p>
                        <p className="text-xs text-muted-foreground">Smart Scheduling</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsightsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
