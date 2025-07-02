
'use client'

// SPRINT 2.8 - AI Autonomy Dashboard
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Brain, Cpu, MessageSquare, Mic, Activity, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AgentPerformance {
  id: string
  name: string
  type: string
  status: string
  tasksCompleted: number
  avgProcessingTime: number
  performanceScore: number
}

interface VoiceCommandAnalytics {
  totalCommands: number
  avgConfidence: number
  avgExecutionTime: number
  successRate: number
  mostUsedIntents: { [key: string]: number }
}

interface SystemHealth {
  overallHealth: string
  componentHealth: Array<{
    component: string
    status: string
    healthScore: number
    lastCheck: string
  }>
  activeIncidents: number
  autoHealingEnabled: boolean
}

export default function AIAutonomyDashboard() {
  const [agents, setAgents] = useState<AgentPerformance[]>([])
  const [voiceAnalytics, setVoiceAnalytics] = useState<VoiceCommandAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('agents')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load multi-agent performance
      const agentsResponse = await fetch('/api/ai/multi-agent')
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        setAgents(agentsData.data?.agents || [])
      }

      // Load voice command analytics
      const voiceResponse = await fetch('/api/ai/voice-commands')
      if (voiceResponse.ok) {
        const voiceData = await voiceResponse.json()
        setVoiceAnalytics(voiceData.data)
      }

      // Load system health
      const healthResponse = await fetch('/api/system/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeAgentSystem = async () => {
    try {
      const response = await fetch('/api/ai/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      })

      if (response.ok) {
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Failed to initialize agent system:', error)
    }
  }

  const assignTaskToAgent = async (taskType: string) => {
    try {
      const response = await fetch('/api/ai/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_task',
          taskPayload: {
            type: taskType,
            data: { description: `${taskType} task assigned from dashboard` },
            priority: 'MEDIUM'
          }
        })
      })

      if (response.ok) {
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Failed to assign task:', error)
    }
  }

  const startHealthMonitoring = async () => {
    try {
      await fetch('/api/system/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_monitoring' })
      })
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to start monitoring:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'idle': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const performanceData = agents?.map(agent => ({
    name: agent.name,
    score: agent.performanceScore,
    tasks: agent.tasksCompleted,
    time: agent.avgProcessingTime
  })) || []

  const healthStatusData = systemHealth?.componentHealth?.map(component => ({
    name: component.component,
    health: component.healthScore
  })) || []

  const intentData = voiceAnalytics?.mostUsedIntents ? 
    Object.entries(voiceAnalytics.mostUsedIntents).map(([intent, count]) => ({
      name: intent,
      value: count
    })) : []

  const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Autonomy Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Autonomy Dashboard</h1>
          <p className="text-gray-600">Monitor and manage autonomous AI systems</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={initializeAgentSystem} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Initialize Agents
          </Button>
          <Button onClick={startHealthMonitoring}>
            <Activity className="h-4 w-4 mr-2" />
            Start Monitoring
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {agents?.filter(a => a.status === 'IDLE').length || 0} idle, {agents?.filter(a => a.status === 'BUSY').length || 0} busy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Commands</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voiceAnalytics?.totalCommands || 0}</div>
            <p className="text-xs text-muted-foreground">
              {((voiceAnalytics?.successRate || 0) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemHealth?.overallHealth || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth?.activeIncidents || 0} active incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((voiceAnalytics?.avgConfidence || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {voiceAnalytics?.avgExecutionTime?.toFixed(1) || 0}ms avg time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Multi-Agent System</TabsTrigger>
          <TabsTrigger value="voice">Voice Commands</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="nlp">NLP Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Performance scores and task completion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="score" fill="#60B5FF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Agents</CardTitle>
                <CardDescription>Current agent status and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents?.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.tasksCompleted} tasks</p>
                      <p className="text-sm text-gray-500">{agent.performanceScore}% score</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => assignTaskToAgent('ANALYSIS')}>
                    Assign Analysis
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => assignTaskToAgent('PREDICTION')}>
                    Assign Prediction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Intent Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Intent Distribution</CardTitle>
                <CardDescription>Most commonly used voice commands</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={intentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {intentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Voice Command Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Command Interface</CardTitle>
                <CardDescription>Test voice commands and view analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Commands</p>
                    <p className="text-2xl font-bold">{voiceAnalytics?.totalCommands || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Confidence</p>
                    <p className="text-2xl font-bold">
                      {((voiceAnalytics?.avgConfidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Success Rate</p>
                  <Progress value={(voiceAnalytics?.successRate || 0) * 100} className="w-full" />
                  <p className="text-xs text-gray-500">
                    {((voiceAnalytics?.successRate || 0) * 100).toFixed(1)}% commands executed successfully
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  variant={isListening ? "destructive" : "default"}
                  onClick={() => setIsListening(!isListening)}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isListening ? 'Stop Listening' : 'Start Voice Commands'}
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Try saying:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>"Go to dashboard"</li>
                    <li>"Show me projects"</li>
                    <li>"Create new task"</li>
                    <li>"Analyze performance"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Component Health Scores</CardTitle>
                <CardDescription>Health status of system components</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Bar dataKey="health" fill="#80D8C3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Health Status Details */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current health status and incidents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health</span>
                  <Badge variant={systemHealth?.overallHealth === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth?.overallHealth || 'Unknown'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-Healing</span>
                  <Badge variant={systemHealth?.autoHealingEnabled ? 'default' : 'secondary'}>
                    {systemHealth?.autoHealingEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Incidents</span>
                  <span className="text-sm font-bold">{systemHealth?.activeIncidents || 0}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Component Status</p>
                  {systemHealth?.componentHealth?.map((component) => (
                    <div key={component.component} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{component.component}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{component.healthScore}%</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(component.status)}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nlp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NLP Processing</CardTitle>
              <CardDescription>Natural Language Processing capabilities and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Sentiment Analysis</p>
                  <p className="text-xs text-gray-500">Real-time emotion detection</p>
                </div>
                <div className="text-center">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Entity Extraction</p>
                  <p className="text-xs text-gray-500">Identify key information</p>
                </div>
                <div className="text-center">
                  <Cpu className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Intent Classification</p>
                  <p className="text-xs text-gray-500">Understand user intentions</p>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm font-medium">Topic Modeling</p>
                  <p className="text-xs text-gray-500">Extract main themes</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  The NLP system processes text in real-time with advanced language understanding capabilities.
                  It supports multiple languages and can be customized for domain-specific terminology.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
