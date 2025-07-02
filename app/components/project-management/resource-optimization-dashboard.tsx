
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Settings,
  Brain,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Area, AreaChart, ScatterChart, Scatter } from 'recharts';

interface ResourceAllocationPlan {
  userId: string;
  userName: string;
  currentAllocations: ResourceAllocation[];
  recommendedAllocations: ResourceAllocation[];
  utilizationImprovement: number;
  costSavings: number;
  efficiency: number;
  skillMatch: number;
  workloadBalance: number;
}

interface ResourceAllocation {
  projectId: string;
  projectName: string;
  hoursAllocated: number;
  hoursUtilized: number;
  utilizationRate: number;
  skillRequirements: string[];
  skillMatch: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
}

interface ResourceCapacityPlan {
  totalCapacity: number;
  allocatedCapacity: number;
  utilizationRate: number;
  availableCapacity: number;
  bottlenecks: ResourceBottleneck[];
  recommendations: CapacityRecommendation[];
  forecastedNeeds: ResourceForecast[];
}

interface ResourceBottleneck {
  type: 'skill' | 'capacity' | 'availability';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedProjects: string[];
  suggestedResolutions: string[];
  estimatedResolutionTime: number;
}

interface CapacityRecommendation {
  action: 'hire' | 'train' | 'redistribute' | 'outsource' | 'reduce_scope';
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  estimatedCost: number;
  estimatedBenefit: number;
  timeline: string;
  riskMitigation: string[];
}

interface ResourceForecast {
  period: string;
  forecastDate: Date;
  requiredCapacity: number;
  availableCapacity: number;
  gap: number;
  confidence: number;
  skillBreakdown: { skill: string; required: number; available: number }[];
}

interface OptimizationResult {
  strategy: string;
  currentState: ResourceState;
  optimizedState: ResourceState;
  improvements: OptimizationImprovement[];
  implementationPlan: ImplementationStep[];
  riskAssessment: OptimizationRisk[];
  expectedROI: number;
}

interface ResourceState {
  totalUtilization: number;
  averageEfficiency: number;
  costPerHour: number;
  skillUtilization: { skill: string; utilization: number }[];
  projectHealth: number;
  teamSatisfaction: number;
}

interface OptimizationImprovement {
  metric: string;
  currentValue: number;
  optimizedValue: number;
  improvement: number;
  impact: 'low' | 'medium' | 'high';
}

interface ImplementationStep {
  action: string;
  description: string;
  timeline: string;
  dependencies: string[];
  resources: string[];
  risks: string[];
}

interface OptimizationRisk {
  risk: string;
  probability: number;
  impact: number;
  mitigation: string[];
}

interface ResourceOptimizationDashboardProps {
  userIds: string[];
  projectIds: string[];
  className?: string;
}

const ResourceOptimizationDashboard: React.FC<ResourceOptimizationDashboardProps> = ({ 
  userIds, 
  projectIds,
  className = '' 
}) => {
  const [allocationPlans, setAllocationPlans] = useState<ResourceAllocationPlan[]>([]);
  const [capacityPlan, setCapacityPlan] = useState<ResourceCapacityPlan | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [resourceForecasts, setResourceForecasts] = useState<ResourceForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStrategy, setSelectedStrategy] = useState('LOAD_BALANCING');
  const [forecastWeeks, setForecastWeeks] = useState(12);
  const [autoOptimize, setAutoOptimize] = useState(false);

  useEffect(() => {
    if (userIds.length > 0 && projectIds.length > 0) {
      fetchResourceOptimizationData();
    }
  }, [userIds, projectIds]);

  const fetchResourceOptimizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = [
        // Resource allocation optimization
        fetch('/api/resources/optimization/allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds, projectIds, strategy: selectedStrategy })
        }),
        
        // Capacity analysis
        fetch('/api/resources/optimization/capacity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds, forecastPeriods: forecastWeeks })
        }),
        
        // Resource forecasting
        fetch('/api/resources/optimization/forecasting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds, weeks: forecastWeeks })
        })
      ];

      const responses = await Promise.all(requests);

      if (responses[0].ok) {
        const allocationData = await responses[0].json();
        setAllocationPlans(allocationData.data || []);
      }

      if (responses[1].ok) {
        const capacityData = await responses[1].json();
        setCapacityPlan(capacityData.data);
      }

      if (responses[2].ok) {
        const forecastData = await responses[2].json();
        setResourceForecasts(forecastData.data || []);
      }

    } catch (err) {
      console.error('Error fetching resource optimization data:', err);
      setError('Failed to load resource optimization data');
    } finally {
      setLoading(false);
    }
  };

  const executeOptimizationStrategy = async (strategy: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/resources/optimization/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, userIds, projectIds })
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizationResult(data.data);
      }
    } catch (err) {
      console.error('Error executing optimization strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  const optimizeSkillMatrix = async () => {
    try {
      const response = await fetch('/api/resources/optimization/skill-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, projectIds })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle skill matrix optimization results
        console.log('Skill matrix optimization:', data.data);
      }
    } catch (err) {
      console.error('Error optimizing skill matrix:', err);
    }
  };

  const optimizeCrossProjectSharing = async () => {
    try {
      const response = await fetch('/api/resources/optimization/cross-project-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle cross-project sharing optimization results
        console.log('Cross-project sharing optimization:', data.data);
      }
    } catch (err) {
      console.error('Error optimizing cross-project sharing:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getBottleneckColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const formatHours = (value: number) => `${Math.round(value)}h`;

  // Prepare chart data
  const utilizationTrendData = resourceForecasts.slice(0, 8).map((forecast, index) => ({
    week: `W${index + 1}`,
    required: forecast.requiredCapacity,
    available: forecast.availableCapacity,
    gap: Math.abs(forecast.gap),
    utilization: forecast.availableCapacity > 0 ? (forecast.requiredCapacity / forecast.availableCapacity) * 100 : 0
  }));

  const allocationComparisonData = allocationPlans.map(plan => ({
    name: plan.userName.split(' ')[0],
    current: plan.currentAllocations.reduce((sum, alloc) => sum + alloc.hoursAllocated, 0),
    recommended: plan.recommendedAllocations.reduce((sum, alloc) => sum + alloc.hoursAllocated, 0),
    improvement: plan.utilizationImprovement,
    efficiency: plan.efficiency * 100
  }));

  const skillUtilizationData = optimizationResult?.currentState.skillUtilization || [];

  const costBenefitData = allocationPlans.map(plan => ({
    name: plan.userName.split(' ')[0],
    savings: plan.costSavings,
    efficiency: plan.efficiency * 100,
    skillMatch: plan.skillMatch * 100
  }));

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
          <Button onClick={fetchResourceOptimizationData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Optimization</h2>
          <p className="text-gray-600">AI-powered resource allocation and capacity planning</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOAD_BALANCING">Load Balancing</SelectItem>
              <SelectItem value="SKILL_MATCHING">Skill Matching</SelectItem>
              <SelectItem value="COST_REDUCTION">Cost Reduction</SelectItem>
              <SelectItem value="TIME_OPTIMIZATION">Time Optimization</SelectItem>
              <SelectItem value="CAPACITY_PLANNING">Capacity Planning</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch id="auto-optimize" checked={autoOptimize} onCheckedChange={setAutoOptimize} />
            <Label htmlFor="auto-optimize" className="text-sm">Auto-optimize</Label>
          </div>
          <Button 
            onClick={() => executeOptimizationStrategy(selectedStrategy)}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Optimize</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {capacityPlan && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Capacity</p>
                  <p className="text-2xl font-bold text-blue-900">{formatHours(capacityPlan.totalCapacity)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Utilization</p>
                  <p className="text-2xl font-bold text-green-900">{formatPercentage(capacityPlan.utilizationRate * 100)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Available</p>
                  <p className="text-2xl font-bold text-purple-900">{formatHours(capacityPlan.availableCapacity)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Bottlenecks</p>
                  <p className="text-2xl font-bold text-orange-900">{capacityPlan.bottlenecks.length}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Utilization Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization Trend</CardTitle>
                <CardDescription>Forecasted capacity utilization over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={utilizationTrendData}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="available" fill="#E5E7EB" name="Available" />
                    <Bar dataKey="required" fill="#60B5FF" name="Required" />
                    <Line type="monotone" dataKey="utilization" stroke="#FF9149" name="Utilization %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Allocation Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Allocation Optimization</CardTitle>
                <CardDescription>Current vs recommended resource allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={allocationComparisonData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="current" fill="#FF9898" name="Current Hours" />
                    <Bar dataKey="recommended" fill="#80D8C3" name="Recommended Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Optimization Actions</CardTitle>
              <CardDescription>Common optimization strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={optimizeSkillMatrix}
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Target className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Optimize Skills</span>
                  <span className="text-xs text-gray-600">Match skills to tasks</span>
                </Button>
                <Button 
                  onClick={optimizeCrossProjectSharing}
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Layers className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Cross-Project</span>
                  <span className="text-xs text-gray-600">Share resources</span>
                </Button>
                <Button 
                  onClick={() => executeOptimizationStrategy('LOAD_BALANCING')}
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Activity className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">Load Balance</span>
                  <span className="text-xs text-gray-600">Distribute workload</span>
                </Button>
                <Button 
                  onClick={() => executeOptimizationStrategy('COST_REDUCTION')}
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <DollarSign className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">Reduce Costs</span>
                  <span className="text-xs text-gray-600">Optimize expenses</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resource Bottlenecks */}
          {capacityPlan && capacityPlan.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Bottlenecks</CardTitle>
                <CardDescription>Identified constraints and suggested resolutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capacityPlan.bottlenecks.slice(0, 3).map((bottleneck, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-l-4 rounded-lg ${getBottleneckColor(bottleneck.impact)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className={getImpactColor(bottleneck.impact)}>
                              {bottleneck.impact} impact
                            </Badge>
                            <Badge variant="outline">
                              {bottleneck.type}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{bottleneck.description}</h4>
                          <p className="text-xs text-gray-600 mb-3">
                            Affects {bottleneck.affectedProjects.length} project(s) • 
                            Resolution: {bottleneck.estimatedResolutionTime} days
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-900">Suggested resolutions:</p>
                            {bottleneck.suggestedResolutions.slice(0, 2).map((resolution, resIndex) => (
                              <div key={resIndex} className="flex items-center text-xs text-gray-700">
                                <CheckCircle className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                                {resolution}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <div className="space-y-6">
            {allocationPlans.map((plan) => (
              <motion.div
                key={plan.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.userName}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className={plan.utilizationImprovement > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {plan.utilizationImprovement > 0 ? '+' : ''}{formatPercentage(plan.utilizationImprovement)} utilization
                        </Badge>
                        <Badge className={plan.costSavings > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                          {formatCurrency(plan.costSavings)} savings
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Current Allocation */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Current Allocation</h4>
                        <div className="space-y-3">
                          {plan.currentAllocations.map((allocation, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{allocation.projectName}</span>
                                <Badge className={getPriorityColor(allocation.priority)}>
                                  {allocation.priority}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>Allocated: {formatHours(allocation.hoursAllocated)}</div>
                                <div>Utilized: {formatHours(allocation.hoursUtilized)}</div>
                                <div>Utilization: {formatPercentage(allocation.utilizationRate * 100)}</div>
                                <div>Skill Match: {formatPercentage(allocation.skillMatch * 100)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Allocation */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recommended Allocation</h4>
                        <div className="space-y-3">
                          {plan.recommendedAllocations.map((allocation, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{allocation.projectName}</span>
                                <Badge className={getPriorityColor(allocation.priority)}>
                                  {allocation.priority}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>Allocated: {formatHours(allocation.hoursAllocated)}</div>
                                <div>Utilized: {formatHours(allocation.hoursUtilized)}</div>
                                <div>Utilization: {formatPercentage(allocation.utilizationRate * 100)}</div>
                                <div>Skill Match: {formatPercentage(allocation.skillMatch * 100)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Efficiency:</span>
                          <span className="ml-2 font-medium">{formatPercentage(plan.efficiency * 100)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skill Match:</span>
                          <span className="ml-2 font-medium">{formatPercentage(plan.skillMatch * 100)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Workload Balance:</span>
                          <span className="ml-2 font-medium">{formatPercentage(plan.workloadBalance * 100)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost Savings:</span>
                          <span className="ml-2 font-medium text-green-600">{formatCurrency(plan.costSavings)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-6">
          {capacityPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capacity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Overview</CardTitle>
                  <CardDescription>Current team capacity and utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Capacity</span>
                        <span>{formatHours(capacityPlan.totalCapacity)}</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Allocated Capacity</span>
                        <span>{formatHours(capacityPlan.allocatedCapacity)}</span>
                      </div>
                      <Progress value={(capacityPlan.allocatedCapacity / capacityPlan.totalCapacity) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Available Capacity</span>
                        <span>{formatHours(capacityPlan.availableCapacity)}</span>
                      </div>
                      <Progress value={(capacityPlan.availableCapacity / capacityPlan.totalCapacity) * 100} className="h-2" />
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPercentage(capacityPlan.utilizationRate * 100)}
                        </span>
                        <p className="text-sm text-gray-600">Overall Utilization</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capacity Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Recommendations</CardTitle>
                  <CardDescription>AI-generated suggestions for capacity optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {capacityPlan.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getPriorityColor(rec.priority.toLowerCase())}>
                                {rec.priority}
                              </Badge>
                              <Badge variant="outline">
                                {rec.action.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm">{rec.description}</h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                          <div>Cost: {formatCurrency(rec.estimatedCost)}</div>
                          <div>Benefit: {formatCurrency(rec.estimatedBenefit)}</div>
                          <div>Timeline: {rec.timeline}</div>
                          <div>ROI: {formatPercentage((rec.estimatedBenefit - rec.estimatedCost) / rec.estimatedCost * 100)}</div>
                        </div>
                        {rec.riskMitigation.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-900 mb-1">Risk Mitigation:</p>
                            <ul className="space-y-1">
                              {rec.riskMitigation.slice(0, 2).map((mitigation, mitIndex) => (
                                <li key={mitIndex} className="text-xs text-gray-700 flex items-center">
                                  <CheckCircle className="h-2 w-2 mr-1 text-green-600 flex-shrink-0" />
                                  {mitigation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capacity Forecast Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resource Capacity Forecast</CardTitle>
                <CardDescription>Projected resource needs vs availability over {forecastWeeks} weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={utilizationTrendData}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="available" stackId="1" stroke="#80D8C3" fill="#80D8C3" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="required" stackId="2" stroke="#60B5FF" fill="#60B5FF" fillOpacity={0.8} />
                    <Line type="monotone" dataKey="gap" stroke="#FF9149" strokeWidth={2} name="Capacity Gap" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Details */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Details</CardTitle>
              <CardDescription>Weekly capacity projections and confidence levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Week</th>
                      <th className="text-left p-2">Required</th>
                      <th className="text-left p-2">Available</th>
                      <th className="text-left p-2">Gap</th>
                      <th className="text-left p-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceForecasts.slice(0, 8).map((forecast, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">Week {index + 1}</td>
                        <td className="p-2">{formatHours(forecast.requiredCapacity)}</td>
                        <td className="p-2">{formatHours(forecast.availableCapacity)}</td>
                        <td className={`p-2 ${forecast.gap > 0 ? 'text-red-600' : forecast.gap < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {forecast.gap > 0 ? '+' : ''}{formatHours(forecast.gap)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Progress value={forecast.confidence * 100} className="w-16 h-1" />
                            <span className="text-xs">{formatPercentage(forecast.confidence * 100)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {optimizationResult ? (
            <div className="space-y-6">
              {/* Optimization Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                  <CardDescription>Strategy: {optimizationResult.strategy.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPercentage(optimizationResult.expectedROI)}
                      </div>
                      <div className="text-sm text-blue-700">Expected ROI</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(optimizationResult.optimizedState.averageEfficiency)}
                      </div>
                      <div className="text-sm text-green-700">Avg Efficiency</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPercentage(optimizationResult.optimizedState.totalUtilization)}
                      </div>
                      <div className="text-sm text-purple-700">Total Utilization</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(optimizationResult.optimizedState.costPerHour)}
                      </div>
                      <div className="text-sm text-orange-700">Cost per Hour</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Improvements */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Improvements</CardTitle>
                  <CardDescription>Detailed breakdown of optimization gains</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimizationResult.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{improvement.metric}</h4>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                            <span>Current: {improvement.currentValue.toFixed(1)}</span>
                            <span>Optimized: {improvement.optimizedValue.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getImpactColor(improvement.impact)}>
                            {improvement.impact}
                          </Badge>
                          <div className={`text-sm font-medium ${improvement.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {improvement.improvement >= 0 ? '+' : ''}{formatPercentage(improvement.improvement)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Plan</CardTitle>
                  <CardDescription>Step-by-step implementation roadmap</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimizationResult.implementationPlan.map((step, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{step.action}</h4>
                            <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Timeline:</span> {step.timeline}
                              </div>
                              <div>
                                <span className="font-medium">Dependencies:</span> {step.dependencies.join(', ')}
                              </div>
                              <div>
                                <span className="font-medium">Resources:</span> {step.resources.join(', ')}
                              </div>
                            </div>
                            {step.risks.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-red-600">Risks:</span>
                                <span className="text-xs text-red-600 ml-1">{step.risks.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No optimization results available</p>
                <Button onClick={() => executeOptimizationStrategy(selectedStrategy)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Run Optimization
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceOptimizationDashboard;
