
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Activity,
  Database,
  Zap,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MLDashboardStats, MLInsight } from '@/lib/types';
import { PredictiveAnalyticsPanel } from './predictive-analytics-panel';
import { AnomalyDetectionPanel } from './anomaly-detection-panel';
import { ModelManagementPanel } from './model-management-panel';
import { DataScienceToolsPanel } from './data-science-tools-panel';

interface MLDashboardProps {
  tenantId: string;
  userId?: string;
}

export function MLDashboard({ tenantId, userId }: MLDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/ml/dashboard');
      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch ML dashboard data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const generateMLInsights = async () => {
    try {
      // This would call an AI insights generation endpoint
      const mockInsights: MLInsight[] = [
        {
          id: '1',
          type: 'TREND',
          title: 'Model Performance Improving',
          description: 'Sales forecasting model accuracy increased by 12% this month',
          severity: 'LOW',
          confidence: 0.89,
          data: { accuracy: 0.89, previousAccuracy: 0.77 },
          actions: ['Review recent training data', 'Consider deploying to production'],
          timestamp: new Date(),
          module: 'PREDICTIVE_ANALYTICS'
        },
        {
          id: '2',
          type: 'ANOMALY',
          title: 'Unusual Financial Patterns',
          description: '3 high-severity financial anomalies detected in the last 24 hours',
          severity: 'HIGH',
          confidence: 0.94,
          data: { anomaliesCount: 3, severity: 'HIGH' },
          actions: ['Investigate transactions', 'Review approval processes'],
          timestamp: new Date(),
          module: 'ANOMALY_DETECTION'
        },
        {
          id: '3',
          type: 'RECOMMENDATION',
          title: 'Retrain Customer Behavior Model',
          description: 'Model performance declining due to changing customer patterns',
          severity: 'MEDIUM',
          confidence: 0.76,
          data: { modelAge: 45, performance: 0.73 },
          actions: ['Schedule retraining', 'Update feature set'],
          timestamp: new Date(),
          module: 'CUSTOMER_ANALYTICS'
        }
      ];
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to generate ML insights:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    generateMLInsights();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TREND': return <TrendingUp className="h-4 w-4" />;
      case 'ANOMALY': return <AlertTriangle className="h-4 w-4" />;
      case 'PREDICTION': return <Target className="h-4 w-4" />;
      case 'RECOMMENDATION': return <Brain className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            ML-Pipeline & Predictive Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Intelligent machine learning insights and predictive analytics for your business
          </p>
        </div>
        <Button 
          onClick={fetchDashboardData} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Overview Cards */}
      {dashboardData?.overview && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                ML Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalModels}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.overview.activeModels} active
              </p>
              <div className="absolute -right-2 -top-2 h-16 w-16 bg-blue-500/10 rounded-full" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.predictions}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
              <div className="absolute -right-2 -top-2 h-16 w-16 bg-green-500/10 rounded-full" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.anomaliesDetected}</div>
              <p className="text-xs text-muted-foreground">Open alerts</p>
              <div className="absolute -right-2 -top-2 h-16 w-16 bg-orange-500/10 rounded-full" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(dashboardData.overview.avgAccuracy * 100)}%</div>
              <p className="text-xs text-muted-foreground">Average model accuracy</p>
              <Progress value={dashboardData.overview.avgAccuracy * 100} className="mt-2 h-1" />
              <div className="absolute -right-2 -top-2 h-16 w-16 bg-purple-500/10 rounded-full" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                AI Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent insights and actionable recommendations powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card/50"
                  >
                    <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
                      {getTypeIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant={getSeverityColor(insight.severity) as any}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                        <span>•</span>
                        <span>{insight.module}</span>
                      </div>
                      {insight.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {insight.actions.map((action, index) => (
                            <Button key={index} variant="outline" size="sm">
                              {action}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main ML Features Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Predictive Analytics
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Anomaly Detection
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Model Management
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Data Science Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PredictiveAnalyticsPanel 
              tenantId={tenantId} 
              userId={userId}
              dashboardData={dashboardData}
            />
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-6">
            <AnomalyDetectionPanel 
              tenantId={tenantId} 
              userId={userId}
              dashboardData={dashboardData}
            />
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <ModelManagementPanel 
              tenantId={tenantId} 
              userId={userId}
              dashboardData={dashboardData}
            />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <DataScienceToolsPanel 
              tenantId={tenantId} 
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
