
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Brain, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MLModelItem, MLTrainingJobItem } from '@/lib/types';
import { format } from 'date-fns';

interface ModelManagementPanelProps {
  tenantId: string;
  userId?: string;
  dashboardData?: any;
}

export function ModelManagementPanel({ tenantId, userId, dashboardData }: ModelManagementPanelProps) {
  const [models, setModels] = useState<MLModelItem[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<MLTrainingJobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<MLModelItem | null>(null);
  const [createModelOpen, setCreateModelOpen] = useState(false);
  const [trainModelOpen, setTrainModelOpen] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml/models');
      if (response.ok) {
        const result = await response.json();
        setModels(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingJobs = async () => {
    try {
      const response = await fetch('/api/ml/training');
      if (response.ok) {
        const result = await response.json();
        setTrainingJobs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch training jobs:', error);
    }
  };

  const createModel = async (modelData: any) => {
    try {
      const response = await fetch('/api/ml/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      });

      if (response.ok) {
        await fetchModels();
        setCreateModelOpen(false);
      }
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const deployModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ml/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy' }),
      });

      if (response.ok) {
        await fetchModels();
      }
    } catch (error) {
      console.error('Failed to deploy model:', error);
    }
  };

  const trainModel = async (modelId: string, trainingConfig: any) => {
    try {
      const response = await fetch('/api/ml/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          dataSource: trainingConfig.dataSource,
          trainingConfig: {
            epochs: trainingConfig.epochs,
            batchSize: trainingConfig.batchSize,
            learningRate: trainingConfig.learningRate,
            validationSplit: trainingConfig.validationSplit,
          },
        }),
      });

      if (response.ok) {
        await fetchTrainingJobs();
        setTrainModelOpen(false);
      }
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchTrainingJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DEPLOYED': return 'text-green-600 bg-green-100';
      case 'TRAINED': return 'text-blue-600 bg-blue-100';
      case 'TRAINING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DEPLOYED': return <CheckCircle className="h-4 w-4" />;
      case 'TRAINED': return <Database className="h-4 w-4" />;
      case 'TRAINING': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'FAILED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REGRESSION': return <TrendingUp className="h-4 w-4" />;
      case 'CLASSIFICATION': return <Target className="h-4 w-4" />;
      case 'TIME_SERIES': return <Activity className="h-4 w-4" />;
      case 'CLUSTERING': return <BarChart3 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-500" />
            Model Management
          </h2>
          <p className="text-muted-foreground">
            Manage machine learning models, training, and deployment
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createModelOpen} onOpenChange={setCreateModelOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Create Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New ML Model</DialogTitle>
                <DialogDescription>
                  Configure a new machine learning model
                </DialogDescription>
              </DialogHeader>
              <CreateModelForm onSubmit={createModel} onCancel={() => setCreateModelOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={fetchModels}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Model Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{models.length}</div>
                <div className="text-sm text-muted-foreground">Total Models</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{models.filter(m => m.status === 'DEPLOYED').length}</div>
                <div className="text-sm text-muted-foreground">Deployed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{trainingJobs.filter(j => j.status === 'RUNNING').length}</div>
                <div className="text-sm text-muted-foreground">Training</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((models.reduce((acc, m) => acc + (m.accuracy || 0), 0) / Math.max(models.length, 1)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="training">Training Jobs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Machine Learning Models</CardTitle>
                <CardDescription>
                  Manage your trained and deployed ML models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Models Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first ML model to get started
                    </p>
                    <Button onClick={() => setCreateModelOpen(true)}>
                      Create Model
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {models.map((model) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(model.type)}
                            <div>
                              <h3 className="font-semibold">{model.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {model.algorithm} • v{model.version}
                              </p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(model.status)}`}>
                            {getStatusIcon(model.status)}
                            {model.status}
                          </div>
                        </div>

                        {model.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {model.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-medium">Accuracy</div>
                            <div className="text-lg font-bold">
                              {model.accuracy ? `${Math.round(model.accuracy * 100)}%` : 'N/A'}
                            </div>
                            {model.accuracy && (
                              <Progress value={model.accuracy * 100} className="h-1 mt-1" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">Usage</div>
                            <div className="text-lg font-bold">{model.usageCount || 0}</div>
                            <div className="text-xs text-muted-foreground">predictions</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <span>Features: {model.featureColumns?.length || 0}</span>
                          <span>•</span>
                          <span>
                            Last trained: {model.lastTrainingDate 
                              ? format(new Date(model.lastTrainingDate), 'MMM dd')
                              : 'Never'
                            }
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {model.status === 'TRAINED' && (
                            <Button 
                              size="sm" 
                              onClick={() => deployModel(model.id)}
                              className="flex-1"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Deploy
                            </Button>
                          )}
                          
                          <Dialog open={trainModelOpen} onOpenChange={setTrainModelOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedModel(model)}
                                className="flex-1"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Train
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Train Model</DialogTitle>
                                <DialogDescription>
                                  Configure training parameters for {selectedModel?.name}
                                </DialogDescription>
                              </DialogHeader>
                              <TrainModelForm 
                                model={selectedModel}
                                onSubmit={(config) => selectedModel && trainModel(selectedModel.id, config)}
                                onCancel={() => setTrainModelOpen(false)}
                              />
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Config
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Jobs Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Jobs</CardTitle>
                <CardDescription>
                  Monitor model training progress and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trainingJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Training Jobs</h3>
                    <p className="text-muted-foreground">
                      Training jobs will appear here when you start training models
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trainingJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{job.jobName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.model?.name} • Started {format(new Date(job.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {job.duration && (
                            <div className="text-sm font-medium">
                              {Math.round(job.duration / 1000)}s
                            </div>
                          )}
                          {job.validationAccuracy && (
                            <div className="text-xs text-muted-foreground">
                              Accuracy: {Math.round(job.validationAccuracy * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed performance analysis of your ML models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {models.filter(m => m.accuracy).map((model) => (
                    <div key={model.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{model.name}</h4>
                      <div className="space-y-3">
                        {model.accuracy && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Accuracy</span>
                            <span className="font-medium">{Math.round(model.accuracy * 100)}%</span>
                          </div>
                        )}
                        {model.precision && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Precision</span>
                            <span className="font-medium">{Math.round(model.precision * 100)}%</span>
                          </div>
                        )}
                        {model.recall && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Recall</span>
                            <span className="font-medium">{Math.round(model.recall * 100)}%</span>
                          </div>
                        )}
                        {model.f1Score && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">F1 Score</span>
                            <span className="font-medium">{Math.round(model.f1Score * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Form Components
function CreateModelForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    algorithm: '',
    description: '',
    featureColumns: '',
    targetColumn: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      featureColumns: formData.featureColumns.split(',').map(s => s.trim()),
      configParams: {},
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Model Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="type">Model Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REGRESSION">Regression</SelectItem>
            <SelectItem value="CLASSIFICATION">Classification</SelectItem>
            <SelectItem value="TIME_SERIES">Time Series</SelectItem>
            <SelectItem value="CLUSTERING">Clustering</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="algorithm">Algorithm</Label>
        <Input
          id="algorithm"
          value={formData.algorithm}
          onChange={(e) => setFormData(prev => ({ ...prev, algorithm: e.target.value }))}
          placeholder="e.g., LINEAR_REGRESSION, RANDOM_FOREST"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Model description..."
        />
      </div>
      
      <div>
        <Label htmlFor="features">Feature Columns</Label>
        <Input
          id="features"
          value={formData.featureColumns}
          onChange={(e) => setFormData(prev => ({ ...prev, featureColumns: e.target.value }))}
          placeholder="feature1, feature2, feature3"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="target">Target Column (optional)</Label>
        <Input
          id="target"
          value={formData.targetColumn}
          onChange={(e) => setFormData(prev => ({ ...prev, targetColumn: e.target.value }))}
          placeholder="target_column"
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit">Create Model</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TrainModelForm({ 
  model, 
  onSubmit, 
  onCancel 
}: { 
  model: MLModelItem | null; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    dataSource: 'sales',
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="dataSource">Data Source</Label>
        <Select value={formData.dataSource} onValueChange={(value) => setFormData(prev => ({ ...prev, dataSource: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Data</SelectItem>
            <SelectItem value="cashflow">Cash Flow Data</SelectItem>
            <SelectItem value="projects">Project Data</SelectItem>
            <SelectItem value="customers">Customer Data</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="epochs">Epochs</Label>
          <Input
            id="epochs"
            type="number"
            value={formData.epochs}
            onChange={(e) => setFormData(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
            min="1"
            max="1000"
          />
        </div>
        <div>
          <Label htmlFor="batchSize">Batch Size</Label>
          <Input
            id="batchSize"
            type="number"
            value={formData.batchSize}
            onChange={(e) => setFormData(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
            min="1"
            max="1000"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="learningRate">Learning Rate</Label>
          <Input
            id="learningRate"
            type="number"
            step="0.0001"
            value={formData.learningRate}
            onChange={(e) => setFormData(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
            min="0.0001"
            max="1"
          />
        </div>
        <div>
          <Label htmlFor="validationSplit">Validation Split</Label>
          <Input
            id="validationSplit"
            type="number"
            step="0.01"
            value={formData.validationSplit}
            onChange={(e) => setFormData(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
            min="0.1"
            max="0.5"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button type="submit">Start Training</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
