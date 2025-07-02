
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Server, 
  Database, 
  Activity, 
  Clock, 
  Users, 
  Building2, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  BarChart3,
  HardDrive,
  Cpu,
  Monitor,
  Network,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SystemStats {
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    nodeVersion: string;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    performance: {
      avgQueryTime: number;
      slowQueries: number;
    };
  };
  application: {
    totalUsers: number;
    activeUsers: number;
    totalTenants: number;
    activeTenants: number;
    totalSessions: number;
    errorRate: number;
  };
  security: {
    failedLogins: number;
    suspiciousActivities: number;
    activeSecurityRules: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

interface ActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  module: string;
  userId?: string;
  tenantId?: string;
}

export default function SystemOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [statsResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/system/stats'),
        fetch('/api/admin/system/logs?limit=50')
      ]);

      if (statsResponse.ok && logsResponse.ok) {
        const statsData = await statsResponse.json();
        const logsData = await logsResponse.json();
        
        setStats(statsData.stats);
        setActivityLogs(logsData.logs || []);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">System-Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fehler beim Laden der System-Daten</h3>
          <p className="text-gray-600 mb-4">Die System-Übersicht konnte nicht geladen werden.</p>
          <Button onClick={fetchSystemData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System-Übersicht</h1>
          <p className="text-gray-600">Systemstatus, Performance und Aktivitäten überwachen</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Letztes Update: {lastRefresh.toLocaleTimeString('de-DE')}
          </div>
          <Button onClick={fetchSystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Server Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(stats.server.status)}`}>
                {getStatusIcon(stats.server.status)}
                <span className="text-sm font-medium capitalize">{stats.server.status}</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Server</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Uptime: {stats.server.uptime}</div>
              <div>Node: {stats.server.nodeVersion}</div>
              <div>CPU: {stats.server.cpuUsage.toFixed(1)}%</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Memory</span>
                <span>{stats.server.memoryUsage.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.server.memoryUsage.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(stats.database.status)}`}>
                {getStatusIcon(stats.database.status)}
                <span className="text-sm font-medium capitalize">{stats.database.status}</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Datenbank</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Verbindungen: {stats.database.connections.active}/{stats.database.connections.total}</div>
              <div>Ø Query: {stats.database.performance.avgQueryTime}ms</div>
              <div>Langsame Queries: {stats.database.performance.slowQueries}</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Connections</span>
                <span>{Math.round((stats.database.connections.active / stats.database.connections.total) * 100)}%</span>
              </div>
              <Progress value={(stats.database.connections.active / stats.database.connections.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-600">
                {stats.application.errorRate < 1 ? 'Stabil' : 'Instabil'}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Anwendung</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Benutzer: {stats.application.totalUsers} ({stats.application.activeUsers} aktiv)</div>
              <div>Mandanten: {stats.application.totalTenants} ({stats.application.activeTenants} aktiv)</div>
              <div>Sessions: {stats.application.totalSessions}</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Error Rate</span>
                <span>{stats.application.errorRate.toFixed(2)}%</span>
              </div>
              <Progress value={stats.application.errorRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-sm font-medium text-gray-600">
                {stats.security.suspiciousActivities === 0 ? 'Sicher' : 'Verdächtig'}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Sicherheit</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Fehlgeschlagene Logins: {stats.security.failedLogins}</div>
              <div>Verdächtige Aktivitäten: {stats.security.suspiciousActivities}</div>
              <div>Aktive Regeln: {stats.security.activeSecurityRules}</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Threat Level</span>
                <span>{stats.security.suspiciousActivities > 10 ? 'Hoch' : stats.security.suspiciousActivities > 0 ? 'Mittel' : 'Niedrig'}</span>
              </div>
              <Progress 
                value={Math.min(stats.security.suspiciousActivities * 10, 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Aktivitäten</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Ressourcen</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Netzwerk</span>
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Response Times</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Durchschnitt</span>
                    <span className="font-medium">{stats.performance.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests/Min</span>
                    <span className="font-medium">{stats.performance.requestsPerMinute}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-medium text-red-600">{stats.performance.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Performance</span>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Benutzer</span>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">+8%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fehler</span>
                    <div className="flex items-center text-red-600">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">-23%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System-Aktivitäten</CardTitle>
              <CardDescription>
                Letzte 50 System-Events und Logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeit</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Modul</TableHead>
                      <TableHead>Nachricht</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString('de-DE')}
                        </TableCell>
                        <TableCell>
                          {getLogLevelBadge(log.level)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>CPU & Memory</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Auslastung</span>
                    <span>{stats.server.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.server.cpuUsage} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Auslastung</span>
                    <span>{stats.server.memoryUsage.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.server.memoryUsage.percentage} className="h-3" />
                  <div className="text-xs text-gray-500 mt-1">
                    {(stats.server.memoryUsage.used / 1024 / 1024).toFixed(0)} MB / {(stats.server.memoryUsage.total / 1024 / 1024).toFixed(0)} MB
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Datenbank Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Verbindungen</span>
                    <span>{stats.database.connections.active}/{stats.database.connections.total}</span>
                  </div>
                  <Progress value={(stats.database.connections.active / stats.database.connections.total) * 100} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ø Query Zeit</span>
                    <p className="font-medium">{stats.database.performance.avgQueryTime}ms</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Langsame Queries</span>
                    <p className="font-medium">{stats.database.performance.slowQueries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.performance.requestsPerMinute}
                </div>
                <p className="text-sm text-gray-600">Requests pro Minute</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.performance.avgResponseTime}ms
                </div>
                <p className="text-sm text-gray-600">Durchschnittliche Antwortzeit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {stats.performance.errorRate.toFixed(2)}%
                </div>
                <p className="text-sm text-gray-600">Fehlerrate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
