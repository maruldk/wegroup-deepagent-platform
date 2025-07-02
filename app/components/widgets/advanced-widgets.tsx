
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Euro, 
  Target,
  Activity,
  Clock,
  MapPin,
  Star,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Map,
  List,
  Grid,
  Filter,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { useWebSocket } from '@/lib/websocket/websocket-service';

// Widget Base Interface
export interface WidgetProps {
  id: string;
  title: string;
  config?: any;
  data?: any;
  refreshInterval?: number;
  onUpdate?: (id: string, data: any) => void;
  onInteraction?: (id: string, interaction: any) => void;
}

// Enhanced KPI Card Widget
export function KPICardWidget({ 
  id, 
  title, 
  config = {}, 
  data = {},
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [currentValue, setCurrentValue] = useState(data.value || 0);
  const [targetValue] = useState(data.target || currentValue);

  // Animate value changes
  useEffect(() => {
    if (data.value !== currentValue) {
      const duration = 1000;
      const startValue = currentValue;
      const endValue = data.value || 0;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const interpolatedValue = startValue + (endValue - startValue) * easeOutQuart;
        setCurrentValue(interpolatedValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [data.value, currentValue]);

  const formatValue = (value: number) => {
    if (config.format === 'currency') {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    } else if (config.format === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (config.format === 'number') {
      return new Intl.NumberFormat('de-DE').format(Math.round(value));
    }
    return Math.round(value).toString();
  };

  const getChangeIcon = () => {
    if (data.change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (data.change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (data.change > 0) return 'text-green-600';
    if (data.change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => onInteraction?.(id, { action: 'click', timestamp: Date.now() })}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {config.icon && (
            <div className={`p-2 rounded-lg ${config.iconBg || 'bg-blue-100'}`}>
              <div className={`w-5 h-5 ${config.iconColor || 'text-blue-600'}`}>
                {config.icon}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-gray-900">
            {formatValue(currentValue)}
          </div>
          
          {data.change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
              {getChangeIcon()}
              <span>{Math.abs(data.change)}%</span>
              <span className="text-gray-500">vs. last period</span>
            </div>
          )}
          
          {targetValue && config.showProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress to target</span>
                <span>{Math.round((currentValue / targetValue) * 100)}%</span>
              </div>
              <Progress 
                value={(currentValue / targetValue) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Advanced Chart Widget
export function AdvancedChartWidget({ 
  id, 
  title, 
  config = {}, 
  data = [],
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [activeData, setActiveData] = useState(data);
  const [timeRange, setTimeRange] = useState(config.defaultTimeRange || '30d');

  const colors = config.colorPalette || ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3'];

  const renderChart = () => {
    const commonProps = {
      data: activeData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (config.chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey={config.xAxis || 'name'} 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {(config.series || ['value']).map((series: string, index: number) => (
              <Area
                key={series}
                type="monotone"
                dataKey={series}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                strokeWidth={2}
                animationDuration={750}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey={config.xAxis || 'name'} 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip />
            {(config.series || ['value']).map((series: string, index: number) => (
              <Bar
                key={series}
                dataKey={series}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                animationDuration={750}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey={config.valueKey || 'value'}
              animationDuration={750}
            >
              {activeData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart {...commonProps}>
            <PolarGrid />
            <PolarAngleAxis dataKey={config.angleKey || 'subject'} />
            <PolarRadiusAxis />
            <Radar
              name={config.radarName || 'Metrics'}
              dataKey={config.valueKey || 'value'}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip />
          </RadarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey={config.xAxis || 'name'} 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip />
            {(config.series || ['value']).map((series: string, index: number) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                animationDuration={750}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {config.showTimeRange && (
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          )}
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time Activity Feed Widget
export function ActivityFeedWidget({ 
  id, 
  title, 
  config = {}, 
  data = [],
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [activities, setActivities] = useState(data);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('analytics_event', (event: any) => {
      if (event.category === config.category || !config.category) {
        const newActivity = {
          id: Date.now(),
          type: event.type,
          message: event.message || `${event.type} event occurred`,
          timestamp: new Date(),
          severity: event.severity || 'info',
          user: event.user,
          data: event.data
        };
        
        setActivities((prev: any[]) => [newActivity, ...prev.slice(0, 19)]); // Keep last 20
      }
    });

    return unsubscribe;
  }, [subscribe, config.category]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <Users className="w-4 h-4 text-blue-500" />;
      case 'data_update': return <Activity className="w-4 h-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity: any, index: number) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 border-l-4 ${getSeverityColor(activity.severity)} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => onInteraction?.(id, { action: 'activity_click', activity })}
                >
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                        {activity.user && (
                          <span className="text-xs text-gray-500">
                            by {activity.user.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Team Performance Widget
export function TeamPerformanceWidget({ 
  id, 
  title, 
  config = {}, 
  data = [],
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [sortBy, setSortBy] = useState(config.defaultSort || 'performance');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return (b.performance || 0) - (a.performance || 0);
        case 'tasks':
          return (b.completedTasks || 0) - (a.completedTasks || 0);
        case 'efficiency':
          return (b.efficiency || 0) - (a.efficiency || 0);
        default:
          return 0;
      }
    });
  }, [data, sortBy]);

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 bg-green-100';
    if (performance >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          <option value="performance">Performance</option>
          <option value="tasks">Completed Tasks</option>
          <option value="efficiency">Efficiency</option>
        </select>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedData.map((member: any, index: number) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => onInteraction?.(id, { action: 'member_click', member })}
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                member.status === 'online' ? 'bg-green-500' : 
                member.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {member.name}
                </h4>
                <Badge className={`text-xs ${getPerformanceColor(member.performance || 0)}`}>
                  {member.performance || 0}%
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  {member.completedTasks || 0} tasks
                </span>
                <span className="text-xs text-gray-500">
                  {member.role}
                </span>
              </div>
              <Progress 
                value={member.performance || 0} 
                className="h-1 mt-2"
              />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

// Calendar Heatmap Widget
export function CalendarHeatmapWidget({ 
  id, 
  title, 
  config = {}, 
  data = {},
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getIntensity = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const value = data[dateStr] || 0;
    const maxValue = Math.max(...Object.values(data).map(v => Number(v) || 0));
    
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 25) return 'bg-blue-200';
    if (intensity < 50) return 'bg-blue-400';
    if (intensity < 75) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md border"
          modifiers={{
            intensive: (date) => getIntensity(date) > 50
          }}
          modifiersStyles={{
            intensive: { backgroundColor: '#3b82f6', color: 'white' }
          }}
        />
        
        {selectedDate && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">
              {selectedDate.toLocaleDateString()}
            </p>
            <p className="text-lg font-bold text-blue-600">
              {data[selectedDate.toISOString().split('T')[0]] || 0} {config.unit || 'events'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Weather Widget (Example External Data)
export function WeatherWidget({ 
  id, 
  title, 
  config = {},
  onUpdate,
  onInteraction 
}: WidgetProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock weather data - in real app, fetch from weather API
    const mockWeather = {
      location: config.location || 'Berlin',
      temperature: Math.round(Math.random() * 30 + 5),
      condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
      humidity: Math.round(Math.random() * 40 + 40),
      windSpeed: Math.round(Math.random() * 20 + 5),
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
        high: Math.round(Math.random() * 25 + 10),
        low: Math.round(Math.random() * 15 + 0),
        condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
      }))
    };

    setTimeout(() => {
      setWeather(mockWeather);
      setLoading(false);
    }, 1000);
  }, [config.location]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      default: return '🌤️';
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{getWeatherIcon(weather.condition)}</div>
          <div className="text-3xl font-bold">{weather.temperature}°C</div>
          <div className="text-sm text-gray-600 capitalize">{weather.condition}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Humidity: {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span>Wind: {weather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">5-Day Forecast</h4>
          <div className="space-y-2">
            {weather.forecast.map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="w-8">{day.day}</span>
                <span>{getWeatherIcon(day.condition)}</span>
                <span className="text-gray-600">{day.high}°/{day.low}°</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Widget Factory
export function createWidget(type: string, props: WidgetProps) {
  switch (type) {
    case 'kpi_card':
      return <KPICardWidget {...props} />;
    case 'advanced_chart':
      return <AdvancedChartWidget {...props} />;
    case 'activity_feed':
      return <ActivityFeedWidget {...props} />;
    case 'team_performance':
      return <TeamPerformanceWidget {...props} />;
    case 'calendar_heatmap':
      return <CalendarHeatmapWidget {...props} />;
    case 'weather':
      return <WeatherWidget {...props} />;
    default:
      return (
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unknown widget type: {type}</p>
          </CardContent>
        </Card>
      );
  }
}

// Widget Catalog for Dashboard Builder
export const WIDGET_CATALOG = [
  {
    type: 'kpi_card',
    name: 'KPI Card',
    description: 'Key performance indicator with animations',
    icon: Target,
    category: 'Metrics',
    defaultSize: { w: 3, h: 2 },
    configurable: ['format', 'icon', 'showProgress', 'target']
  },
  {
    type: 'advanced_chart',
    name: 'Advanced Chart',
    description: 'Interactive charts with multiple types',
    icon: BarChart3,
    category: 'Charts',
    defaultSize: { w: 6, h: 4 },
    configurable: ['chartType', 'series', 'colors', 'timeRange']
  },
  {
    type: 'activity_feed',
    name: 'Activity Feed',
    description: 'Real-time activity stream',
    icon: Activity,
    category: 'Data',
    defaultSize: { w: 4, h: 5 },
    configurable: ['category', 'maxItems', 'autoRefresh']
  },
  {
    type: 'team_performance',
    name: 'Team Performance',
    description: 'Team member performance tracking',
    icon: Users,
    category: 'People',
    defaultSize: { w: 4, h: 5 },
    configurable: ['sortBy', 'showAvatars', 'performanceMetric']
  },
  {
    type: 'calendar_heatmap',
    name: 'Calendar Heatmap',
    description: 'Activity calendar with intensity heatmap',
    icon: CalendarIcon,
    category: 'Time',
    defaultSize: { w: 4, h: 4 },
    configurable: ['dataSource', 'colorScheme', 'unit']
  },
  {
    type: 'weather',
    name: 'Weather Widget',
    description: 'Current weather and forecast',
    icon: Globe,
    category: 'External',
    defaultSize: { w: 3, h: 4 },
    configurable: ['location', 'units', 'showForecast']
  }
];
