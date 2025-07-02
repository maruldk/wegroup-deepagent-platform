
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Send, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Zap,
  MessageSquare,
  History,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Star
} from 'lucide-react';

interface FinancialInsight {
  id: string;
  type: 'TREND_ANALYSIS' | 'ANOMALY_DETECTION' | 'PERFORMANCE_COMPARISON' | 'FORECASTING' | 'RECOMMENDATION';
  category: 'REVENUE' | 'EXPENSES' | 'PROFITABILITY' | 'CASH_FLOW' | 'BUDGET' | 'RISK';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  title: string;
  description: string;
  insights: Record<string, any>;
  recommendations?: Record<string, any>;
  confidence: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'ACTIONABLE';
}

interface QueryHistory {
  id: string;
  query: string;
  intent?: string;
  response: any;
  processingTime: number;
  isSuccessful: boolean;
  createdAt: string;
}

const INSIGHT_TYPE_ICONS = {
  TREND_ANALYSIS: TrendingUp,
  ANOMALY_DETECTION: AlertTriangle,
  PERFORMANCE_COMPARISON: Target,
  FORECASTING: Brain,
  RECOMMENDATION: Lightbulb
};

const PRIORITY_COLORS = {
  LOW: 'default',
  MEDIUM: 'secondary',
  HIGH: 'destructive',
  CRITICAL: 'destructive',
  URGENT: 'destructive'
} as const;

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<any>(null);

  useEffect(() => {
    loadInsights();
    loadQueryHistory();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/finance/insights?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to load financial insights');
      }

      const result = await response.json();
      setInsights(result.data || []);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const response = await fetch('/api/finance/natural-language?limit=10');
      
      if (response.ok) {
        const result = await response.json();
        setQueryHistory(result.data || []);
      }
    } catch (err) {
      console.error('Error loading query history:', err);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setQueryLoading(true);
    setQueryResponse(null);

    try {
      const response = await fetch('/api/finance/natural-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const result = await response.json();
      setQueryResponse(result.data);
      setQuery('');
      
      // Refresh query history
      await loadQueryHistory();
    } catch (err) {
      console.error('Error processing query:', err);
      setQueryResponse({
        isSuccessful: false,
        response: {
          error: 'Failed to process query',
          message: err instanceof Error ? err.message : 'Unknown error'
        }
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    const IconComponent = INSIGHT_TYPE_ICONS[type as keyof typeof INSIGHT_TYPE_ICONS] || Brain;
    return IconComponent;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(0)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderQueryResponse = (response: any) => {
    if (!response) return null;

    if (!response.isSuccessful) {
      return (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{response.response?.error || 'Query failed'}</AlertDescription>
        </Alert>
      );
    }

    const data = response.response;

    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">AI Response</CardTitle>
            <Badge variant="outline">{data.type?.replace('_', ' ') || 'General'}</Badge>
          </div>
          <CardDescription>
            Response generated in {response.processingTime}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">{data.message}</p>
            
            {data.data && (
              <div className="p-3 bg-muted rounded-lg">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading AI insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Financial Insights</h2>
          <p className="text-muted-foreground">Natural language queries and intelligent financial analysis</p>
        </div>
        <Button variant="outline" onClick={loadInsights}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">Query History</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          {/* Natural Language Query Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Ask About Your Finances</span>
              </CardTitle>
              <CardDescription>
                Ask questions in natural language about your financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="E.g., 'What's my revenue trend for the last 6 months?' or 'Show me my biggest expenses this quarter'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                    disabled={queryLoading}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Try asking about revenue, expenses, cash flow, budgets, or forecasts
                    </div>
                    <Button type="submit" disabled={queryLoading || !query.trim()}>
                      {queryLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Ask AI
                    </Button>
                  </div>
                </div>
              </form>

              {renderQueryResponse(queryResponse)}
            </CardContent>
          </Card>

          {/* Quick Query Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Questions</CardTitle>
              <CardDescription>Click on any question to get instant insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "What's my current cash flow status?",
                  "Show me my revenue forecast for next quarter",
                  "What are my biggest expense categories?",
                  "How is my budget performance?",
                  "What financial risks should I be aware of?",
                  "Compare this month's revenue to last month"
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => setQuery(suggestion)}
                    disabled={queryLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Insights Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {insights.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL' || i.priority === 'URGENT').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'RECOMMENDATION').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.length > 0 ? formatConfidence(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {insights.map((insight) => {
              const IconComponent = getInsightIcon(insight.type);
              return (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-5 w-5" />
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={PRIORITY_COLORS[insight.priority]}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Insight Details */}
                      {Object.keys(insight.insights).length > 0 && (
                        <div>
                          <label className="text-sm font-medium">Key Insights</label>
                          <div className="mt-2 space-y-2">
                            {Object.entries(insight.insights).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                <span className="ml-2 font-medium">{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {insight.recommendations && Object.keys(insight.recommendations).length > 0 && (
                        <div>
                          <label className="text-sm font-medium">Recommendations</label>
                          <div className="mt-2 space-y-2">
                            {Object.entries(insight.recommendations).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                <span className="ml-2">{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className={`ml-2 font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {formatConfidence(insight.confidence)}
                            </span>
                          </div>
                          <Badge variant={
                            insight.impact === 'POSITIVE' ? 'default' :
                            insight.impact === 'NEGATIVE' ? 'destructive' : 'secondary'
                          }>
                            {insight.impact}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Query History</span>
              </CardTitle>
              <CardDescription>Your recent financial queries and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryHistory.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={item.isSuccessful ? 'default' : 'destructive'}>
                        {item.isSuccessful ? 'Success' : 'Failed'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Query:</label>
                        <p className="text-sm">{item.query}</p>
                      </div>
                      {item.intent && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Intent:</label>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {item.intent.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Processing time: {item.processingTime}ms
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuery(item.query)}
                        >
                          Repeat Query
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
