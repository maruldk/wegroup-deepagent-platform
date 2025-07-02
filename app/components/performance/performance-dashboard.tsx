
'use client'

// SPRINT 2.9 - Performance Optimization Dashboard
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Zap, Database, Activity, Clock, TrendingUp, Server, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'

interface PerformanceAnalytics {
  queryOptimizations: {
    total: number
    active: number
    avgImprovement: number
    topOptimizations: Array<{
      queryHash: string
      improvement: number
      usage: number
    }>
  }
  cachePerformance: {
    totalEntries: number
    totalHitCount: number
    avgHitCount: number
    hitRate: number
    memoryUsage: number
  }
  performanceTrends: {
    responseTime: { trend: string; change: number }
    throughput: { trend: string; change: number }
    errorRate: { trend: string; change: number }
    cacheHitRate: { trend: string; change: number }
  }
  recommendations: string[]
}

export default function PerformanceDashboard() {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/performance/optimization')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeResources = async () => {
    try {
      setOptimizing(true)
      
      const response = await fetch('/api/performance/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize_resources' })
      })

      if (response.ok) {
        await loadPerformanceData()
      }
    } catch (error) {
      console.error('Failed to optimize resources:', error)
    } finally {
      setOptimizing(false)
    }
  }

  const clearCache = async () => {
    try {
      await fetch('/api/performance/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'invalidate_cache',
          pattern: '*'
        })
      })
      await loadPerformanceData()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'improving') return 'text-green-600'
    if (trend === 'declining') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↗️'
    if (trend === 'declining') return '↘️'
    return '→'
  }

  // Mock data for charts
  const performanceTimeSeriesData = [
    { time: '00:00', responseTime: 120, throughput: 850, errorRate: 0.5 },
    { time: '04:00', responseTime: 110, throughput: 920, errorRate: 0.3 },
    { time: '08:00', responseTime: 180, throughput: 1200, errorRate: 0.8 },
    { time: '12:00', responseTime: 200, throughput: 1500, errorRate: 1.2 },
    { time: '16:00', responseTime: 160, throughput: 1350, errorRate: 0.9 },
    { time: '20:00', responseTime: 140, throughput: 1100, errorRate: 0.6 }
  ]

  const cacheHitRateData = [
    { time: 'Mon', hitRate: 78 },
    { time: 'Tue', hitRate: 82 },
    { time: 'Wed', hitRate: 85 },
    { time: 'Thu', hitRate: 88 },
    { time: 'Fri', hitRate: 91 },
    { time: 'Sat', hitRate: 89 },
    { time: 'Sun', hitRate: 86 }
  ]

  const queryOptimizationData = analytics?.queryOptimizations?.topOptimizations?.map(opt => ({
    query: opt.queryHash.substring(0, 8),
    improvement: opt.improvement,
    usage: opt.usage
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Performance Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize system performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearCache} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={optimizeResources} disabled={optimizing}>
            <Zap className="h-4 w-4 mr-2" />
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.cachePerformance?.hitRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.cachePerformance?.totalEntries || 0} total entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Optimizations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.queryOptimizations?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.queryOptimizations?.avgImprovement?.toFixed(1) || 0}% avg improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156ms</div>
            <p className={`text-xs ${getTrendColor(analytics?.performanceTrends?.responseTime?.trend || 'stable', 0)}`}>
              {getTrendIcon(analytics?.performanceTrends?.responseTime?.trend || 'stable')} {analytics?.performanceTrends?.responseTime?.change?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2K</div>
            <p className={`text-xs ${getTrendColor(analytics?.performanceTrends?.throughput?.trend || 'stable', 0)}`}>
              {getTrendIcon(analytics?.performanceTrends?.throughput?.trend || 'stable')} {analytics?.performanceTrends?.throughput?.change?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache Analytics</TabsTrigger>
          <TabsTrigger value="queries">Query Optimization</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Time Series */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Response time and throughput over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Area type="monotone" dataKey="responseTime" stroke="#60B5FF" fill="#60B5FF" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="throughput" stroke="#FF9149" fill="#FF9149" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key performance indicators trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-sm text-gray-500">Average API response</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTrendColor(analytics?.performanceTrends?.responseTime?.trend || 'stable', 0)}`}>
                      {getTrendIcon(analytics?.performanceTrends?.responseTime?.trend || 'stable')} {analytics?.performanceTrends?.responseTime?.change?.toFixed(1) || 0}%
                    </p>
                    <Badge variant={analytics?.performanceTrends?.responseTime?.trend === 'improving' ? 'default' : 'secondary'}>
                      {analytics?.performanceTrends?.responseTime?.trend || 'stable'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Throughput</p>
                      <p className="text-sm text-gray-500">Requests per second</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTrendColor(analytics?.performanceTrends?.throughput?.trend || 'stable', 0)}`}>
                      {getTrendIcon(analytics?.performanceTrends?.throughput?.trend || 'stable')} {analytics?.performanceTrends?.throughput?.change?.toFixed(1) || 0}%
                    </p>
                    <Badge variant={analytics?.performanceTrends?.throughput?.trend === 'improving' ? 'default' : 'secondary'}>
                      {analytics?.performanceTrends?.throughput?.trend || 'stable'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Cache Hit Rate</p>
                      <p className="text-sm text-gray-500">Cache efficiency</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTrendColor(analytics?.performanceTrends?.cacheHitRate?.trend || 'stable', 0)}`}>
                      {getTrendIcon(analytics?.performanceTrends?.cacheHitRate?.trend || 'stable')} {analytics?.performanceTrends?.cacheHitRate?.change?.toFixed(1) || 0}%
                    </p>
                    <Badge variant={analytics?.performanceTrends?.cacheHitRate?.trend === 'improving' ? 'default' : 'secondary'}>
                      {analytics?.performanceTrends?.cacheHitRate?.trend || 'stable'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Hit Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rate Trend</CardTitle>
                <CardDescription>Cache efficiency over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cacheHitRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Line type="monotone" dataKey="hitRate" stroke="#80D8C3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Current cache performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Entries</p>
                    <p className="text-2xl font-bold">{analytics?.cachePerformance?.totalEntries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Hits</p>
                    <p className="text-2xl font-bold">{analytics?.cachePerformance?.totalHitCount || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Hit Rate</span>
                    <span className="text-sm font-bold">{analytics?.cachePerformance?.hitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={analytics?.cachePerformance?.hitRate || 0} className="w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm font-bold">
                      {((analytics?.cachePerformance?.memoryUsage || 0) / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <Progress value={((analytics?.cachePerformance?.memoryUsage || 0) / 100 / 1024 / 1024) * 100} className="w-full" />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Cache Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={clearCache} variant="outline">
                      Clear Cache
                    </Button>
                    <Button size="sm" onClick={optimizeResources} variant="outline">
                      Optimize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Optimization Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Query Optimizations</CardTitle>
                <CardDescription>Performance improvements by query</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={queryOptimizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="query" />
                    <YAxis />
                    <Bar dataKey="improvement" fill="#A19AD3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Optimization Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Statistics</CardTitle>
                <CardDescription>Query optimization performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Optimizations</p>
                    <p className="text-2xl font-bold">{analytics?.queryOptimizations?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Optimizations</p>
                    <p className="text-2xl font-bold">{analytics?.queryOptimizations?.active || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Improvement</span>
                    <span className="text-sm font-bold">{analytics?.queryOptimizations?.avgImprovement?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={analytics?.queryOptimizations?.avgImprovement || 0} className="w-full" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Optimizations</p>
                  {analytics?.queryOptimizations?.topOptimizations?.slice(0, 3).map((opt, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-mono">{opt.queryHash.substring(0, 12)}...</span>
                      <Badge variant="outline">{opt.improvement.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>AI-generated suggestions to improve system performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics?.recommendations?.length ? (
                analytics.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Server className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No performance recommendations at this time</p>
                  <p className="text-sm text-gray-400">System is running optimally</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">General Performance Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Enable caching for frequently accessed data</li>
                  <li>• Optimize database queries with proper indexing</li>
                  <li>• Implement connection pooling for database connections</li>
                  <li>• Use CDN for static assets</li>
                  <li>• Monitor and tune memory allocation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
