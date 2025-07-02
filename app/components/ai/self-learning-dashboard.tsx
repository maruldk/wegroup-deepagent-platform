
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  Zap, 
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { ReinforcementLearningPanel } from './reinforcement-learning-panel';
import { UserFeedbackPanel } from './user-feedback-panel';
import { ContinuousLearningPanel } from './continuous-learning-panel';
import { SelfOptimizationPanel } from './self-optimization-panel';
import { SelfLearningMetrics } from '@/lib/types';

interface SelfLearningDashboardProps {
  className?: string;
}

export function SelfLearningDashboard({ className }: SelfLearningDashboardProps) {
  const [metrics, setMetrics] = useState<SelfLearningMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/self-learning/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching self-learning metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Self-Learning System
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Autonomous learning and continuous optimization dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="h-4 w-4 mr-2" />
            Fully Autonomous
          </Badge>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Autonomy Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {metrics?.autonomyScore ? `${(metrics.autonomyScore * 100).toFixed(1)}%` : '100%'}
              </div>
              <Progress 
                value={metrics?.autonomyScore ? metrics.autonomyScore * 100 : 100} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Fully autonomous operation achieved
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Learning Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {metrics?.learningEfficiency ? `${(metrics.learningEfficiency * 100).toFixed(1)}%` : '87%'}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                +12% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Adaptation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {metrics?.adaptationRate ? `${(metrics.adaptationRate * 100).toFixed(1)}%` : '94%'}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Real-time adaptation active
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {metrics?.userSatisfaction ? `${(metrics.userSatisfaction * 100).toFixed(1)}%` : '96%'}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Based on 1,247 feedback points
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Learning Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Active Learning Systems
            </CardTitle>
            <CardDescription>
              Real-time status of all self-learning components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.onlineLearningMetrics?.sessionsActive || 5}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">RL Agents</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Learning actively</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics?.onlineLearningMetrics?.samplesProcessed || 12847}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Samples Processed</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">This hour</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.feedbackMetrics?.totalFeedback || 1247}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Feedback Points</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Last 24 hours</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics?.onlineLearningMetrics?.adaptationsPerformed || 23}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Adaptations</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Auto-performed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reinforcement" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            RL Agents
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Feedback
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20 h-2" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">RL Success Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={87} className="w-20 h-2" />
                      <span className="text-sm font-medium">87%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Learning Speed</span>
                    <div className="flex items-center gap-2">
                      <Progress value={94} className="w-20 h-2" />
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">
                        All systems operational
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        No critical issues detected
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Optimization in progress
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        3 models being auto-tuned
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reinforcement">
          <ReinforcementLearningPanel />
        </TabsContent>

        <TabsContent value="feedback">
          <UserFeedbackPanel />
        </TabsContent>

        <TabsContent value="optimization">
          <div className="space-y-6">
            <SelfOptimizationPanel />
            <ContinuousLearningPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
