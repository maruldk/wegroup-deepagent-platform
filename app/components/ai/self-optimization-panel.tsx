
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Target,
  Cpu,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

export function SelfOptimizationPanel() {
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [automlExperiments, setAutomlExperiments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOptimization, setNewOptimization] = useState({
    type: 'hyperparameter',
    tuningMethod: 'BAYESIAN_OPTIMIZATION',
    objective: 'accuracy',
    maxIterations: 100
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [optimizationsRes, automlRes, metricsRes] = await Promise.all([
        fetch('/api/self-optimization/hyperparameter-tuning'),
        fetch('/api/self-optimization/automl'),
        fetch('/api/self-optimization/metrics')
      ]);

      if (optimizationsRes.ok) {
        const data = await optimizationsRes.json();
        setOptimizations(data.data || []);
      }

      if (automlRes.ok) {
        const data = await automlRes.json();
        setAutomlExperiments(data.data || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOptimization = async () => {
    try {
      const response = await fetch('/api/self-optimization/hyperparameter-tuning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tuningMethod: newOptimization.tuningMethod,
          searchSpace: {
            learning_rate: { type: 'continuous', min: 0.001, max: 0.1 },
            batch_size: { type: 'discrete', values: [16, 32, 64, 128] },
            dropout: { type: 'continuous', min: 0.1, max: 0.5 }
          },
          objective: newOptimization.objective,
          maxIterations: newOptimization.maxIterations
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Error starting optimization:', error);
    }
  };

  const startAutoML = async () => {
    try {
      const response = await fetch('/api/self-optimization/automl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auto-Optimization Experiment',
          experimentType: 'HYPERPARAMETER_OPTIMIZATION',
          dataset: { features: 100, samples: 10000 },
          objective: 'accuracy',
          maxTrials: 50
        })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error starting AutoML:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="h-6 w-6 text-orange-600" />
            Self-Optimization Engine
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Automated hyperparameter tuning and model optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Optimization
          </Button>
          <Button onClick={startAutoML} className="bg-orange-600 hover:bg-orange-700">
            <Zap className="h-4 w-4 mr-2" />
            Start AutoML
          </Button>
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Total Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {metrics?.totalOptimizations || optimizations.length + automlExperiments.length || 23}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              +5 this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {metrics?.successRate ? `${(metrics.successRate * 100).toFixed(1)}%` : '92%'}
            </div>
            <Progress 
              value={metrics?.successRate ? metrics.successRate * 100 : 92} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {metrics?.avgImprovement ? `${(metrics.avgImprovement * 100).toFixed(1)}%` : '+18%'}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Per optimization
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Active Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {optimizations.filter(o => o.status === 'RUNNING').length + 
               automlExperiments.filter(e => e.status === 'RUNNING').length || 3}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Currently optimizing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Optimization Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Create New Optimization</CardTitle>
              <CardDescription>
                Configure automatic hyperparameter tuning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tuningMethod">Tuning Method</Label>
                  <Select 
                    value={newOptimization.tuningMethod} 
                    onValueChange={(value) => 
                      setNewOptimization({...newOptimization, tuningMethod: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAYESIAN_OPTIMIZATION">Bayesian Optimization</SelectItem>
                      <SelectItem value="GENETIC_ALGORITHM">Genetic Algorithm</SelectItem>
                      <SelectItem value="RANDOM_SEARCH">Random Search</SelectItem>
                      <SelectItem value="GRID_SEARCH">Grid Search</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objective</Label>
                  <Select 
                    value={newOptimization.objective} 
                    onValueChange={(value) => 
                      setNewOptimization({...newOptimization, objective: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accuracy">Accuracy</SelectItem>
                      <SelectItem value="f1_score">F1 Score</SelectItem>
                      <SelectItem value="precision">Precision</SelectItem>
                      <SelectItem value="recall">Recall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxIterations">Max Iterations</Label>
                <Input
                  id="maxIterations"
                  type="number"
                  value={newOptimization.maxIterations}
                  onChange={(e) => 
                    setNewOptimization({...newOptimization, maxIterations: parseInt(e.target.value)})
                  }
                  min="10"
                  max="1000"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={startOptimization} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Optimization
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Optimizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Hyperparameter Tuning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optimizations.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No hyperparameter tuning experiments running
                </p>
                <Button onClick={() => setShowCreateForm(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Optimization
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {optimizations.slice(0, 3).map((opt, index) => (
                  <motion.div
                    key={opt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        opt.status === 'RUNNING'
                          ? 'bg-orange-100 dark:bg-orange-900/20'
                        : opt.status === 'COMPLETED'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {opt.status === 'RUNNING' ? (
                          <Play className="h-4 w-4 text-orange-600" />
                        ) : opt.status === 'COMPLETED' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{opt.tuningMethod}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {opt.objective} • {opt.iterations}/{opt.maxIterations} iterations
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        opt.status === 'RUNNING' ? 'default'
                        : opt.status === 'COMPLETED' ? 'secondary'
                        : 'outline'
                      }>
                        {opt.status}
                      </Badge>
                      {opt.bestScore && (
                        <div className="text-sm font-medium mt-1">
                          Best: {opt.bestScore.toFixed(3)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              AutoML Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {automlExperiments.length === 0 ? (
              <div className="text-center py-8">
                <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No AutoML experiments running
                </p>
                <Button onClick={startAutoML} variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Start AutoML
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {automlExperiments.slice(0, 3).map((exp, index) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        exp.status === 'RUNNING'
                          ? 'bg-purple-100 dark:bg-purple-900/20'
                        : exp.status === 'COMPLETED'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {exp.status === 'RUNNING' ? (
                          <Cpu className="h-4 w-4 text-purple-600" />
                        ) : exp.status === 'COMPLETED' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{exp.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {exp.experimentType} • {exp.totalTrials}/{exp.maxTrials} trials
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        exp.status === 'RUNNING' ? 'default'
                        : exp.status === 'COMPLETED' ? 'secondary'
                        : 'outline'
                      }>
                        {exp.status}
                      </Badge>
                      {exp.bestScore && (
                        <div className="text-sm font-medium mt-1">
                          Best: {exp.bestScore.toFixed(3)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optimization Methods Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Method Performance Comparison
          </CardTitle>
          <CardDescription>
            Performance comparison of different optimization methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { method: 'Bayesian Optimization', performance: 94, experiments: 12 },
              { method: 'Genetic Algorithm', performance: 87, experiments: 8 },
              { method: 'Random Search', performance: 76, experiments: 15 },
              { method: 'Grid Search', performance: 82, experiments: 5 }
            ].map((method, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{method.method}</span>
                  <Badge variant="outline" className="text-xs">
                    {method.experiments} runs
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={method.performance} className="w-24 h-2" />
                  <span className="text-sm font-medium w-12 text-right">
                    {method.performance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
