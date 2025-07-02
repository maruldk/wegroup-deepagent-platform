
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  Settings, 
  Zap, 
  BarChart3, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Workflow,
  Bot,
  Target,
  Gauge
} from 'lucide-react';

interface OrchestrationStats {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  avgProcessingTime: number;
  automationScore: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
}

interface EventMetrics {
  [status: string]: number;
}

interface WorkflowMetrics {
  [status: string]: number;
}

interface AIMetrics {
  [severity: string]: number;
}

interface PerformanceMetrics {
  avgProcessingTime: number;
  successRate: number;
  automationScore: number;
  totalEvents: number;
  timeframe: string;
}

interface LiveData {
  activeWorkflows: any[];
  recentNotifications: any[];
  eventProcessingMetrics: any[];
  timestamp: Date;
}

export default function EventOrchestrationDashboard() {
  const [stats, setStats] = useState<OrchestrationStats | null>(null);
  const [metrics, setMetrics] = useState<{
    eventMetrics: EventMetrics;
    workflowMetrics: WorkflowMetrics;
    aiMetrics: AIMetrics;
    performance: PerformanceMetrics;
  } | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch orchestration data
  const fetchOrchestrationData = async () => {
    try {
      const [statsResponse, metricsResponse, liveResponse] = await Promise.all([
        fetch(`/api/events/orchestration?metric=stats`),
        fetch(`/api/events/orchestration?metric=metrics&timeframe=${timeframe}`),
        fetch(`/api/events/orchestration?metric=live`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      }

      if (liveResponse.ok) {
        const liveDataResult = await liveResponse.json();
        setLiveData(liveDataResult.liveData);
      }
    } catch (error) {
      console.error('Failed to fetch orchestration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchOrchestrationData();

    if (autoRefresh) {
      const interval = setInterval(fetchOrchestrationData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [timeframe, autoRefresh]);

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'COMPLETED': 'bg-green-500',
      'RUNNING': 'bg-blue-500',
      'PENDING': 'bg-yellow-500',
      'FAILED': 'bg-red-500',
      'CANCELLED': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-400';
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    const colors: { [key: string]: string } = {
      'CRITICAL': 'text-red-600 bg-red-50',
      'HIGH': 'text-orange-600 bg-orange-50',
      'MEDIUM': 'text-yellow-600 bg-yellow-50',
      'LOW': 'text-blue-600 bg-blue-50',
      'INFO': 'text-gray-600 bg-gray-50'
    };
    return colors[severity] || 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Orchestration</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and management of your AI-driven event system
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalEvents)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">
                      {Math.round((stats.processedEvents / stats.totalEvents) * 100)}% processed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Autonomy Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(stats.automationScore * 100)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={stats.automationScore * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeWorkflows}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Workflow className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">
                      {stats.completedWorkflows} completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDuration(stats.avgProcessingTime)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Gauge className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-blue-600">Real-time processing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="live">Live Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Event Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.eventMetrics).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`} />
                          <span className="text-sm font-medium capitalize">
                            {status.toLowerCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold">{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${getStatusColor(status)}`}
                              style={{
                                width: `${(count / Math.max(...Object.values(metrics.eventMetrics))) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-lg font-semibold">
                          {Math.round(metrics.performance.successRate * 100)}%
                        </span>
                      </div>
                      <Progress value={metrics.performance.successRate * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Automation Score</span>
                        <span className="text-lg font-semibold">
                          {Math.round(metrics.performance.automationScore * 100)}%
                        </span>
                      </div>
                      <Progress value={metrics.performance.automationScore * 100} className="h-2" />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Avg Processing</p>
                          <p className="text-lg font-semibold">
                            {formatDuration(metrics.performance.avgProcessingTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Events</p>
                          <p className="text-lg font-semibold">
                            {formatNumber(metrics.performance.totalEvents)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Event management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Workflow management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          {liveData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Workflows */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Workflow className="w-5 h-5 mr-2" />
                    Active Workflows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {liveData.activeWorkflows.length > 0 ? (
                      liveData.activeWorkflows.map((workflow) => (
                        <motion.div
                          key={workflow.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{workflow.workflowDefinition?.name}</p>
                            <p className="text-sm text-gray-600">
                              Step {workflow.currentStep} of {workflow.totalSteps}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {workflow.status}
                          </Badge>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No active workflows</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {liveData.recentNotifications.length > 0 ? (
                      liveData.recentNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            {notification.severity === 'CRITICAL' && (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                            {notification.severity === 'HIGH' && (
                              <AlertTriangle className="w-5 h-5 text-orange-500" />
                            )}
                            {notification.severity === 'MEDIUM' && (
                              <Bell className="w-5 h-5 text-yellow-500" />
                            )}
                            {(notification.severity === 'LOW' || notification.severity === 'INFO') && (
                              <Bell className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            className={getSeverityColor(notification.severity)}
                            variant="outline"
                          >
                            {notification.severity}
                          </Badge>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent notifications</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
