
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Building2, 
  Calendar, 
  Award,
  TrendingUp,
  UserPlus,
  UserMinus,
  Clock,
  Star
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

interface DashboardData {
  employees: {
    total: number;
    active: number;
    newHires: number;
    departures: number;
    turnoverRate: string;
    byDepartment: Array<{ departmentName: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  leave: {
    pending: number;
    approved: number;
    rejected: number;
    byType: Array<{ type: string; count: number }>;
    upcoming: Array<{
      id: string;
      employee: { firstName: string; lastName: string; employeeId: string };
      type: string;
      startDate: string;
      endDate: string;
    }>;
  };
  performance: {
    dueReviews: number;
    completedReviews: number;
    averageRating: string;
  };
  departments: Array<{
    id: string;
    name: string;
    code: string;
    _count: {
      employees: number;
      positions: number;
    };
    manager?: {
      firstName: string;
      lastName: string;
    };
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    resource: string;
    details: any;
    createdAt: string;
    userName: string;
  }>;
}

export default function HRDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/dashboard?period=${period}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Detaillierte HR-Analytics und Kennzahlen
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Letzte 7 Tage</SelectItem>
              <SelectItem value="30">Letzte 30 Tage</SelectItem>
              <SelectItem value="90">Letzte 90 Tage</SelectItem>
              <SelectItem value="365">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData}>Aktualisieren</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.employees?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              von {data?.employees?.total || 0} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neueinstellungen</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{data?.employees?.newHires || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Letzte {period} Tage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kündigungen</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.employees?.departures || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Fluktuation: {data?.employees?.turnoverRate || '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehende Reviews</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data?.performance?.dueReviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ø Rating: {data?.performance?.averageRating || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employees by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiter nach Abteilungen</CardTitle>
            <CardDescription>Verteilung der Mitarbeiter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.employees?.byDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="departmentName" 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Urlaubsanträge nach Typ</CardTitle>
            <CardDescription>Aufschlüsselung der Urlaubsarten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.leave?.byType || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data?.leave?.byType?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee Status */}
        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiterstatus</CardTitle>
            <CardDescription>Aktuelle Beschäftigungsstatus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.employees?.byStatus?.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{status.status}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Urlaubsübersicht</CardTitle>
            <CardDescription>Aktuelle Urlaubsstatistiken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Ausstehend</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {data?.leave?.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Genehmigt</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {data?.leave?.approved || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Abgelehnt</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {data?.leave?.rejected || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Abteilungsübersicht</CardTitle>
          <CardDescription>Alle Abteilungen mit Kennzahlen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.departments?.map((department) => (
              <Card key={department.id} className="border-l-4" style={{ borderLeftColor: COLORS[0] }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{department.name}</h3>
                    <span className="text-xs text-muted-foreground">{department.code}</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Mitarbeiter:</span>
                      <span className="font-medium">{department._count.employees}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Positionen:</span>
                      <span className="font-medium">{department._count.positions}</span>
                    </div>
                    {department.manager && (
                      <div className="text-xs pt-2">
                        Manager: {department.manager.firstName} {department.manager.lastName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Leave */}
      <Card>
        <CardHeader>
          <CardTitle>Anstehende Urlaube</CardTitle>
          <CardDescription>Genehmigter Urlaub in den nächsten 30 Tagen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.leave?.upcoming?.slice(0, 5)?.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">
                      {leave.employee.firstName} {leave.employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leave.employee.employeeId} • {leave.type}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.leave?.upcoming || data.leave.upcoming.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine anstehenden Urlaube gefunden
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte HR-Aktivitäten</CardTitle>
          <CardDescription>Neueste Änderungen und Updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentActivities?.slice(0, 10)?.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.resource} • von {activity.userName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.createdAt)}
                </p>
              </div>
            ))}
            {(!data?.recentActivities || data.recentActivities.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine aktuellen Aktivitäten gefunden
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
