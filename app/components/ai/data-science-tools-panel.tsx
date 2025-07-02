
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Database, 
  Filter, 
  Download,
  Upload,
  Settings,
  Play,
  RefreshCw,
  FileText,
  PieChart,
  LineChart,
  Zap,
  Target,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { DataQualityMetrics } from '@/lib/types';

interface DataScienceToolsPanelProps {
  tenantId: string;
  userId?: string;
}

export function DataScienceToolsPanel({ tenantId, userId }: DataScienceToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('explorer');
  const [dataSource, setDataSource] = useState('sales');
  const [features, setFeatures] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [preprocessing, setPreprocessing] = useState({
    normalization: 'minmax',
    handleMissing: 'mean',
    polynomialDegree: 1,
    varianceThreshold: 0.01,
  });

  const extractFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSource,
          preprocessing: preprocessing,
          dateRange: {
            startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setFeatures(result.data);
        setQualityMetrics(result.data.qualityMetrics);
      }
    } catch (error) {
      console.error('Failed to extract features:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDataQualityAssessment = async () => {
    if (!features?.processedFeatures) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ml/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_quality',
          data: features.processedFeatures,
          featureNames: features.originalFeatures.featureNames,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQualityMetrics(result.data);
      }
    } catch (error) {
      console.error('Failed to assess data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for visualization
  const mockCorrelationData = [
    { feature1: 'Revenue', feature2: 'Customer Count', correlation: 0.85 },
    { feature1: 'Revenue', feature2: 'Marketing Spend', correlation: 0.72 },
    { feature1: 'Customer Count', feature2: 'Support Tickets', correlation: -0.45 },
    { feature1: 'Marketing Spend', feature2: 'Lead Count', correlation: 0.68 },
    { feature1: 'Lead Count', feature2: 'Conversion Rate', correlation: 0.34 },
  ];

  const mockDistributionData = [
    { value: '0-10K', count: 25 },
    { value: '10-25K', count: 45 },
    { value: '25-50K', count: 35 },
    { value: '50-100K', count: 20 },
    { value: '100K+', count: 8 },
  ];

  const mockTrendData = [
    { month: 'Jan', sales: 120000, customers: 45, leads: 125 },
    { month: 'Feb', sales: 135000, customers: 52, leads: 140 },
    { month: 'Mar', sales: 145000, customers: 48, leads: 155 },
    { month: 'Apr', sales: 155000, customers: 61, leads: 170 },
    { month: 'May', sales: 165000, customers: 58, leads: 185 },
    { month: 'Jun', sales: 175000, customers: 65, leads: 195 },
  ];

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
            <BarChart3 className="h-6 w-6 text-purple-500" />
            Data Science Tools
          </h2>
          <p className="text-muted-foreground">
            Interactive data exploration, feature engineering, and analysis tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </motion.div>

      {/* Main Tools Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="explorer">Data Explorer</TabsTrigger>
            <TabsTrigger value="preprocessing">Preprocessing</TabsTrigger>
            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger value="analysis">Statistical Analysis</TabsTrigger>
          </TabsList>

          {/* Data Explorer Tab */}
          <TabsContent value="explorer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Data Source Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Source
                  </CardTitle>
                  <CardDescription>
                    Select data source for exploration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Source Type</Label>
                    <Select value={dataSource} onValueChange={setDataSource}>
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
                  
                  <Button 
                    onClick={extractFeatures} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Load Data
                  </Button>

                  {features && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Features:</span>
                        <span className="font-medium">{features.featureCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Samples:</span>
                        <span className="font-medium">{features.sampleCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Data Quality:</span>
                        <span className="font-medium">
                          {qualityMetrics ? `${Math.round(qualityMetrics.overall * 100)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Data Preview
                  </CardTitle>
                  <CardDescription>
                    Raw and processed data overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : features ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {features.originalFeatures.featureNames.length}
                          </div>
                          <div className="text-sm text-blue-600">Original Features</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {features.featureCount}
                          </div>
                          <div className="text-sm text-green-600">Processed Features</div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Feature Names</h4>
                        <div className="flex flex-wrap gap-2">
                          {features.originalFeatures.featureNames.slice(0, 8).map((name: string, index: number) => (
                            <Badge key={index} variant="outline">{name}</Badge>
                          ))}
                          {features.originalFeatures.featureNames.length > 8 && (
                            <Badge variant="secondary">+{features.originalFeatures.featureNames.length - 8} more</Badge>
                          )}
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Sample Statistics</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Samples:</span>
                            <span className="ml-2 font-medium">{features.sampleCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <span className="ml-2 font-medium">{features.originalFeatures.targetName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium">{dataSource}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a data source and click "Load Data" to begin exploration
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Data Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                  <CardDescription>
                    Time series trends in your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={mockTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution Analysis</CardTitle>
                  <CardDescription>
                    Value distribution patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mockDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="value" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preprocessing Tab */}
          <TabsContent value="preprocessing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preprocessing Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure data preprocessing steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Normalization Method</Label>
                    <Select 
                      value={preprocessing.normalization} 
                      onValueChange={(value) => setPreprocessing(prev => ({ ...prev, normalization: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                        <SelectItem value="zscore">Z-Score Normalization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Missing Value Handling</Label>
                    <Select 
                      value={preprocessing.handleMissing} 
                      onValueChange={(value) => setPreprocessing(prev => ({ ...prev, handleMissing: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mean">Fill with Mean</SelectItem>
                        <SelectItem value="median">Fill with Median</SelectItem>
                        <SelectItem value="mode">Fill with Mode</SelectItem>
                        <SelectItem value="drop">Drop Missing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Polynomial Degree</Label>
                    <Input
                      type="number"
                      value={preprocessing.polynomialDegree}
                      onChange={(e) => setPreprocessing(prev => ({ ...prev, polynomialDegree: parseInt(e.target.value) }))}
                      min="1"
                      max="3"
                    />
                  </div>

                  <div>
                    <Label>Variance Threshold</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={preprocessing.varianceThreshold}
                      onChange={(e) => setPreprocessing(prev => ({ ...prev, varianceThreshold: parseFloat(e.target.value) }))}
                      min="0"
                      max="1"
                    />
                  </div>

                  <Button onClick={extractFeatures} disabled={loading} className="w-full">
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Apply Preprocessing
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Results</CardTitle>
                  <CardDescription>
                    Results from data preprocessing pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {features ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {features.originalFeatures.sampleCount}
                          </div>
                          <div className="text-sm text-blue-600">Original Samples</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {features.sampleCount}
                          </div>
                          <div className="text-sm text-green-600">Processed Samples</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data Completeness</span>
                          <span className="text-sm font-medium">
                            {qualityMetrics ? `${Math.round(qualityMetrics.completeness * 100)}%` : 'N/A'}
                          </span>
                        </div>
                        {qualityMetrics && (
                          <Progress value={qualityMetrics.completeness * 100} className="h-2" />
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data Consistency</span>
                          <span className="text-sm font-medium">
                            {qualityMetrics ? `${Math.round(qualityMetrics.consistency * 100)}%` : 'N/A'}
                          </span>
                        </div>
                        {qualityMetrics && (
                          <Progress value={qualityMetrics.consistency * 100} className="h-2" />
                        )}
                      </div>

                      {features.scalingParams && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-2">Scaling Applied</h4>
                          <Badge variant="outline">
                            {preprocessing.normalization === 'minmax' ? 'Min-Max Scaling' : 'Z-Score Normalization'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Load data first to see preprocessing results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Quality Assessment
                  </CardTitle>
                  <CardDescription>
                    Run comprehensive data quality analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={runDataQualityAssessment} 
                    disabled={loading || !features}
                    className="w-full mb-4"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Target className="h-4 w-4 mr-2" />
                    )}
                    Assess Quality
                  </Button>

                  {qualityMetrics && (
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(qualityMetrics.overall * 100)}%
                        </div>
                        <div className="text-sm text-green-600">Overall Quality</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                  <CardDescription>
                    Detailed data quality breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {qualityMetrics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { name: 'Completeness', value: qualityMetrics.completeness, color: 'blue' },
                          { name: 'Accuracy', value: qualityMetrics.accuracy, color: 'green' },
                          { name: 'Consistency', value: qualityMetrics.consistency, color: 'purple' },
                          { name: 'Timeliness', value: qualityMetrics.timeliness, color: 'orange' },
                          { name: 'Validity', value: qualityMetrics.validity, color: 'red' },
                          { name: 'Uniqueness', value: qualityMetrics.uniqueness, color: 'yellow' },
                        ].map((metric) => (
                          <div key={metric.name} className="text-center p-3 border rounded-lg">
                            <div className="text-lg font-bold">{Math.round(metric.value * 100)}%</div>
                            <div className="text-sm text-muted-foreground">{metric.name}</div>
                            <Progress value={metric.value * 100} className="mt-2 h-1" />
                          </div>
                        ))}
                      </div>

                      {qualityMetrics.issues.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3">Data Quality Issues</h4>
                          <div className="space-y-2">
                            {qualityMetrics.issues.map((issue, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{issue.type}</div>
                                  <div className="text-sm text-muted-foreground">{issue.description}</div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={issue.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                                    {issue.severity}
                                  </Badge>
                                  <div className="text-sm text-muted-foreground">{issue.count} issues</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Run quality assessment to see detailed metrics
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistical Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Correlations</CardTitle>
                  <CardDescription>
                    Correlation matrix between features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockCorrelationData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">{item.feature1}</span>
                          <span className="text-muted-foreground"> × </span>
                          <span className="font-medium">{item.feature2}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{item.correlation.toFixed(2)}</span>
                          <div className={`w-3 h-3 rounded-full ${
                            Math.abs(item.correlation) > 0.7 ? 'bg-red-500' :
                            Math.abs(item.correlation) > 0.5 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistical Summary</CardTitle>
                  <CardDescription>
                    Descriptive statistics for numeric features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Revenue Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span>Mean:</span>
                          <span className="font-mono">$148,333</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Median:</span>
                          <span className="font-mono">$150,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Std Dev:</span>
                          <span className="font-mono">$18,457</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-mono">$55,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Customer Count Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span>Mean:</span>
                          <span className="font-mono">54.8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Median:</span>
                          <span className="font-mono">53.5</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Std Dev:</span>
                          <span className="font-mono">7.2</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-mono">20</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Insights</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Strong correlation between revenue and customer count</li>
                        <li>• Normal distribution in most numeric features</li>
                        <li>• Low variance in conversion metrics</li>
                        <li>• Seasonal patterns detected in time series</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Importance */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance Analysis</CardTitle>
                <CardDescription>
                  Most important features for prediction tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Historical Revenue Trend', importance: 0.35 },
                    { name: 'Customer Count', importance: 0.28 },
                    { name: 'Seasonality Index', importance: 0.22 },
                    { name: 'Marketing Spend', importance: 0.15 },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{feature.name}</span>
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <Progress value={feature.importance * 100} className="h-2" />
                        <span className="text-sm font-mono w-12">{Math.round(feature.importance * 100)}%</span>
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
