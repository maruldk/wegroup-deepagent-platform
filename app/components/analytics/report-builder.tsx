// @ts-nocheck
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  FileText, 
  Plus, 
  Save, 
  Download, 
  Send,
  Calendar,
  Filter,
  Eye,
  Settings,
  Trash2,
  Copy,
  BarChart3,
  Table,
  PieChart,
  TrendingUp,
  Clock,
  Users,
  Mail,
  FileSpreadsheet,
  FileType,
  FileImage,
  Database,
  Layers,
  Layout,
  Palette,
  ChevronDown,
  ChevronRight,
  Zap,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  template: ReportTemplate;
  dataSource: DataSourceConfig;
  filters: FilterConfig[];
  sections: ReportSection[];
  styling: ReportStyling;
  schedule: ScheduleConfig;
  distribution: DistributionConfig;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: 'executive' | 'financial' | 'operational' | 'custom';
  layout: 'portrait' | 'landscape';
  sections: string[];
  defaultStyling: ReportStyling;
}

export interface DataSourceConfig {
  type: 'database' | 'api' | 'file' | 'manual';
  connection: string;
  query?: string;
  refreshInterval?: number;
  parameters?: Record<string, any>;
}

export interface FilterConfig {
  id: string;
  field: string;
  label: string;
  type: 'date' | 'text' | 'number' | 'select' | 'multiselect';
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
  required: boolean;
  visible: boolean;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'text' | 'chart' | 'table' | 'metrics' | 'image' | 'pagebreak';
  title?: string;
  content: any;
  styling?: SectionStyling;
  conditions?: DisplayCondition[];
}

export interface SectionStyling {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
  border?: boolean;
  borderColor?: string;
}

export interface ReportStyling {
  theme: 'professional' | 'modern' | 'minimal' | 'branded';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  logoUrl?: string;
  headerFooter: boolean;
  pageNumbers: boolean;
  watermark?: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  timezone: string;
  startDate: Date;
  endDate?: Date;
}

export interface DistributionConfig {
  email: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    message: string;
  };
  export: {
    formats: ('pdf' | 'excel' | 'csv' | 'png')[];
    quality: 'low' | 'medium' | 'high';
  };
  storage: {
    location: 'local' | 'cloud' | 'shared';
    retention: number; // days
  };
}

export interface DisplayCondition {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains';
  value: any;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    category: 'executive',
    layout: 'portrait',
    sections: ['header', 'key-metrics', 'charts', 'insights'],
    defaultStyling: {
      theme: 'professional',
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6',
      fontFamily: 'Inter',
      fontSize: 12,
      headerFooter: true,
      pageNumbers: true
    }
  },
  {
    id: 'financial-report',
    name: 'Financial Report',
    category: 'financial',
    layout: 'portrait',
    sections: ['header', 'revenue-metrics', 'expense-breakdown', 'profit-analysis'],
    defaultStyling: {
      theme: 'professional',
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      fontFamily: 'Inter',
      fontSize: 11,
      headerFooter: true,
      pageNumbers: true
    }
  },
  {
    id: 'project-status',
    name: 'Project Status Report',
    category: 'operational',
    layout: 'landscape',
    sections: ['header', 'project-overview', 'timeline', 'team-performance'],
    defaultStyling: {
      theme: 'modern',
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'Inter',
      fontSize: 11,
      headerFooter: true,
      pageNumbers: true
    }
  },
  {
    id: 'custom-blank',
    name: 'Blank Report',
    category: 'custom',
    layout: 'portrait',
    sections: [],
    defaultStyling: {
      theme: 'minimal',
      primaryColor: '#374151',
      secondaryColor: '#6b7280',
      fontFamily: 'Inter',
      fontSize: 12,
      headerFooter: false,
      pageNumbers: false
    }
  }
];

const SECTION_TYPES = [
  { type: 'header', name: 'Header', icon: Layout, description: 'Report title and metadata' },
  { type: 'text', name: 'Text Block', icon: FileText, description: 'Rich text content' },
  { type: 'chart', name: 'Chart', icon: BarChart3, description: 'Data visualization' },
  { type: 'table', name: 'Data Table', icon: Table, description: 'Tabular data display' },
  { type: 'metrics', name: 'Key Metrics', icon: TrendingUp, description: 'KPI cards and metrics' },
  { type: 'image', name: 'Image', icon: FileImage, description: 'Static images or logos' },
  { type: 'pagebreak', name: 'Page Break', icon: Separator, description: 'Force new page' }
];

interface ReportBuilderProps {
  reportId?: string;
  onSave?: (config: ReportConfig) => void;
  onCancel?: () => void;
}

export function ReportBuilder({
  reportId,
  onSave,
  onCancel
}: ReportBuilderProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: reportId || `report_${Date.now()}`,
    name: 'Untitled Report',
    description: '',
    template: REPORT_TEMPLATES[0],
    dataSource: {
      type: 'database',
      connection: 'default',
      refreshInterval: 3600
    },
    filters: [],
    sections: [],
    styling: REPORT_TEMPLATES[0].defaultStyling,
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      timezone: 'Europe/Berlin',
      startDate: new Date()
    },
    distribution: {
      email: {
        enabled: false,
        recipients: [],
        subject: '',
        message: ''
      },
      export: {
        formats: ['pdf'],
        quality: 'medium'
      },
      storage: {
        location: 'local',
        retention: 30
      }
    }
  });

  const [activeTab, setActiveTab] = useState('design');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load existing report if reportId is provided
  useEffect(() => {
    if (reportId) {
      // TODO: Load report from API
      console.log('Loading report:', reportId);
    }
  }, [reportId]);

  // Update report configuration
  const updateConfig = useCallback((updates: Partial<ReportConfig>) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Update nested configuration
  const updateNestedConfig = useCallback(<T extends keyof ReportConfig>(
    key: T,
    updates: Partial<ReportConfig[T]>
  ) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {} as any), ...(updates ?? {} as any) }
    }));
  }, []);

  // Select template
  const selectTemplate = useCallback((template: ReportTemplate) => {
    setReportConfig(prev => ({
      ...prev,
      template,
      styling: { ...template.defaultStyling },
      sections: template.sections.map(sectionType => ({
        id: `section_${Date.now()}_${sectionType}`,
        type: sectionType as any,
        title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
        content: getDefaultSectionContent(sectionType)
      }))
    }));
  }, []);

  // Get default content for section type
  const getDefaultSectionContent = (sectionType: string) => {
    switch (sectionType) {
      case 'header':
        return {
          title: reportConfig.name,
          subtitle: 'Generated on ' + new Date().toLocaleDateString(),
          logo: null
        };
      case 'text':
        return {
          content: 'Enter your text content here...',
          formatting: { bold: false, italic: false, alignment: 'left' }
        };
      case 'chart':
        return {
          chartType: 'line',
          dataSource: 'revenue',
          title: 'Chart Title'
        };
      case 'table':
        return {
          dataSource: 'transactions',
          columns: ['date', 'description', 'amount'],
          sorting: { column: 'date', direction: 'desc' }
        };
      case 'metrics':
        return {
          metrics: [
            { label: 'Total Revenue', value: '€127,000', change: '+12.5%' },
            { label: 'New Customers', value: '23', change: '+8.2%' }
          ]
        };
      default:
        return {};
    }
  };

  // Add new section
  const addSection = useCallback((sectionType: string) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type: sectionType as any,
      title: `New ${sectionType}`,
      content: getDefaultSectionContent(sectionType)
    };

    setReportConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    setSelectedSection(newSection.id);
  }, [reportConfig.name]);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  }, []);

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  }, [selectedSection]);

  // Move section up/down
  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setReportConfig(prev => {
      const sections = [...prev.sections];
      const index = sections.findIndex(s => s.id === sectionId);
      
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      
      return { ...prev, sections };
    });
  }, []);

  // Add filter
  const addFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field: 'date',
      label: 'Date Range',
      type: 'date',
      operator: 'between',
      value: null,
      required: false,
      visible: true
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  }, []);

  // Update filter
  const updateFilter = useCallback((filterId: string, updates: Partial<FilterConfig>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    }));
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId)
    }));
  }, []);

  // Generate report
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      // TODO: Call API to generate report
      const response = await fetch('/api/analytics/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig)
      });

      if (response.ok) {
        toast.success('Report generated successfully');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Generate report error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [reportConfig]);

  // Save report configuration
  const saveReport = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(reportConfig);
      }
      toast.success('Report saved successfully');
    } catch (error) {
      toast.error('Failed to save report');
      console.error('Save report error:', error);
    }
  }, [reportConfig, onSave]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold">Report Builder</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <Settings className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Clock className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            Generate
          </Button>
          <Button size="sm" onClick={saveReport}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Configuration Panel */}
        {!previewMode && (
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold mb-4">Report Configuration</h2>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      value={reportConfig.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="report-description">Description</Label>
                    <Textarea
                      id="report-description"
                      value={reportConfig.description}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Template</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {REPORT_TEMPLATES.map(template => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            reportConfig.template.id === template.id 
                              ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                          }`}
                          onClick={() => selectTemplate(template)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {template.category}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                {template.layout}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Sections</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {/* Open section selector */}}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {reportConfig.sections.map((section, index) => (
                          <div
                            key={section.id}
                            className={`p-2 border rounded cursor-pointer ${
                              selectedSection === section.id ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => setSelectedSection(section.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{section.title}</span>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => moveSection(section.id, 'up')}
                                  disabled={index === 0}
                                >
                                  ↑
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => moveSection(section.id, 'down')}
                                  disabled={index === reportConfig.sections.length - 1}
                                >
                                  ↓
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => removeSection(section.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {section.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <Label>Add Section</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SECTION_TYPES.map(sectionType => {
                        const Icon = sectionType.icon;
                        return (
                          <Button
                            key={sectionType.type}
                            variant="outline"
                            size="sm"
                            className="h-auto p-2"
                            onClick={() => addSection(sectionType.type)}
                          >
                            <div className="text-center">
                              <Icon className="w-4 h-4 mx-auto mb-1" />
                              <div className="text-xs">{sectionType.name}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="data-source">Data Source</Label>
                    <Select 
                      value={reportConfig.dataSource.type} 
                      onValueChange={(value: 'database' | 'api' | 'file' | 'manual') => 
                        updateNestedConfig('dataSource', { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="api">API Endpoint</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                        <SelectItem value="manual">Manual Input</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      min="300"
                      max="86400"
                      value={reportConfig.dataSource.refreshInterval || 3600}
                      onChange={(e) => updateNestedConfig('dataSource', { 
                        refreshInterval: parseInt(e.target.value) || 3600 
                      })}
                    />
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Filters</Label>
                      <Button size="sm" onClick={addFilter}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {reportConfig.filters.map(filter => (
                        <Card key={filter.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Input
                                value={filter.label}
                                onChange={(e) => updateFilter(filter.id, { label: e.target.value })}
                                className="text-sm"
                                placeholder="Filter label"
                              />
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => removeFilter(filter.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Select 
                                value={filter.type} 
                                onValueChange={(value: FilterConfig['type']) => 
                                  updateFilter(filter.id, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select 
                                value={filter.operator} 
                                onValueChange={(value: FilterConfig['operator']) => 
                                  updateFilter(filter.id, { operator: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="greater">Greater</SelectItem>
                                  <SelectItem value="less">Less</SelectItem>
                                  <SelectItem value="between">Between</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={filter.required}
                                  onCheckedChange={(checked) => updateFilter(filter.id, { required: checked })}
                                />
                                <Label className="text-xs">Required</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={filter.visible}
                                  onCheckedChange={(checked) => updateFilter(filter.id, { visible: checked })}
                                />
                                <Label className="text-xs">Visible</Label>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-schedule">Enable Scheduling</Label>
                    <Switch
                      id="enable-schedule"
                      checked={reportConfig.schedule.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('schedule', { enabled: checked })}
                    />
                  </div>

                  {reportConfig.schedule.enabled && (
                    <>
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select 
                          value={reportConfig.schedule.frequency} 
                          onValueChange={(value: ScheduleConfig['frequency']) => 
                            updateNestedConfig('schedule', { frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="schedule-time">Time</Label>
                        <Input
                          id="schedule-time"
                          type="time"
                          value={reportConfig.schedule.time}
                          onChange={(e) => updateNestedConfig('schedule', { time: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={reportConfig.schedule.timezone} 
                          onValueChange={(value) => updateNestedConfig('schedule', { timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="export" className="space-y-4 mt-4">
                  <div>
                    <Label>Export Formats</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { format: 'pdf', icon: FileType, label: 'PDF' },
                        { format: 'excel', icon: FileSpreadsheet, label: 'Excel' },
                        { format: 'csv', icon: FileText, label: 'CSV' },
                        { format: 'png', icon: FileImage, label: 'PNG' }
                      ].map(({ format, icon: Icon, label }) => (
                        <div key={format} className="flex items-center gap-2">
                          <Switch
                            checked={reportConfig.distribution.export.formats.includes(format as any)}
                            onCheckedChange={(checked) => {
                              const formats = checked 
                                ? [...reportConfig.distribution.export.formats, format as any]
                                : reportConfig.distribution.export.formats.filter(f => f !== format);
                              updateNestedConfig('distribution', { 
                                export: { ...reportConfig.distribution.export, formats }
                              });
                            }}
                          />
                          <Icon className="w-4 h-4" />
                          <Label className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="export-quality">Export Quality</Label>
                    <Select 
                      value={reportConfig.distribution.export.quality} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        updateNestedConfig('distribution', { 
                          export: { ...reportConfig.distribution.export, quality: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Fast)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Slow)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-email">Email Distribution</Label>
                    <Switch
                      id="enable-email"
                      checked={reportConfig.distribution.email.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('distribution', { 
                        email: { ...reportConfig.distribution.email, enabled: checked }
                      })}
                    />
                  </div>

                  {reportConfig.distribution.email.enabled && (
                    <>
                      <div>
                        <Label htmlFor="email-recipients">Recipients (comma-separated)</Label>
                        <Textarea
                          id="email-recipients"
                          value={reportConfig.distribution.email.recipients.join(', ')}
                          onChange={(e) => updateNestedConfig('distribution', { 
                            email: { 
                              ...reportConfig.distribution.email, 
                              recipients: e.target.value.split(',').map(email => email.trim()) 
                            }
                          })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="email-subject">Email Subject</Label>
                        <Input
                          id="email-subject"
                          value={reportConfig.distribution.email.subject}
                          onChange={(e) => updateNestedConfig('distribution', { 
                            email: { ...reportConfig.distribution.email, subject: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {previewMode ? (
            <ReportPreview config={reportConfig} />
          ) : (
            <ReportDesigner 
              config={reportConfig}
              selectedSection={selectedSection}
              onUpdateSection={updateSection}
              onSelectSection={setSelectedSection}
            />
          )}
        </div>

        {/* Section Configuration Panel */}
        {!previewMode && selectedSection && (
          <div className="w-80 bg-white border-l">
            <SectionConfigPanel
              section={reportConfig.sections.find(s => s.id === selectedSection)!}
              onUpdate={(updates) => updateSection(selectedSection, updates)}
              onClose={() => setSelectedSection(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Report Preview Component
function ReportPreview({ config }: { config: ReportConfig }) {
  return (
    <div className="flex-1 p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.name}</h1>
            <p className="text-gray-600">{config.description}</p>
            <div className="text-sm text-gray-500 mt-2">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-8">
            {config.sections.map(section => (
              <div key={section.id} className="border-b border-gray-200 pb-6">
                <SectionRenderer section={section} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Report Designer Component
function ReportDesigner({ 
  config, 
  selectedSection,
  onUpdateSection,
  onSelectSection
}: {
  config: ReportConfig;
  selectedSection: string | null;
  onUpdateSection: (sectionId: string, updates: Partial<ReportSection>) => void;
  onSelectSection: (sectionId: string) => void;
}) {
  return (
    <div className="flex-1 p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Report Design</h2>
          <p className="text-gray-600">Click sections to configure them</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {config.sections.map(section => (
            <div
              key={section.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedSection === section.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectSection(section.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{section.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {section.type}
                </Badge>
              </div>
              <SectionRenderer section={section} />
            </div>
          ))}

          {config.sections.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No sections added yet
              </h3>
              <p className="text-gray-500">
                Select a template or add sections to start building your report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Section Renderer Component
function SectionRenderer({ section }: { section: ReportSection }) {
  switch (section.type) {
    case 'header':
      return (
        <div className="text-center">
          <h1 className="text-2xl font-bold">{section.content?.title || 'Report Title'}</h1>
          <p className="text-gray-600 mt-2">{section.content?.subtitle || 'Report Subtitle'}</p>
        </div>
      );
    
    case 'text':
      return (
        <div className="prose">
          <p>{section.content?.content || 'Text content goes here...'}</p>
        </div>
      );
    
    case 'chart':
      return (
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chart: {section.content?.title || 'Chart Title'}</p>
          </div>
        </div>
      );
    
    case 'table':
      return (
        <div className="border rounded">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Column 1</th>
                <th className="px-4 py-2 text-left">Column 2</th>
                <th className="px-4 py-2 text-left">Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border-t">Sample Data</td>
                <td className="px-4 py-2 border-t">Sample Data</td>
                <td className="px-4 py-2 border-t">Sample Data</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    
    case 'metrics':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(section.content?.metrics || []).map((metric: any, index: number) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
              <div className="text-xs text-green-600">{metric.change}</div>
            </div>
          ))}
        </div>
      );
    
    default:
      return (
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-gray-500">Section: {section.type}</p>
        </div>
      );
  }
}

// Section Configuration Panel
function SectionConfigPanel({
  section,
  onUpdate,
  onClose
}: {
  section: ReportSection;
  onUpdate: (updates: Partial<ReportSection>) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Section Settings</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="section-title">Section Title</Label>
          <Input
            id="section-title"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>

        {section.type === 'text' && (
          <div>
            <Label htmlFor="section-content">Content</Label>
            <Textarea
              id="section-content"
              value={section.content?.content || ''}
              onChange={(e) => onUpdate({ 
                content: { ...section.content, content: e.target.value }
              })}
              rows={6}
            />
          </div>
        )}

        {section.type === 'chart' && (
          <>
            <div>
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select 
                value={section.content?.chartType || 'line'}
                onValueChange={(value) => onUpdate({ 
                  content: { ...section.content, chartType: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chart-data-source">Data Source</Label>
              <Select 
                value={section.content?.dataSource || 'revenue'}
                onValueChange={(value) => onUpdate({ 
                  content: { ...section.content, dataSource: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Data</SelectItem>
                  <SelectItem value="users">User Data</SelectItem>
                  <SelectItem value="projects">Project Data</SelectItem>
                  <SelectItem value="custom">Custom Query</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
