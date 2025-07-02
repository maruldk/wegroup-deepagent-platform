
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Brain, 
  AlertTriangle, 
  Shield,
  Zap,
  Target,
  CreditCard,
  FileText,
  Scan,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

interface FinancialInsight {
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'CASHFLOW' | 'RISK' | 'OPTIMIZATION' | 'FRAUD';
  value?: number;
  trend: 'up' | 'down' | 'stable';
}

interface CashflowPrediction {
  month: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

interface FraudAlert {
  id: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  timestamp: string;
  transactionId?: string;
}

export function AIEnhancedFinance() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [cashflowData, setCashflowData] = useState<CashflowPrediction[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [budgetOptimization, setBudgetOptimization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDocument, setProcessingDocument] = useState(false);

  useEffect(() => {
    fetchFinanceAIData();
  }, []);

  const fetchFinanceAIData = async () => {
    try {
      setLoading(true);
      
      // Generate AI finance analysis
      const response = await fetch('/api/ai/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'FINANCE_PROCESSING',
          data: { requestType: 'COMPREHENSIVE_ANALYSIS' },
          resourceType: 'FINANCE'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Mock comprehensive financial AI data
        setInsights([
          {
            title: 'Cashflow-Optimierung erkannt',
            description: 'Durch Anpassung der Zahlungsziele kann der Cashflow um 18% verbessert werden.',
            confidence: 0.91,
            impact: 'high',
            category: 'CASHFLOW',
            value: 18,
            trend: 'up'
          },
          {
            title: 'Betrugsverdacht: Ungewöhnliche Transaktion',
            description: 'Transaktion #TX-4429 weicht um 340% vom üblichen Muster ab.',
            confidence: 0.97,
            impact: 'high',
            category: 'FRAUD',
            trend: 'down'
          },
          {
            title: 'Budget-Einsparung möglich',
            description: 'In der Kategorie "Marketing" wurden 12% Einsparpotenzial identifiziert.',
            confidence: 0.84,
            impact: 'medium',
            category: 'OPTIMIZATION',
            value: 12,
            trend: 'down'
          },
          {
            title: 'Liquiditätsrisiko in Q2',
            description: 'Erhöhtes Liquiditätsrisiko ab Mai aufgrund saisonaler Faktoren.',
            confidence: 0.78,
            impact: 'high',
            category: 'RISK',
            trend: 'down'
          }
        ]);

        setCashflowData([
          { 
            month: 'Jan', 
            predicted: 125000, 
            confidence: 0.92,
            factors: ['Saisonalität', 'Recurring Revenue', 'Neue Kundenverträge']
          },
          { 
            month: 'Feb', 
            predicted: 138000, 
            confidence: 0.89,
            factors: ['Projektabschlüsse', 'Rechnungsstellung']
          },
          { 
            month: 'Mär', 
            predicted: 152000, 
            confidence: 0.85,
            factors: ['Quartalsziele', 'Marketingkampagne']
          },
          { 
            month: 'Apr', 
            predicted: 143000, 
            confidence: 0.81,
            factors: ['Saisonale Schwankung', 'Kundenzahlungen']
          },
          { 
            month: 'Mai', 
            predicted: 128000, 
            confidence: 0.78,
            factors: ['Liquiditätsengpass', 'Verzögerte Zahlungen']
          },
          { 
            month: 'Jun', 
            predicted: 165000, 
            confidence: 0.83,
            factors: ['Quartalsende', 'Neue Verträge']
          }
        ]);

        setFraudAlerts([
          {
            id: '1',
            title: 'Ungewöhnliche Transaktionsmuster',
            description: 'Multiple kleine Transaktionen innerhalb kurzer Zeit von derselben Quelle.',
            severity: 'HIGH',
            confidence: 0.94,
            timestamp: new Date().toISOString(),
            transactionId: 'TX-4429'
          },
          {
            id: '2',
            title: 'Auffällige Ausgabenkategorie',
            description: 'Ungewöhnlich hohe Ausgaben in Kategorie "Sonstiges" - 280% über Normal.',
            severity: 'MEDIUM',
            confidence: 0.76,
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ]);

        setBudgetOptimization([
          {
            category: 'Marketing',
            currentSpend: 15000,
            optimizedSpend: 13200,
            savings: 1800,
            confidence: 0.84,
            recommendation: 'Reduzierung der Printmedien-Ausgaben um 60%'
          },
          {
            category: 'IT Infrastructure',
            currentSpend: 8500,
            optimizedSpend: 7200,
            savings: 1300,
            confidence: 0.79,
            recommendation: 'Migration zu kostengünstigeren Cloud-Services'
          },
          {
            category: 'Office Supplies',
            currentSpend: 2400,
            optimizedSpend: 2100,
            savings: 300,
            confidence: 0.92,
            recommendation: 'Bulk-Bestellungen für häufig verwendete Artikel'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch finance AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async () => {
    setProcessingDocument(true);
    try {
      // Simulate OCR + AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add new insight for processed document
      const newInsight: FinancialInsight = {
        title: 'Dokument automatisch verarbeitet',
        description: 'Rechnung #INV-2024-0145 wurde erkannt und kategorisiert. Betrag: €2.847,50',
        confidence: 0.96,
        impact: 'medium',
        category: 'OPTIMIZATION',
        trend: 'up'
      };
      
      setInsights(prev => [newInsight, ...prev]);
    } catch (error) {
      console.error('Document processing failed:', error);
    } finally {
      setProcessingDocument(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CASHFLOW': return <TrendingUp className="w-4 h-4" />;
      case 'RISK': return <AlertTriangle className="w-4 h-4" />;
      case 'OPTIMIZATION': return <Target className="w-4 h-4" />;
      case 'FRAUD': return <Shield className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CASHFLOW': return 'text-green-500';
      case 'RISK': return 'text-red-500';
      case 'OPTIMIZATION': return 'text-blue-500';
      case 'FRAUD': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold">KI-Enhanced Finance</h2>
          <Badge variant="secondary" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={processDocument} 
            disabled={processingDocument}
            variant="outline"
            className="gap-2"
          >
            <Scan className={`w-4 h-4 ${processingDocument ? 'animate-spin' : ''}`} />
            {processingDocument ? 'Verarbeite...' : 'Dokument scannen'}
          </Button>
          <Button 
            onClick={fetchFinanceAIData} 
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.slice(0, 4).map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`${getCategoryColor(insight.category)}`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <Badge variant={getImpactColor(insight.impact)}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium text-sm mb-2">{insight.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {insight.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span>Konfidenz: {Math.round(insight.confidence * 100)}%</span>
                  {insight.value && (
                    <span className={`font-medium ${
                      insight.trend === 'up' ? 'text-green-600' : 
                      insight.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {insight.trend === 'down' ? '-' : '+'}{insight.value}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cashflow">Cashflow-Prognose</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="optimization">Budget-Optimierung</TabsTrigger>
          <TabsTrigger value="ocr">Dokumenten-AI</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                KI-Cashflow-Prognose (6 Monate)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Cashflow (€)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 11 } 
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`€${value?.toLocaleString('de-DE')}`, 'Prognose']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#60B5FF" 
                    fill="#60B5FF" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cashflowData.slice(0, 3).map((data, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{data.month}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    €{data.predicted.toLocaleString('de-DE')}
                  </div>
                  <Progress 
                    value={data.confidence * 100} 
                    className="mb-3"
                  />
                  <p className="text-sm text-muted-foreground mb-2">
                    Konfidenz: {Math.round(data.confidence * 100)}%
                  </p>
                  <div className="space-y-1">
                    {data.factors.map((factor, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <div className="space-y-4">
            {fraudAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  alert.severity === 'HIGH' ? 'border-l-red-500' :
                  alert.severity === 'MEDIUM' ? 'border-l-orange-500' : 'border-l-yellow-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${
                          alert.severity === 'HIGH' ? 'text-red-500' :
                          alert.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                        <CardTitle>{alert.title}</CardTitle>
                      </div>
                      <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Konfidenz: {Math.round(alert.confidence * 100)}%</span>
                        {alert.transactionId && (
                          <>
                            <span>•</span>
                            <span>ID: {alert.transactionId}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          Untersuchen
                        </Button>
                        <Button variant="outline" size="sm">
                          Ignorieren
                        </Button>
                      </div>
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
                <CardTitle>Budget-Optimierung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetOptimization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `€${value?.toLocaleString('de-DE')}`, 
                        name === 'currentSpend' ? 'Aktuell' : 'Optimiert'
                      ]}
                    />
                    <Bar dataKey="currentSpend" fill="#FF9149" name="Aktuell" />
                    <Bar dataKey="optimizedSpend" fill="#60B5FF" name="Optimiert" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Einsparungspotenzial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetOptimization.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.category}</h4>
                      <Badge variant="outline">
                        €{item.savings.toLocaleString('de-DE')} Ersparnis
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.recommendation}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Konfidenz: {Math.round(item.confidence * 100)}%</span>
                      <Button variant="outline" size="sm">
                        Anwenden
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Automatische Dokumentenerkennung (OCR + KI)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Scan className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Rechnungen & Belege automatisch verarbeiten
                </p>
                <p className="text-muted-foreground mb-4">
                  KI erkennt automatisch Beträge, Kategorien und Lieferanten
                </p>
                <Button 
                  onClick={processDocument} 
                  disabled={processingDocument}
                  className="gap-2"
                >
                  <Scan className={`w-4 h-4 ${processingDocument ? 'animate-spin' : ''}`} />
                  {processingDocument ? 'Verarbeite Dokument...' : 'Dokument hochladen'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-medium mb-1">Auto-Kategorisierung</h3>
                    <p className="text-sm text-muted-foreground">
                      95% Genauigkeit bei der automatischen Zuordnung
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <h3 className="font-medium mb-1">Schnelle Verarbeitung</h3>
                    <p className="text-sm text-muted-foreground">
                      Dokumente in unter 3 Sekunden verarbeitet
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <h3 className="font-medium mb-1">Smart-Matching</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatische Verknüpfung mit Lieferanten
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
