
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface EventDrivenChartsProps {
  chartId: string;
  chartType: 'line' | 'area' | 'bar' | 'pie';
  title: string;
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKey?: string;
    colors?: string[];
    realTimeUpdates?: boolean;
    updateInterval?: number;
  };
  className?: string;
}

const DEFAULT_COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export default function EventDrivenCharts({
  chartId,
  chartType,
  title,
  data: initialData,
  config,
  className = ''
}: EventDrivenChartsProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const wsRef = useRef<WebSocket | null>(null);

  // Colors configuration
  const colors = config.colors || DEFAULT_COLORS;

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!config.realTimeUpdates) return;

    // TODO: Implement WebSocket connection
    // This would connect to the WebSocket service and listen for chart updates
    
    // For now, simulate real-time updates with polling
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of update
        updateChartData();
      }
    }, config.updateInterval || 5000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chartId, config.realTimeUpdates, config.updateInterval]);

  // Simulate data update (in real implementation, this would come from WebSocket)
  const updateChartData = () => {
    setIsLoading(true);
    
    // Simulate API call or WebSocket update
    setTimeout(() => {
      setData(prevData => {
        // Add some variation to the data
        return prevData.map(item => ({
          ...item,
          value: item.value + (Math.random() - 0.5) * 10,
          count: Math.max(0, item.count + Math.floor((Math.random() - 0.5) * 5))
        }));
      });
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 500);
  };

  // Chart components
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={config.xAxisKey || 'name'} 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <YAxis 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Line
          type="monotone"
          dataKey={config.yAxisKey || 'value'}
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={config.xAxisKey || 'name'} 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <YAxis 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Area
          type="monotone"
          dataKey={config.yAxisKey || 'value'}
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={config.xAxisKey || 'name'} 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <YAxis 
          tickLine={false}
          tick={{ fontSize: 10 }}
          stroke="#666"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Bar
          dataKey={config.yAxisKey || 'value'}
          fill={colors[0]}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={30}
          paddingAngle={5}
          dataKey={config.yAxisKey || 'value'}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  // Render appropriate chart type
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {config.realTimeUpdates && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              }`} />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {config.realTimeUpdates && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={updateChartData}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </motion.button>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Updating chart...</span>
            </div>
          </motion.div>
        )}
        
        <div className="h-64 w-full">
          {renderChart()}
        </div>
      </div>

      {/* Chart Footer */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Data points: {data.length}</span>
            {config.realTimeUpdates && (
              <span>Auto-refresh: {(config.updateInterval || 5000) / 1000}s</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Export utility function for creating chart configs
export const createChartConfig = (options: {
  realTimeUpdates?: boolean;
  updateInterval?: number;
  colors?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
}) => ({
  realTimeUpdates: options.realTimeUpdates || false,
  updateInterval: options.updateInterval || 5000,
  colors: options.colors || DEFAULT_COLORS,
  xAxisKey: options.xAxisKey || 'name',
  yAxisKey: options.yAxisKey || 'value'
});
