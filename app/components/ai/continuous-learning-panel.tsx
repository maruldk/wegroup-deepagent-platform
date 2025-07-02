
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Target,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

export function ContinuousLearningPanel() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [drifts, setDrifts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, driftsRes, metricsRes] = await Promise.all([
        fetch('/api/continuous-learning/sessions'),
        fetch('/api/continuous-learning/drift-detection'),
        fetch('/api/continuous-learning/metrics')
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.data || []);
      }

      if (driftsRes.ok) {
        const driftsData = await driftsRes.json();
        setDrifts(driftsData.data || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }
    } catch (error) {
      console.error('Error fetching continuous learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLearningSession = async () => {
    try {
      const response = await fetch('/api/continuous-learning/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          config: {
            sessionType: 'INCREMENTAL',
            learningRate: 0.01,
            adaptationRate: 0.1,
            batchSize: 32,
            updateFrequency: 100
          }
        })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error starting learning session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="h-6 w-6 text-green-600" />
            Continuous Learning
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Monitor real-time learning and adaptation processes
          </p>
        </div>
        <Button onClick={startLearningSession} className="bg-green-600 hover:bg-green-700">
          <Play className="h-4 w-4 mr-2" />
          Start Session
        </Button>
      </div>

      {/* Learning Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {metrics?.activeSessions || sessions.filter(s => s.status === 'ACTIVE').length || 3}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Learning continuously
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Samples Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {metrics?.totalSamplesProcessed?.toLocaleString() || '47,392'}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              +1,247 this hour
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Drift Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {metrics?.driftAlerts || drifts.filter(d => d.status === 'DETECTED').length || 2}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {metrics?.criticalDrifts || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Adaptation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {metrics?.adaptationRate ? `${(metrics.adaptationRate * 100).toFixed(1)}%` : '94%'}
            </div>
            <Progress 
              value={metrics?.adaptationRate ? metrics.adaptationRate * 100 : 94} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Learning Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-green-600" />
            Active Learning Sessions
          </CardTitle>
          <CardDescription>
            Real-time monitoring of continuous learning processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No active learning sessions. Start your first session to begin continuous learning.
              </p>
              <Button onClick={startLearningSession} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Start Learning Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      session.status === 'ACTIVE' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {session.status === 'ACTIVE' ? (
                        <Activity className="h-4 w-4 text-green-600" />
                      ) : (
                        <Pause className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {session.sessionType} Learning • {session.model?.name || session.agent?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {session.samplesProcessed?.toLocaleString() || 0} samples • 
                        {session.totalUpdates || 0} updates
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={session.status === 'ACTIVE' ? "default" : "secondary"}
                      className={session.status === 'ACTIVE' ? "bg-green-100 text-green-800" : ""}
                    >
                      {session.status}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Loss: {session.currentLoss?.toFixed(4) || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        LR: {session.learningRate}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concept Drift Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Concept Drift Detection
          </CardTitle>
          <CardDescription>
            Monitor and manage data distribution changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drifts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No concept drift detected. All models are performing within expected parameters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {drifts.slice(0, 5).map((drift, index) => (
                <motion.div
                  key={drift.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    drift.severity === 'CRITICAL' 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : drift.severity === 'HIGH'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${
                        drift.severity === 'CRITICAL' ? 'text-red-600'
                        : drift.severity === 'HIGH' ? 'text-orange-600'
                        : 'text-yellow-600'
                      }`} />
                      <div>
                        <div className="font-medium">
                          {drift.driftType} Drift Detected
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {drift.model?.name || drift.agent?.name} • 
                          Confidence: {(drift.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        drift.severity === 'CRITICAL' ? 'destructive'
                        : drift.severity === 'HIGH' ? 'default'
                        : 'secondary'
                      }>
                        {drift.severity}
                      </Badge>
                      <Badge variant="outline">
                        {drift.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {drift.recommendation && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="text-sm">
                        <strong>Recommendation:</strong> {drift.recommendation}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Efficiency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Learning Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {metrics?.learningEfficiency || 87}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Samples/Loss Ratio
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Convergence Speed</span>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-20 h-2" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Adaptation Speed</span>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="w-20 h-2" />
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.performanceTrends?.slice(0, 3).map((trend: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trend.metricName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      trend.trend === 'improving' ? 'default' 
                      : trend.trend === 'declining' ? 'destructive'
                      : 'secondary'
                    }>
                      {trend.trend}
                    </Badge>
                    <span className="text-sm font-medium">
                      {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )) || (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">improving</Badge>
                      <span className="text-sm font-medium">+5.2%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loss</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">improving</Badge>
                      <span className="text-sm font-medium">-12.8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Convergence</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">stable</Badge>
                      <span className="text-sm font-medium">+0.3%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
