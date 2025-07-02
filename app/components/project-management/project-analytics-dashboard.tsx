
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';

interface ProjectKPI {
  velocity: number;
  burnRate: number;
  qualityScore: number;
  completionRate: number;
  budgetUtilization: number;
  scheduleAdherence: number;
}

interface ProjectHealthScore {
  overallScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  budgetHealth: number;
  scheduleHealth: number;
  qualityHealth: number;
  teamHealth: number;
  riskHealth: number;
  factors: any;
  recommendations?: any[];
}

interface ProjectInsight {
  id: string;
  type: 'PERFORMANCE' | 'RISK' | 'OPTIMIZATION' | 'PREDICTION' | 'RECOMMENDATION' | 'ANOMALY';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  insights: any;
  recommendations?: any[];
  confidence: number;
  isActionable: boolean;
  isRead: boolean;
  createdAt: string;
}

interface ProjectPrediction {
  id: string;
  type: 'COMPLETION_DATE' | 'BUDGET_OVERRUN' | 'RESOURCE_REQUIREMENT' | 'SUCCESS_PROBABILITY' | 'RISK_LEVEL' | 'QUALITY_SCORE';
  predictedValue: number;
  confidence: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidenceScore: number;
  predictionDate: string;
  targetDate: string;
  features: any;
}

interface ProjectAnalyticsDashboardProps {
  projectId: string;
  className?: string;
}

const ProjectAnalyticsDashboard: React.FC<ProjectAnalyticsDashboardProps> = ({ 
  projectId, 
  className = '' 
}) => {
  const [kpis, setKpis] = useState<ProjectKPI | null>(null);
  const [healthScore, setHealthScore] = useState<ProjectHealthScore | null>(null);
  const [insights, setInsights] = useState<ProjectInsight[]>([]);
  const [predictions, setPredictions] = useState<ProjectPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [projectId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [kpisResponse, healthResponse, insightsResponse, predictionsResponse] = await Promise.all([
        fetch(`/api/projects/analytics/kpis?projectId=${projectId}`),
        fetch(`/api/projects/analytics/health-score?projectId=${projectId}`),
        fetch(`/api/projects/analytics/insights?projectId=${projectId}&limit=10`),
        fetch(`/api/projects/analytics/predictions?projectId=${projectId}&limit=5`)
      ]);

      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData.data);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthScore(healthData.data);
      }

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.data || []);
      }

      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      const response = await fetch('/api/projects/analytics/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.data || []);
      }
    } catch (err) {
      console.error('Error generating predictions:', err);
    }
  };

  const generateInsights = async () => {
    try {
      const response = await fetch('/api/projects/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      if (response.ok) {
        fetchAnalyticsData(); // Refresh all data
      }
    } catch (err) {
      console.error('Error generating insights:', err);
    }
  };

  const markInsightAsRead = async (insightId: string) => {
    try {
      const response = await fetch('/api/projects/analytics/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, isRead: true })
      });

      if (response.ok) {
        setInsights(prev => prev.map(insight => 
          insight.id === insightId ? { ...insight, isRead: true } : insight
        ));
      }
    } catch (err) {
      console.error('Error marking insight as read:', err);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'FAIR': return 'text-yellow-600 bg-yellow-100';
      case 'POOR': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'LOW': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'INFO': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'VERY_HIGH': return 'text-green-600';
      case 'HIGH': return 'text-blue-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-orange-600';
      case 'VERY_LOW': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (value: number, threshold: number = 1) => {
    if (value > threshold) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < threshold * 0.8) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const formatValue = (value: number, type: 'percentage' | 'decimal' | 'currency' | 'number' = 'number') => {
    switch (type) {
      case 'percentage': return `${Math.round(value)}%`;
      case 'decimal': return value.toFixed(2);
      case 'currency': return `$${value.toLocaleString()}`;
      default: return value.toFixed(1);
    }
  };

  // Prepare chart data
  const healthChartData = healthScore ? [
    { name: 'Budget', value: healthScore.budgetHealth, color: '#60B5FF' },
    { name: 'Schedule', value: healthScore.scheduleHealth, color: '#FF9149' },
    { name: 'Quality', value: healthScore.qualityHealth, color: '#FF9898' },
    { name: 'Team', value: healthScore.teamHealth, color: '#FF90BB' },
    { name: 'Risk', value: healthScore.riskHealth, color: '#80D8C3' }
  ] : [];

  const kpiChartData = kpis ? [
    { name: 'Velocity', value: kpis.velocity, target: 1.0 },
    { name: 'Quality', value: kpis.qualityScore, target: 80 },
    { name: 'Completion', value: kpis.completionRate, target: 100 },
    { name: 'Schedule', value: kpis.scheduleAdherence, target: 90 }
  ] : [];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Analytics</h2>
          <p className="text-gray-600">AI-powered insights and predictions</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={generatePredictions} 
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Generate Predictions</span>
          </Button>
          <Button 
            onClick={generateInsights}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Generate Insights</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Velocity</p>
                  <p className="text-2xl font-bold text-blue-900">{formatValue(kpis.velocity)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.velocity)}
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Quality Score</p>
                  <p className="text-2xl font-bold text-green-900">{formatValue(kpis.qualityScore)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.qualityScore, 80)}
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Completion</p>
                  <p className="text-2xl font-bold text-purple-900">{formatValue(kpis.completionRate, 'percentage')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.completionRate, 80)}
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Burn Rate</p>
                  <p className="text-2xl font-bold text-orange-900">{formatValue(kpis.burnRate, 'decimal')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.burnRate, 1)}
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Budget Use</p>
                  <p className="text-2xl font-bold text-indigo-900">{formatValue(kpis.budgetUtilization, 'percentage')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.budgetUtilization, 80)}
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Schedule</p>
                  <p className="text-2xl font-bold text-teal-900">{formatValue(kpis.scheduleAdherence, 'percentage')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpis.scheduleAdherence, 85)}
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPI Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key performance indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#60B5FF" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="target" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Health Score Radial */}
            {healthScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Project Health Score
                    <Badge className={getHealthStatusColor(healthScore.status)}>
                      {healthScore.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Overall project health: {healthScore.overallScore}/100</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart data={[{ value: healthScore.overallScore, fill: '#60B5FF' }]} innerRadius="40%" outerRadius="80%">
                      <RadialBar dataKey="value" cornerRadius={10} fill="#60B5FF" />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                        {healthScore.overallScore}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Insights Preview */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
                <CardDescription>AI-generated insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)} ${!insight.isRead ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {insight.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {healthScore && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Breakdown</CardTitle>
                  <CardDescription>Detailed health metrics by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={healthChartData} layout="horizontal">
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {healthChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Health Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Factors</CardTitle>
                  <CardDescription>Detailed analysis of health components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget Health</span>
                        <span>{healthScore.budgetHealth}%</span>
                      </div>
                      <Progress value={healthScore.budgetHealth} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Schedule Health</span>
                        <span>{healthScore.scheduleHealth}%</span>
                      </div>
                      <Progress value={healthScore.scheduleHealth} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quality Health</span>
                        <span>{healthScore.qualityHealth}%</span>
                      </div>
                      <Progress value={healthScore.qualityHealth} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Team Health</span>
                        <span>{healthScore.teamHealth}%</span>
                      </div>
                      <Progress value={healthScore.teamHealth} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risk Health</span>
                        <span>{healthScore.riskHealth}%</span>
                      </div>
                      <Progress value={healthScore.riskHealth} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {healthScore.recommendations && healthScore.recommendations.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Suggested actions to improve project health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {healthScore.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">{rec.title}</h4>
                          <p className="text-blue-700 text-sm mb-3">{rec.description}</p>
                          {rec.actions && (
                            <ul className="space-y-1">
                              {rec.actions.map((action: string, actionIndex: number) => (
                                <li key={actionIndex} className="text-sm text-blue-600 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {predictions.map((prediction) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">{prediction.type.replace(/_/g, ' ')}</CardTitle>
                    <CardDescription className={getConfidenceColor(prediction.confidence)}>
                      Confidence: {prediction.confidence} ({Math.round(prediction.confidenceScore * 100)}%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {prediction.type === 'COMPLETION_DATE' 
                          ? new Date(prediction.predictedValue).toLocaleDateString()
                          : formatValue(prediction.predictedValue, 
                              prediction.type.includes('PROBABILITY') || prediction.type.includes('SCORE') ? 'percentage' : 'number'
                            )
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Target: {new Date(prediction.targetDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated: {new Date(prediction.predictionDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {predictions.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No predictions available</p>
                <Button onClick={generatePredictions}>
                  Generate Predictions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`${!insight.isRead ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription className="mt-1">{insight.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {insight.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!insight.isRead && (
                        <Button 
                          onClick={() => markInsightAsRead(insight.id)}
                          variant="outline" 
                          size="sm"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {insights.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No insights available</p>
                <Button onClick={generateInsights}>
                  Generate Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalyticsDashboard;
