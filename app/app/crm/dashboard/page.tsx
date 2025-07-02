
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

interface DashboardData {
  contacts: {
    total: number;
    newThisMonth: number;
    bySource: Array<{ source: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  opportunities: {
    total: number;
    totalValue: number;
    byStage: Array<{ stage: string; count: number; value: number }>;
    wonRate: number;
  };
  deals: {
    total: number;
    totalValue: number;
    thisMonth: number;
    thisMonthValue: number;
    byMonth: Array<{ month: string; count: number; value: number }>;
  };
  activities: {
    total: number;
    thisWeek: number;
    byType: Array<{ type: string; count: number }>;
    recent: Array<{ id: string; type: string; description: string; createdAt: string }>;
  };
}

export default function CRMDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/dashboard?period=${period}`);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Detaillierte CRM-Analytics und Kennzahlen
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
            <CardTitle className="text-sm font-medium">Kontakte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.contacts?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.contacts?.newThisMonth || 0} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.opportunities?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pipeline: {formatCurrency(data?.opportunities?.totalValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.deals?.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data?.deals?.thisMonthValue || 0)} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.opportunities?.wonRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conversion Rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contacts by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Kontakte nach Quelle</CardTitle>
            <CardDescription>Verteilung der Kontaktquellen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.contacts?.bySource || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data?.contacts?.bySource?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline nach Phase</CardTitle>
            <CardDescription>Opportunities in verschiedenen Phasen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.opportunities?.byStage || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="stage" 
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
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? value : formatCurrency(Number(value)),
                      name === 'count' ? 'Anzahl' : 'Wert'
                    ]}
                  />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deal Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Deal-Trend</CardTitle>
            <CardDescription>Monatliche Deal-Entwicklung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.deals?.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? value : formatCurrency(Number(value)),
                      name === 'count' ? 'Anzahl' : 'Wert'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS[1]} 
                    strokeWidth={3}
                    dot={{ fill: COLORS[1], strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitäten</CardTitle>
            <CardDescription>CRM-Aktivitäten nach Typ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.activities?.byType?.map((activity, index) => (
                <div key={activity.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{activity.type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.count}</span>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  {data?.activities?.thisWeek || 0} Aktivitäten diese Woche
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
          <CardDescription>Neueste CRM-Aktivitäten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.activities?.recent?.slice(0, 5)?.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.type}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString('de-DE')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
