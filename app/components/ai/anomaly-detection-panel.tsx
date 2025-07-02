
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Filter,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { MLAnomalyDetectionItem } from '@/lib/types';
import { format } from 'date-fns';

interface AnomalyDetectionPanelProps {
  tenantId: string;
  userId?: string;
  dashboardData?: any;
}

export function AnomalyDetectionPanel({ tenantId, userId, dashboardData }: AnomalyDetectionPanelProps) {
  const [anomalies, setAnomalies] = useState<MLAnomalyDetectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoDetection, setAutoDetection] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('OPEN');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('anomalyType', selectedType);
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('limit', '50');

      const response = await fetch(`/api/ml/anomalies?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setAnomalies(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnomalyDetection = async (type: string = 'comprehensive') => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, autoDetect: true }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh anomalies list
        await fetchAnomalies();
      }
    } catch (error) {
      console.error('Failed to run anomaly detection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnomalyAction = async (anomalyId: string, action: string) => {
    try {
      const response = await fetch('/api/ml/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, anomalyId }),
      });

      if (response.ok) {
        await fetchAnomalies();
      }
    } catch (error) {
      console.error('Failed to update anomaly:', error);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [selectedType, selectedSeverity, selectedStatus]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
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
      case 'FINANCIAL': return <DollarSign className="h-4 w-4" />;
      case 'PROJECT': return <Activity className="h-4 w-4" />;
      case 'CUSTOMER_BEHAVIOR': return <Users className="h-4 w-4" />;
      case 'PERFORMANCE': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const anomaliesByType = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.anomalyType] = (acc[anomaly.anomalyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anomaliesBySeverity = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            Anomaly Detection System
          </h2>
          <p className="text-muted-foreground">
            Real-time anomaly detection across financial, project, and customer data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto Detection</span>
            <Switch 
              checked={autoDetection} 
              onCheckedChange={setAutoDetection}
            />
          </div>
          <Button 
            onClick={() => runAnomalyDetection('comprehensive')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Detection
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{anomalies.filter(a => a.status === 'OPEN').length}</div>
                <div className="text-sm text-muted-foreground">Open Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{anomaliesBySeverity.CRITICAL || 0}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
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
                <div className="text-2xl font-bold">{anomalies.filter(a => a.status === 'RESOLVED').length}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((anomalies.filter(a => a.falsePositive !== true).length / Math.max(anomalies.length, 1)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detection Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Detection Categories</CardTitle>
            <CardDescription>
              Anomaly detection across different business areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'FINANCIAL', name: 'Financial', icon: DollarSign, color: 'green' },
                { type: 'PROJECT', name: 'Project', icon: Activity, color: 'blue' },
                { type: 'CUSTOMER_BEHAVIOR', name: 'Customer', icon: Users, color: 'purple' },
                { type: 'PERFORMANCE', name: 'Performance', icon: TrendingUp, color: 'orange' },
              ].map((category) => {
                const Icon = category.icon;
                const count = anomaliesByType[category.type] || 0;
                return (
                  <div
                    key={category.type}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => runAnomalyDetection(category.type.toLowerCase())}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 text-${category.color}-500`} />
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {count} anomalies detected
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        runAnomalyDetection(category.type.toLowerCase());
                      }}
                    >
                      Scan Now
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Anomalies List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detected Anomalies</CardTitle>
                <CardDescription>
                  Recent anomalies requiring attention
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="CUSTOMER_BEHAVIOR">Customer</SelectItem>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Anomalies Detected</h3>
                <p className="text-muted-foreground">
                  Your systems are operating normally
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <motion.div
                    key={anomaly.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(anomaly.severity)}`} />
                            {getTypeIcon(anomaly.anomalyType)}
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{anomaly.description}</h4>
                            <Badge variant={getSeverityBadgeVariant(anomaly.severity) as any}>
                              {anomaly.severity}
                            </Badge>
                            <Badge variant="outline">
                              {anomaly.anomalyType}
                            </Badge>
                          </div>
                          
                          {anomaly.explanation && (
                            <p className="text-sm text-muted-foreground">
                              {anomaly.explanation}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Score: {Math.round(anomaly.anomalyScore * 100)}%</span>
                            <span>Method: {anomaly.detectionMethod}</span>
                            <span>Detected: {format(new Date(anomaly.detectedAt), 'MMM dd, HH:mm')}</span>
                          </div>
                          
                          {anomaly.recommendations && Array.isArray(anomaly.recommendations) && anomaly.recommendations.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {anomaly.recommendations.slice(0, 3).map((rec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {rec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {anomaly.status === 'OPEN' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAnomalyAction(anomaly.id, 'acknowledge')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAnomalyAction(anomaly.id, 'resolve')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAnomalyAction(anomaly.id, 'false_positive')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              False Positive
                            </Button>
                          </>
                        )}
                        {anomaly.status === 'ACKNOWLEDGED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnomalyAction(anomaly.id, 'resolve')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {(anomaly.status === 'RESOLVED' || anomaly.status === 'FALSE_POSITIVE') && (
                          <Badge variant="outline">
                            {anomaly.status === 'RESOLVED' ? 'Resolved' : 'False Positive'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
