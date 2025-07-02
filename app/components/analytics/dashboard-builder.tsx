
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Save, 
  Plus, 
  Settings, 
  Trash2, 
  Copy, 
  Eye,
  EyeOff,
  Move,
  Expand,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Gauge,
  TrendingUp,
  Users,
  Euro,
  Target,
  Activity,
  Calendar,
  Clock,
  Zap,
  Database,
  X,
  Filter,
  Download,
  Upload,
  Grid,
  Layers,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

// Widget types and configurations
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource?: string;
  chartType?: string;
  filters?: any;
  styling?: WidgetStyling;
  refreshInterval?: number;
  visible?: boolean;
}

export interface WidgetStyling {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  opacity?: number;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export enum WidgetType {
  CHART_LINE = 'CHART_LINE',
  CHART_BAR = 'CHART_BAR', 
  CHART_PIE = 'CHART_PIE',
  CHART_AREA = 'CHART_AREA',
  METRIC_CARD = 'METRIC_CARD',
  TABLE = 'TABLE',
  GAUGE = 'GAUGE',
  MAP = 'MAP',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  IFRAME = 'IFRAME',
  CALENDAR = 'CALENDAR',
  TIMELINE = 'TIMELINE',
  KANBAN = 'KANBAN',
  CHAT = 'CHAT'
}

const WIDGET_LIBRARY = [
  {
    type: WidgetType.CHART_LINE,
    name: 'Line Chart',
    icon: LineChart,
    description: 'Display trends over time',
    defaultSize: { w: 6, h: 4 },
    category: 'Charts'
  },
  {
    type: WidgetType.CHART_BAR,
    name: 'Bar Chart', 
    icon: BarChart3,
    description: 'Compare categorical data',
    defaultSize: { w: 6, h: 4 },
    category: 'Charts'
  },
  {
    type: WidgetType.CHART_PIE,
    name: 'Pie Chart',
    icon: PieChart,
    description: 'Show proportional data',
    defaultSize: { w: 4, h: 4 },
    category: 'Charts'
  },
  {
    type: WidgetType.METRIC_CARD,
    name: 'KPI Card',
    icon: TrendingUp,
    description: 'Key performance indicator',
    defaultSize: { w: 3, h: 2 },
    category: 'Metrics'
  },
  {
    type: WidgetType.TABLE,
    name: 'Data Table',
    icon: Table,
    description: 'Tabular data display',
    defaultSize: { w: 8, h: 5 },
    category: 'Data'
  },
  {
    type: WidgetType.GAUGE,
    name: 'Progress Gauge',
    icon: Gauge,
    description: 'Circular progress indicator',
    defaultSize: { w: 3, h: 3 },
    category: 'Metrics'
  },
  {
    type: WidgetType.CALENDAR,
    name: 'Calendar',
    icon: Calendar,
    description: 'Date and event display',
    defaultSize: { w: 6, h: 4 },
    category: 'Utility'
  },
  {
    type: WidgetType.TEXT,
    name: 'Text Widget',
    icon: FileText,
    description: 'Custom text content',
    defaultSize: { w: 4, h: 2 },
    category: 'Content'
  }
];

interface DashboardBuilderProps {
  dashboardId?: string;
  initialLayout?: LayoutItem[];
  initialWidgets?: WidgetConfig[];
  onSave?: (layout: LayoutItem[], widgets: WidgetConfig[]) => void;
  readOnly?: boolean;
}

export function DashboardBuilder({
  dashboardId,
  initialLayout = [],
  initialWidgets = [],
  onSave,
  readOnly = false
}: DashboardBuilderProps) {
  const [layout, setLayout] = useState<LayoutItem[]>(initialLayout);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [isDirty, setIsDirty] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dashboardSettings, setDashboardSettings] = useState({
    name: 'Untitled Dashboard',
    description: '',
    isPublic: false,
    autoRefresh: false,
    refreshInterval: 30,
    theme: 'light'
  });

  const gridRef = useRef<any>(null);

  // Responsive breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Handle layout changes
  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    if (!isEditing) return;
    setLayout(newLayout);
    setIsDirty(true);
  }, [isEditing]);

  // Add new widget from library
  const addWidget = useCallback((widgetType: WidgetType) => {
    if (!isEditing) return;

    const widgetDef = WIDGET_LIBRARY.find(w => w.type === widgetType);
    if (!widgetDef) return;

    const newId = `widget_${Date.now()}`;
    const newWidget: WidgetConfig = {
      id: newId,
      type: widgetType,
      title: widgetDef.name,
      visible: true,
      refreshInterval: 30
    };

    // Find empty spot for new widget
    const occupiedSpots = new Set(
      layout.map(item => 
        Array.from({ length: item.h }, (_, row) =>
          Array.from({ length: item.w }, (_, col) => `${item.x + col}_${item.y + row}`)
        ).flat()
      ).flat()
    );

    let x = 0, y = 0;
    const { w, h } = widgetDef.defaultSize;
    
    // Find first available position
    outer: for (let row = 0; row < 20; row++) {
      for (let col = 0; col <= cols.lg - w; col++) {
        const positions = Array.from({ length: h }, (_, r) =>
          Array.from({ length: w }, (_, c) => `${col + c}_${row + r}`)
        ).flat();
        
        if (!positions.some(pos => occupiedSpots.has(pos))) {
          x = col;
          y = row;
          break outer;
        }
      }
    }

    const newLayoutItem: LayoutItem = {
      i: newId,
      x,
      y,
      w,
      h,
      minW: 1,
      minH: 1
    };

    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [...prev, newLayoutItem]);
    setSelectedWidget(newId);
    setIsDirty(true);
    
    toast.success(`${widgetDef.name} added to dashboard`);
  }, [isEditing, layout, cols.lg]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    if (!isEditing) return;

    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayout(prev => prev.filter(l => l.i !== widgetId));
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
    setIsDirty(true);
    toast.success('Widget removed');
  }, [isEditing, selectedWidget]);

  // Duplicate widget
  const duplicateWidget = useCallback((widgetId: string) => {
    if (!isEditing) return;

    const widget = widgets.find(w => w.id === widgetId);
    const layoutItem = layout.find(l => l.i === widgetId);
    
    if (!widget || !layoutItem) return;

    const newId = `widget_${Date.now()}`;
    const newWidget: WidgetConfig = {
      ...widget,
      id: newId,
      title: `${widget.title} (Copy)`
    };

    const newLayoutItem: LayoutItem = {
      ...layoutItem,
      i: newId,
      x: Math.min(layoutItem.x + 1, cols.lg - layoutItem.w),
      y: layoutItem.y + 1
    };

    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [...prev, newLayoutItem]);
    setIsDirty(true);
    
    toast.success('Widget duplicated');
  }, [isEditing, widgets, layout, cols.lg]);

  // Update widget configuration
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
    setIsDirty(true);
  }, []);

  // Save dashboard
  const saveDashboard = useCallback(async () => {
    if (!isDirty) return;

    try {
      // Call API to save dashboard
      if (onSave) {
        await onSave(layout, widgets);
      }
      
      setIsDirty(false);
      toast.success('Dashboard saved successfully');
    } catch (error) {
      toast.error('Failed to save dashboard');
      console.error('Save error:', error);
    }
  }, [layout, widgets, isDirty, onSave]);

  // Export dashboard configuration
  const exportDashboard = useCallback(() => {
    const exportData = {
      metadata: {
        name: dashboardSettings.name,
        description: dashboardSettings.description,
        exportedAt: new Date().toISOString(),
        version: '2.2.0'
      },
      layout,
      widgets,
      settings: dashboardSettings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${dashboardSettings.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dashboard exported');
  }, [layout, widgets, dashboardSettings]);

  // Import dashboard configuration  
  const importDashboard = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.layout && data.widgets) {
          setLayout(data.layout);
          setWidgets(data.widgets);
          if (data.settings) {
            setDashboardSettings(data.settings);
          }
          setIsDirty(true);
          toast.success('Dashboard imported successfully');
        } else {
          toast.error('Invalid dashboard file format');
        }
      } catch (error) {
        toast.error('Failed to import dashboard');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold">Dashboard Builder</h1>
              {isDirty && <Badge variant="secondary">Unsaved</Badge>}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={readOnly}
              >
                {isEditing ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-1">
                <Button
                  variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('desktop')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={deviceView === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('tablet')}
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('mobile')}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={exportDashboard}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && importDashboard(e.target.files[0])}
                  className="hidden"
                  id="import-dashboard"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('import-dashboard')?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={saveDashboard}
              disabled={!isDirty || !isEditing}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Widget Library Sidebar */}
          {isEditing && (
            <div className="w-80 bg-white border-r flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold mb-4">Widget Library</h2>
                
                <Tabs defaultValue="widgets" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="widgets">Widgets</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="widgets" className="space-y-4">
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {Object.entries(
                          WIDGET_LIBRARY.reduce((acc, widget) => {
                            if (!acc[widget.category]) acc[widget.category] = [];
                            acc[widget.category].push(widget);
                            return acc;
                          }, {} as Record<string, typeof WIDGET_LIBRARY>)
                        ).map(([category, widgets]) => (
                          <div key={category}>
                            <h3 className="text-sm font-medium text-gray-600 mb-2">{category}</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {widgets.map((widget) => (
                                <WidgetLibraryItem
                                  key={widget.type}
                                  widget={widget}
                                  onAdd={addWidget}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dashboard-name">Dashboard Name</Label>
                        <Input
                          id="dashboard-name"
                          value={dashboardSettings.name}
                          onChange={(e) => setDashboardSettings(prev => ({ 
                            ...prev, 
                            name: e.target.value 
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dashboard-description">Description</Label>
                        <Textarea
                          id="dashboard-description"
                          value={dashboardSettings.description}
                          onChange={(e) => setDashboardSettings(prev => ({ 
                            ...prev, 
                            description: e.target.value 
                          }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-grid">Show Grid</Label>
                        <Switch
                          id="show-grid"
                          checked={showGrid}
                          onCheckedChange={setShowGrid}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="snap-to-grid">Snap to Grid</Label>
                        <Switch
                          id="snap-to-grid"
                          checked={snapToGrid}
                          onCheckedChange={setSnapToGrid}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-refresh">Auto Refresh</Label>
                        <Switch
                          id="auto-refresh"
                          checked={dashboardSettings.autoRefresh}
                          onCheckedChange={(checked) => setDashboardSettings(prev => ({ 
                            ...prev, 
                            autoRefresh: checked 
                          }))}
                        />
                      </div>
                      
                      {dashboardSettings.autoRefresh && (
                        <div>
                          <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                          <Input
                            id="refresh-interval"
                            type="number"
                            min="5"
                            max="3600"
                            value={dashboardSettings.refreshInterval}
                            onChange={(e) => setDashboardSettings(prev => ({ 
                              ...prev, 
                              refreshInterval: parseInt(e.target.value) || 30 
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* Main Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <div 
              className={`mx-auto transition-all duration-300 ${
                deviceView === 'mobile' ? 'max-w-sm' :
                deviceView === 'tablet' ? 'max-w-4xl' : 
                'max-w-full'
              }`}
            >
              <ResponsiveGridLayout
                ref={gridRef}
                className={`${showGrid ? 'show-grid' : ''}`}
                layouts={{ lg: layout }}
                breakpoints={breakpoints}
                cols={cols}
                rowHeight={60}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                isDraggable={isEditing}
                isResizable={isEditing}
                onLayoutChange={handleLayoutChange}
                draggableCancel=".non-draggable"
                useCSSTransforms={true}
                compactType="vertical"
                preventCollision={false}
              >
                {layout.map((item) => {
                  const widget = widgets.find(w => w.id === item.i);
                  if (!widget || !widget.visible) return null;

                  return (
                    <div key={item.i} className="widget-container">
                      <DashboardWidget
                        widget={widget}
                        isSelected={selectedWidget === item.i}
                        isEditing={isEditing}
                        onSelect={() => setSelectedWidget(item.i)}
                        onRemove={() => removeWidget(item.i)}
                        onDuplicate={() => duplicateWidget(item.i)}
                        onUpdate={(updates) => updateWidget(item.i, updates)}
                      />
                    </div>
                  );
                })}
              </ResponsiveGridLayout>
              
              {layout.length === 0 && (
                <div className="text-center py-16">
                  <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Start Building Your Dashboard
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add widgets from the library to get started
                  </p>
                  {isEditing && (
                    <Button onClick={() => addWidget(WidgetType.METRIC_CARD)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Widget
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Widget Configuration Panel */}
          {isEditing && selectedWidget && (
            <div className="w-80 bg-white border-l">
              <WidgetConfigPanel
                widget={widgets.find(w => w.id === selectedWidget)!}
                onUpdate={(updates) => updateWidget(selectedWidget, updates)}
                onClose={() => setSelectedWidget(null)}
              />
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .show-grid .react-grid-item {
          border: 1px dashed #e5e7eb;
        }
        
        .widget-container {
          position: relative;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: #3b82f6;
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
          border-radius: 4px;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }
        
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid #9ca3af;
          border-bottom: 2px solid #9ca3af;
        }
      `}</style>
    </DndProvider>
  );
}

// Widget Library Item Component
function WidgetLibraryItem({ 
  widget, 
  onAdd 
}: { 
  widget: typeof WIDGET_LIBRARY[0]; 
  onAdd: (type: WidgetType) => void; 
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'widget',
    item: { type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = widget.icon;

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onAdd(widget.type)}
    >
      <Icon className="w-6 h-6 text-blue-600 mb-2" />
      <h4 className="text-sm font-medium">{widget.name}</h4>
      <p className="text-xs text-gray-500 mt-1">{widget.description}</p>
    </div>
  );
}

// Individual Widget Component
function DashboardWidget({
  widget,
  isSelected,
  isEditing,
  onSelect,
  onRemove,
  onDuplicate,
  onUpdate
}: {
  widget: WidgetConfig;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  return (
    <Card 
      className={`h-full cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isEditing ? 'hover:shadow-md' : ''}`}
      onClick={onSelect}
    >
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 non-draggable">
          <Button size="sm" variant="ghost" onClick={onDuplicate}>
            <Copy className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <WidgetRenderer widget={widget} />
      </CardContent>
    </Card>
  );
}

// Widget Configuration Panel
function WidgetConfigPanel({
  widget,
  onUpdate,
  onClose
}: {
  widget: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Widget Settings</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="widget-title">Title</Label>
          <Input
            id="widget-title"
            value={widget.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="widget-refresh">Refresh Interval (seconds)</Label>
          <Input
            id="widget-refresh"
            type="number"
            min="5"
            max="3600"
            value={widget.refreshInterval || 30}
            onChange={(e) => onUpdate({ refreshInterval: parseInt(e.target.value) || 30 })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="widget-visible">Visible</Label>
          <Switch
            id="widget-visible"
            checked={widget.visible !== false}
            onCheckedChange={(checked) => onUpdate({ visible: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// Placeholder Widget Renderer
function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const renderContent = () => {
    switch (widget.type) {
      case WidgetType.METRIC_CARD:
        return (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">€127K</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-xs text-green-600">+12.5% vs last month</div>
          </div>
        );
      
      case WidgetType.CHART_LINE:
      case WidgetType.CHART_BAR:
      case WidgetType.CHART_PIE:
        return (
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
        );
      
      case WidgetType.TABLE:
        return (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        );
      
      default:
        return (
          <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-sm text-gray-500">Widget Content</div>
          </div>
        );
    }
  };

  return <div className="w-full h-full">{renderContent()}</div>;
}
