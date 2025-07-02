
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Share,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Area } from 'recharts';

interface ReportConfig {
  id?: string;
  name: string;
  description: string;
  type: 'PROJECT_PERFORMANCE' | 'TEAM_ANALYTICS' | 'RESOURCE_OPTIMIZATION' | 'EXECUTIVE_SUMMARY' | 'CUSTOM_ANALYSIS' | 'BENCHMARK_COMPARISON';
  projectIds: string[];
  userIds: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: {
    status?: string[];
    priority?: string[];
    categories?: string[];
    metrics?: string[];
  };
  format: 'PDF' | 'EXCEL' | 'JSON' | 'CSV';
  isScheduled: boolean;
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    time: string;
    recipients: string[];
  };
  visualizations: {
    charts: string[];
    tables: string[];
    kpis: string[];
  };
  customFields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
  }>;
}

interface SavedReport {
  id: string;
  name: string;
  type: string;
  description?: string;
  projectIds: string[];
  userIds: string[];
  generatedBy: string;
  format: string;
  fileUrl?: string;
  isScheduled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Partial<ReportConfig>;
  isSystem: boolean;
}

interface AdvancedReportingInterfaceProps {
  availableProjects: Array<{ id: string; name: string }>;
  availableUsers: Array<{ id: string; name: string; email: string }>;
  className?: string;
}

const AdvancedReportingInterface: React.FC<AdvancedReportingInterfaceProps> = ({ 
  availableProjects = [],
  availableUsers = [],
  className = '' 
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    type: 'PROJECT_PERFORMANCE',
    projectIds: [],
    userIds: [],
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    filters: {},
    format: 'PDF',
    isScheduled: false,
    visualizations: {
      charts: ['performance_trend', 'utilization_chart'],
      tables: ['project_summary', 'task_breakdown'],
      kpis: ['completion_rate', 'velocity', 'quality_score']
    },
    customFields: []
  });

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchSavedReports();
    loadReportTemplates();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const response = await fetch('/api/projects/analytics/reports');
      if (response.ok) {
        const data = await response.json();
        setSavedReports(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching saved reports:', err);
    }
  };

  const loadReportTemplates = () => {
    // System-defined report templates
    const systemTemplates: ReportTemplate[] = [
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level overview for stakeholders',
        type: 'EXECUTIVE_SUMMARY',
        isSystem: true,
        config: {
          type: 'EXECUTIVE_SUMMARY',
          format: 'PDF',
          visualizations: {
            charts: ['portfolio_health', 'budget_overview'],
            tables: ['project_status', 'key_metrics'],
            kpis: ['overall_progress', 'budget_utilization', 'team_utilization']
          }
        }
      },
      {
        id: 'project_performance',
        name: 'Project Performance Report',
        description: 'Detailed project analytics and metrics',
        type: 'PROJECT_PERFORMANCE',
        isSystem: true,
        config: {
          type: 'PROJECT_PERFORMANCE',
          format: 'PDF',
          visualizations: {
            charts: ['performance_trend', 'velocity_chart', 'quality_metrics'],
            tables: ['task_breakdown', 'milestone_status', 'resource_allocation'],
            kpis: ['completion_rate', 'velocity', 'quality_score', 'budget_variance']
          }
        }
      },
      {
        id: 'team_analytics',
        name: 'Team Performance Analytics',
        description: 'Team productivity and collaboration insights',
        type: 'TEAM_ANALYTICS',
        isSystem: true,
        config: {
          type: 'TEAM_ANALYTICS',
          format: 'PDF',
          visualizations: {
            charts: ['productivity_trend', 'collaboration_radar', 'workload_distribution'],
            tables: ['individual_performance', 'skill_matrix', 'workload_summary'],
            kpis: ['team_velocity', 'collaboration_score', 'satisfaction_index']
          }
        }
      },
      {
        id: 'resource_optimization',
        name: 'Resource Optimization Report',
        description: 'Resource utilization and optimization recommendations',
        type: 'RESOURCE_OPTIMIZATION',
        isSystem: true,
        config: {
          type: 'RESOURCE_OPTIMIZATION',
          format: 'PDF',
          visualizations: {
            charts: ['utilization_trend', 'capacity_forecast', 'cost_analysis'],
            tables: ['allocation_matrix', 'optimization_recommendations', 'capacity_planning'],
            kpis: ['utilization_rate', 'cost_efficiency', 'capacity_gap']
          }
        }
      }
    ];
    setReportTemplates(systemTemplates);
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/projects/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportConfig.type,
          projectIds: reportConfig.projectIds,
          userIds: reportConfig.userIds,
          filters: {
            ...reportConfig.filters,
            dateRange: reportConfig.dateRange
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.data);
        setShowPreview(true);
        await fetchSavedReports(); // Refresh saved reports list
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const saveReportConfig = async () => {
    try {
      setLoading(true);
      // Save report configuration logic here
      console.log('Saving report config:', reportConfig);
      // This would typically save to a user's custom templates
    } catch (err) {
      console.error('Error saving report config:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template && template.config) {
      setReportConfig(prev => ({
        ...prev,
        ...template.config,
        name: template.name,
        description: template.description
      }));
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Download logic here
      console.log('Downloading report:', reportId);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      // Delete logic here
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleConfigChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: value
      }
    }));
  };

  const handleVisualizationChange = (type: 'charts' | 'tables' | 'kpis', items: string[]) => {
    setReportConfig(prev => ({
      ...prev,
      visualizations: {
        ...prev.visualizations,
        [type]: items
      }
    }));
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_PERFORMANCE': return <BarChart3 className="h-4 w-4" />;
      case 'TEAM_ANALYTICS': return <Users className="h-4 w-4" />;
      case 'RESOURCE_OPTIMIZATION': return <Target className="h-4 w-4" />;
      case 'EXECUTIVE_SUMMARY': return <TrendingUp className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'PDF': return 'bg-red-100 text-red-700';
      case 'EXCEL': return 'bg-green-100 text-green-700';
      case 'JSON': return 'bg-blue-100 text-blue-700';
      case 'CSV': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Sample preview data for demonstration
  const sampleChartData = [
    { name: 'Week 1', performance: 85, target: 90 },
    { name: 'Week 2', performance: 88, target: 90 },
    { name: 'Week 3', performance: 92, target: 90 },
    { name: 'Week 4', performance: 87, target: 90 }
  ];

  const availableCharts = [
    { id: 'performance_trend', name: 'Performance Trend', icon: TrendingUp },
    { id: 'utilization_chart', name: 'Resource Utilization', icon: BarChart3 },
    { id: 'velocity_chart', name: 'Team Velocity', icon: Zap },
    { id: 'quality_metrics', name: 'Quality Metrics', icon: CheckCircle },
    { id: 'budget_overview', name: 'Budget Overview', icon: DollarSign },
    { id: 'timeline_chart', name: 'Project Timeline', icon: Calendar }
  ];

  const availableKPIs = [
    { id: 'completion_rate', name: 'Completion Rate', icon: Target },
    { id: 'velocity', name: 'Team Velocity', icon: Zap },
    { id: 'quality_score', name: 'Quality Score', icon: CheckCircle },
    { id: 'budget_utilization', name: 'Budget Utilization', icon: DollarSign },
    { id: 'team_utilization', name: 'Team Utilization', icon: Users },
    { id: 'schedule_adherence', name: 'Schedule Adherence', icon: Clock }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Reporting</h2>
          <p className="text-gray-600">Create custom reports and analytics dashboards</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={generateReport}
            disabled={generating || reportConfig.projectIds.length === 0}
            className="flex items-center space-x-2"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            <span>{generating ? 'Generating...' : 'Generate Report'}</span>
          </Button>
          <Button onClick={saveReportConfig} variant="outline" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Config
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Configuration</CardTitle>
                  <CardDescription>Set up your report parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input
                        id="report-name"
                        value={reportConfig.name}
                        onChange={(e) => handleConfigChange('name', e.target.value)}
                        placeholder="Enter report name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={reportConfig.type} onValueChange={(value) => handleConfigChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROJECT_PERFORMANCE">Project Performance</SelectItem>
                          <SelectItem value="TEAM_ANALYTICS">Team Analytics</SelectItem>
                          <SelectItem value="RESOURCE_OPTIMIZATION">Resource Optimization</SelectItem>
                          <SelectItem value="EXECUTIVE_SUMMARY">Executive Summary</SelectItem>
                          <SelectItem value="CUSTOM_ANALYSIS">Custom Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="report-description">Description</Label>
                    <Textarea
                      id="report-description"
                      value={reportConfig.description}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      placeholder="Enter report description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="output-format">Output Format</Label>
                      <Select value={reportConfig.format} onValueChange={(value) => handleConfigChange('format', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="EXCEL">Excel</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date Range</Label>
                      <DateRangePicker
                        value={reportConfig.dateRange}
                        onChange={(range: any) => range && handleConfigChange('dateRange', range)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>Select projects and team members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Projects</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {availableProjects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={reportConfig.projectIds.includes(project.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleConfigChange('projectIds', [...reportConfig.projectIds, project.id]);
                              } else {
                                handleConfigChange('projectIds', reportConfig.projectIds.filter(id => id !== project.id));
                              }
                            }}
                          />
                          <Label htmlFor={`project-${project.id}`} className="text-sm">
                            {project.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Team Members (Optional)</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={reportConfig.userIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleConfigChange('userIds', [...reportConfig.userIds, user.id]);
                              } else {
                                handleConfigChange('userIds', reportConfig.userIds.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <Label htmlFor={`user-${user.id}`} className="text-sm">
                            {user.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualizations */}
              <Card>
                <CardHeader>
                  <CardTitle>Visualizations</CardTitle>
                  <CardDescription>Select charts and KPIs to include</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Charts</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCharts.map((chart) => {
                        const Icon = chart.icon;
                        return (
                          <div key={chart.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`chart-${chart.id}`}
                              checked={reportConfig.visualizations.charts.includes(chart.id)}
                              onCheckedChange={(checked) => {
                                const currentCharts = reportConfig.visualizations.charts;
                                if (checked) {
                                  handleVisualizationChange('charts', [...currentCharts, chart.id]);
                                } else {
                                  handleVisualizationChange('charts', currentCharts.filter(id => id !== chart.id));
                                }
                              }}
                            />
                            <Label htmlFor={`chart-${chart.id}`} className="text-xs flex items-center space-x-1">
                              <Icon className="h-3 w-3" />
                              <span>{chart.name}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Key Performance Indicators</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableKPIs.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                          <div key={kpi.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`kpi-${kpi.id}`}
                              checked={reportConfig.visualizations.kpis.includes(kpi.id)}
                              onCheckedChange={(checked) => {
                                const currentKPIs = reportConfig.visualizations.kpis;
                                if (checked) {
                                  handleVisualizationChange('kpis', [...currentKPIs, kpi.id]);
                                } else {
                                  handleVisualizationChange('kpis', currentKPIs.filter(id => id !== kpi.id));
                                }
                              }}
                            />
                            <Label htmlFor={`kpi-${kpi.id}`} className="text-xs flex items-center space-x-1">
                              <Icon className="h-3 w-3" />
                              <span>{kpi.name}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduling (Optional)</CardTitle>
                  <CardDescription>Set up automated report generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-scheduling"
                      checked={reportConfig.isScheduled}
                      onCheckedChange={(checked) => handleConfigChange('isScheduled', checked)}
                    />
                    <Label htmlFor="enable-scheduling">Enable Scheduled Reports</Label>
                  </div>
                  {reportConfig.isScheduled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>Frequency</Label>
                        <Select 
                          value={reportConfig.schedule?.frequency || 'WEEKLY'} 
                          onValueChange={(value) => handleConfigChange('schedule', { 
                            ...reportConfig.schedule, 
                            frequency: value 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={reportConfig.schedule?.time || '09:00'}
                          onChange={(e) => handleConfigChange('schedule', { 
                            ...reportConfig.schedule, 
                            time: e.target.value 
                          })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>Live preview of your report</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportConfig.visualizations.charts.includes('performance_trend') && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Performance Trend</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={sampleChartData}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="performance" stroke="#60B5FF" strokeWidth={2} />
                          <Line type="monotone" dataKey="target" stroke="#E5E7EB" strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {reportConfig.visualizations.kpis.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {reportConfig.visualizations.kpis.slice(0, 4).map((kpiId) => {
                          const kpi = availableKPIs.find(k => k.id === kpiId);
                          if (!kpi) return null;
                          const Icon = kpi.icon;
                          return (
                            <div key={kpiId} className="p-2 bg-blue-50 rounded text-center">
                              <Icon className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                              <div className="text-lg font-bold text-blue-900">87%</div>
                              <div className="text-xs text-blue-700">{kpi.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Type:</span>
                    <div className="flex items-center space-x-1 mt-1">
                      {getReportTypeIcon(reportConfig.type)}
                      <span>{reportConfig.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Projects:</span>
                    <span className="ml-2">{reportConfig.projectIds.length} selected</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Team Members:</span>
                    <span className="ml-2">{reportConfig.userIds.length} selected</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Charts:</span>
                    <span className="ml-2">{reportConfig.visualizations.charts.length} selected</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">KPIs:</span>
                    <span className="ml-2">{reportConfig.visualizations.kpis.length} selected</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Format:</span>
                    <Badge className={`ml-2 ${getFormatColor(reportConfig.format)}`}>
                      {reportConfig.format}
                    </Badge>
                  </div>
                  {reportConfig.isScheduled && (
                    <div className="text-sm">
                      <span className="font-medium">Scheduled:</span>
                      <span className="ml-2">{reportConfig.schedule?.frequency}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-configured report templates for common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      loadTemplate(template.id);
                      setActiveTab('builder');
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getReportTypeIcon(template.type)}
                        <h4 className="font-medium text-sm">{template.name}</h4>
                      </div>
                      {template.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getFormatColor(template.config.format || 'PDF')}>
                        {template.config.format || 'PDF'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        loadTemplate(template.id);
                        setActiveTab('builder');
                      }}>
                        Use Template
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Saved Reports</CardTitle>
                  <CardDescription>Previously generated reports</CardDescription>
                </div>
                <Button onClick={fetchSavedReports} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {savedReports.length > 0 ? (
                <div className="space-y-3">
                  {savedReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getReportTypeIcon(report.type)}
                            <h4 className="font-medium text-sm">{report.name}</h4>
                            <Badge className={getFormatColor(report.format)}>
                              {report.format}
                            </Badge>
                            {report.isScheduled && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          {report.description && (
                            <p className="text-xs text-gray-600 mb-2">{report.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            Projects: {report.projectIds.length} • 
                            Users: {report.userIds.length} • 
                            Generated: {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => downloadReport(report.id)}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteReport(report.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No saved reports found</p>
                  <Button onClick={() => setActiveTab('builder')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No scheduled reports configured</p>
                <p className="text-sm text-gray-500 mb-4">
                  Set up automated reports in the Report Builder to have them appear here
                </p>
                <Button onClick={() => setActiveTab('builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule a Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              Preview of generated report data
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Report generated successfully with {Object.keys(previewData).length} data sections
              </div>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedReportingInterface;
