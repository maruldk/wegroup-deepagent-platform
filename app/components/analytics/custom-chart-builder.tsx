// @ts-nocheck
'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Settings,
  Palette,
  Database,
  Filter,
  Save,
  Eye,
  Code,
  Download,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart
} from 'recharts';

interface ChartConfig {
  type: ChartType;
  title: string;
  dataSource: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  styling: ChartStyling;
  filters: FilterConfig[];
  animations: AnimationConfig;
}

interface AxisConfig {
  dataKey: string;
  label: string;
  type: 'category' | 'number' | 'time';
  format?: string;
  domain?: [number, number];
  scale?: 'auto' | 'linear' | 'log';
}

interface SeriesConfig {
  id: string;
  dataKey: string;
  name: string;
  type: 'line' | 'bar' | 'area' | 'scatter';
  color: string;
  opacity: number;
  strokeWidth?: number;
  fill?: boolean;
  yAxisId?: string;
}

interface ChartStyling {
  theme: 'light' | 'dark' | 'auto';
  colorPalette: string[];
  backgroundColor: string;
  gridColor: string;
  textColor: string;
  borderRadius: number;
  showGrid: boolean;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  margin: { top: number; right: number; bottom: number; left: number };
}

interface FilterConfig {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
  enabled: boolean;
}

interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  stagger: boolean;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  SCATTER = 'scatter',
  RADAR = 'radar',
  COMPOSED = 'composed'
}

const DEFAULT_COLORS = [
  '#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', 
  '#A19AD3', '#72BF78', '#FFD93D', '#FF6B6B', '#4ECDC4'
];

// Sample data for preview
const SAMPLE_DATA = [
  { month: 'Jan', revenue: 12000, expenses: 8000, users: 150, conversion: 2.4 },
  { month: 'Feb', revenue: 15000, expenses: 9000, users: 180, conversion: 2.8 },
  { month: 'Mar', revenue: 18000, expenses: 11000, users: 220, conversion: 3.1 },
  { month: 'Apr', revenue: 22000, expenses: 13000, users: 280, conversion: 3.5 },
  { month: 'May', revenue: 28000, expenses: 15000, users: 350, conversion: 4.2 },
  { month: 'Jun', revenue: 32000, expenses: 18000, users: 420, conversion: 4.8 }
];

interface CustomChartBuilderProps {
  initialConfig?: Partial<ChartConfig>;
  onSave?: (config: ChartConfig) => void;
  onCancel?: () => void;
}

export function CustomChartBuilder({
  initialConfig,
  onSave,
  onCancel
}: CustomChartBuilderProps) {
  const [config, setConfig] = useState<ChartConfig>({
    type: ChartType.LINE,
    title: 'Custom Chart',
    dataSource: 'sample',
    xAxis: {
      dataKey: 'month',
      label: 'Month',
      type: 'category'
    },
    yAxis: {
      dataKey: 'revenue',
      label: 'Revenue (€)',
      type: 'number'
    },
    series: [
      {
        id: 'series1',
        dataKey: 'revenue',
        name: 'Revenue',
        type: 'line',
        color: DEFAULT_COLORS[0],
        opacity: 1,
        strokeWidth: 2,
        fill: false
      }
    ],
    styling: {
      theme: 'light',
      colorPalette: DEFAULT_COLORS,
      backgroundColor: '#ffffff',
      gridColor: '#f3f4f6',
      textColor: '#374151',
      borderRadius: 8,
      showGrid: true,
      showLegend: true,
      legendPosition: 'top',
      margin: { top: 20, right: 30, bottom: 20, left: 20 }
    },
    filters: [],
    animations: {
      enabled: true,
      duration: 750,
      easing: 'ease-out',
      stagger: false
    },
    ...(initialConfig || {})
  });

  const [activeTab, setActiveTab] = useState('data');
  const [previewData, setPreviewData] = useState(SAMPLE_DATA);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...(updates || {}) }));
  }, []);

  // Update nested configuration
  const updateNestedConfig = useCallback(<T extends keyof ChartConfig>(
    key: T,
    updates: Partial<ChartConfig[T]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {} as any), ...(updates ?? {} as any) }
    }));
  }, []);

  // Add new series
  const addSeries = useCallback(() => {
    const newSeries: SeriesConfig = {
      id: `series${config.series.length + 1}`,
      dataKey: 'expenses',
      name: 'New Series',
      type: 'line',
      color: DEFAULT_COLORS[config.series.length % DEFAULT_COLORS.length],
      opacity: 1,
      strokeWidth: 2,
      fill: false
    };

    setConfig(prev => ({
      ...prev,
      series: [...prev.series, newSeries]
    }));
  }, [config.series.length]);

  // Update series
  const updateSeries = useCallback((index: number, updates: Partial<SeriesConfig>) => {
    setConfig(prev => ({
      ...prev,
      series: prev.series.map((series, i) => 
        i === index ? { ...(series || {}), ...updates } : series
      )
    }));
  }, []);

  // Remove series
  const removeSeries = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      series: prev.series.filter((_, i) => i !== index)
    }));
  }, []);

  // Generate chart code
  const generateCode = useCallback(() => {
    const codeTemplate = `
// Generated Chart Configuration
import { ${config.type === 'line' ? 'LineChart, Line' : 
              config.type === 'bar' ? 'BarChart, Bar' :
              config.type === 'area' ? 'AreaChart, Area' :
              config.type === 'pie' ? 'PieChart, Pie' : 'LineChart, Line'}, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chartConfig = ${JSON.stringify(config, null, 2)};

export function CustomChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <${config.type === 'line' ? 'LineChart' : 
         config.type === 'bar' ? 'BarChart' :
         config.type === 'area' ? 'AreaChart' : 'LineChart'} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="${config.xAxis.dataKey}" />
        <YAxis />
        <Tooltip />
        <Legend />
        ${config.series.map(series => 
          config.type === 'line' ? 
            `<Line type="monotone" dataKey="${series.dataKey}" stroke="${series.color}" strokeWidth={${series.strokeWidth}} />` :
          config.type === 'bar' ?
            `<Bar dataKey="${series.dataKey}" fill="${series.color}" />` :
          config.type === 'area' ?
            `<Area type="monotone" dataKey="${series.dataKey}" stroke="${series.color}" fill="${series.color}" fillOpacity={${series.opacity}} />` :
            ''
        ).join('\n        ')}
      </${config.type === 'line' ? 'LineChart' : 
          config.type === 'bar' ? 'BarChart' :
          config.type === 'area' ? 'AreaChart' : 'LineChart'}>
    </ResponsiveContainer>
  );
}`;

    return codeTemplate;
  }, [config]);

  // Render chart preview
  const renderChart = useMemo(() => {
    const commonProps = {
      data: previewData,
      margin: config.styling.margin
    };

    const gridProps = config.styling.showGrid ? {
      strokeDasharray: "3 3",
      stroke: config.styling.gridColor
    } : null;

    const xAxisProps = {
      dataKey: config.xAxis.dataKey,
      tick: { fontSize: 11, fill: config.styling.textColor },
      tickLine: false,
      label: config.xAxis.label ? {
        value: config.xAxis.label,
        position: 'insideBottom',
        offset: -15,
        style: { textAnchor: 'middle', fontSize: 11, fill: config.styling.textColor }
      } : undefined
    };

    const yAxisProps = {
      tick: { fontSize: 11, fill: config.styling.textColor },
      tickLine: false,
      label: config.yAxis.label ? {
        value: config.yAxis.label,
        angle: -90,
        position: 'insideLeft',
        style: { textAnchor: 'middle', fontSize: 11, fill: config.styling.textColor }
      } : undefined
    };

    const legendProps = config.styling.showLegend ? {
      verticalAlign: (config.styling.legendPosition === 'top' || config.styling.legendPosition === 'bottom' 
        ? config.styling.legendPosition : 'top') as 'top' | 'bottom',
      align: (config.styling.legendPosition === 'left' || config.styling.legendPosition === 'right'
        ? config.styling.legendPosition : 'center') as 'left' | 'center' | 'right',
      wrapperStyle: { fontSize: 11, color: config.styling.textColor }
    } : null;

    switch (config.type) {
      case ChartType.LINE:
        return (
          <RechartsLineChart {...commonProps}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip />
            {legendProps && <Legend {...legendProps} />}
            {config.series.map((series, index) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                strokeWidth={series.strokeWidth}
                name={series.name}
                strokeOpacity={series.opacity}
                animationDuration={config.animations.enabled ? config.animations.duration : 0}
              />
            ))}
          </RechartsLineChart>
        );

      case ChartType.BAR:
        return (
          <BarChart {...commonProps}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip />
            {legendProps && <Legend {...legendProps} />}
            {config.series.map((series, index) => (
              <Bar
                key={series.id}
                dataKey={series.dataKey}
                fill={series.color}
                name={series.name}
                fillOpacity={series.opacity}
                animationDuration={config.animations.enabled ? config.animations.duration : 0}
              />
            ))}
          </BarChart>
        );

      case ChartType.AREA:
        return (
          <AreaChart {...commonProps}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip />
            {legendProps && <Legend {...legendProps} />}
            {config.series.map((series, index) => (
              <Area
                key={series.id}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                fill={series.color}
                fillOpacity={series.opacity}
                name={series.name}
                animationDuration={config.animations.enabled ? config.animations.duration : 0}
              />
            ))}
          </AreaChart>
        );

      case ChartType.PIE:
        const pieData = previewData.map((item, index) => ({
          name: item[config.xAxis.dataKey as keyof typeof item],
          value: item[config.series[0]?.dataKey as keyof typeof item] || 0,
          fill: config.styling.colorPalette[index % config.styling.colorPalette.length]
        }));

        return (
          <RechartsPieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              animationDuration={config.animations.enabled ? config.animations.duration : 0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            {legendProps && <Legend {...legendProps} />}
          </RechartsPieChart>
        );

      default:
        return <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-gray-500">Chart preview not available</p>
        </div>;
    }
  }, [config, previewData]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold">Custom Chart Builder</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave?.(config)}>
            <Save className="w-4 h-4 mr-1" />
            Save Chart
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Configuration Panel */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-4">Chart Configuration</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="series">Series</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="chart-title">Chart Title</Label>
                  <Input
                    id="chart-title"
                    value={config.title}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select 
                    value={config.type} 
                    onValueChange={(value: ChartType) => updateConfig({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ChartType.LINE}>Line Chart</SelectItem>
                      <SelectItem value={ChartType.BAR}>Bar Chart</SelectItem>
                      <SelectItem value={ChartType.AREA}>Area Chart</SelectItem>
                      <SelectItem value={ChartType.PIE}>Pie Chart</SelectItem>
                      <SelectItem value={ChartType.SCATTER}>Scatter Plot</SelectItem>
                      <SelectItem value={ChartType.RADAR}>Radar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="x-axis-key">X-Axis Data Key</Label>
                  <Select 
                    value={config.xAxis.dataKey} 
                    onValueChange={(value) => updateNestedConfig('xAxis', { dataKey: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(SAMPLE_DATA[0]).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="x-axis-label">X-Axis Label</Label>
                  <Input
                    id="x-axis-label"
                    value={config.xAxis.label}
                    onChange={(e) => updateNestedConfig('xAxis', { label: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="y-axis-label">Y-Axis Label</Label>
                  <Input
                    id="y-axis-label"
                    value={config.yAxis.label}
                    onChange={(e) => updateNestedConfig('yAxis', { label: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid">Show Grid</Label>
                  <Switch
                    id="show-grid"
                    checked={config.styling.showGrid}
                    onCheckedChange={(checked) => updateNestedConfig('styling', { showGrid: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-legend">Show Legend</Label>
                  <Switch
                    id="show-legend"
                    checked={config.styling.showLegend}
                    onCheckedChange={(checked) => updateNestedConfig('styling', { showLegend: checked })}
                  />
                </div>

                {config.styling.showLegend && (
                  <div>
                    <Label htmlFor="legend-position">Legend Position</Label>
                    <Select 
                      value={config.styling.legendPosition} 
                      onValueChange={(value: 'top' | 'bottom' | 'left' | 'right') => 
                        updateNestedConfig('styling', { legendPosition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Slider
                    id="border-radius"
                    min={0}
                    max={20}
                    step={1}
                    value={[config.styling.borderRadius]}
                    onValueChange={([value]) => updateNestedConfig('styling', { borderRadius: value })}
                  />
                  <div className="text-xs text-gray-500 mt-1">{config.styling.borderRadius}px</div>
                </div>

                <div>
                  <Label>Color Palette</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {config.styling.colorPalette.map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded border cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          // Open color picker (simplified for demo)
                          const newColor = prompt('Enter hex color:', color);
                          if (newColor) {
                            const newPalette = [...config.styling.colorPalette];
                            newPalette[index] = newColor;
                            updateNestedConfig('styling', { colorPalette: newPalette });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="series" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Data Series</Label>
                  <Button size="sm" onClick={addSeries}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {config.series.map((series, index) => (
                    <Card key={series.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={series.name}
                            onChange={(e) => updateSeries(index, { name: e.target.value })}
                            className="text-sm"
                          />
                          {config.series.length > 1 && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeSeries(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <Select 
                          value={series.dataKey} 
                          onValueChange={(value) => updateSeries(index, { dataKey: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(SAMPLE_DATA[0]).map(key => (
                              <SelectItem key={key} value={key}>{key}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border cursor-pointer"
                            style={{ backgroundColor: series.color }}
                            onClick={() => {
                              const newColor = prompt('Enter hex color:', series.color);
                              if (newColor) {
                                updateSeries(index, { color: newColor });
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label className="text-xs">Opacity</Label>
                            <Slider
                              min={0}
                              max={1}
                              step={0.1}
                              value={[series.opacity]}
                              onValueChange={([value]) => updateSeries(index, { opacity: value })}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-animations">Enable Animations</Label>
                  <Switch
                    id="enable-animations"
                    checked={config.animations.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('animations', { enabled: checked })}
                  />
                </div>

                {config.animations.enabled && (
                  <>
                    <div>
                      <Label htmlFor="animation-duration">Duration (ms)</Label>
                      <Slider
                        id="animation-duration"
                        min={250}
                        max={2000}
                        step={50}
                        value={[config.animations.duration]}
                        onValueChange={([value]) => updateNestedConfig('animations', { duration: value })}
                      />
                      <div className="text-xs text-gray-500 mt-1">{config.animations.duration}ms</div>
                    </div>

                    <div>
                      <Label htmlFor="animation-easing">Easing</Label>
                      <Select 
                        value={config.animations.easing} 
                        onValueChange={(value: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out') => 
                          updateNestedConfig('animations', { easing: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ease">Ease</SelectItem>
                          <SelectItem value="ease-in">Ease In</SelectItem>
                          <SelectItem value="ease-out">Ease Out</SelectItem>
                          <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh Data
                </Button>
                <Button variant="outline" size="sm">
                  <Code className="w-4 h-4 mr-1" />
                  View Code
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{config.title}</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
