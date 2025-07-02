
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  UserCheck, 
  Activity, 
  Target, 
  DollarSign, 
  Phone, 
  Award, 
  Calendar, 
  Building2,
  Plane,
  Calculator,
  Palette,
  Lightbulb,
  FileText,
  FolderKanban,
  BarChart3,
  Package,
  Quote
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DashboardStats } from '@/lib/types';
import { CreateDashboardWidget } from '@/components/create/create-dashboard-widget';
import { SellDashboardWidget } from '@/components/sell/sell-dashboard-widget';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
}

function AnimatedCounter({ end, duration = 2000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<any[]>([]);
  const [crmStats, setCrmStats] = useState<any>(null);
  const [hrStats, setHrStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, crmResponse, hrResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/crm/dashboard?period=30').catch(() => null),
        fetch('/api/hr/dashboard?period=30').catch(() => null),
      ]);

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setStats({
          totalCustomers: data.totalCustomers,
          totalLeads: data.totalLeads,
          totalUsers: data.totalUsers,
          activeCustomers: data.activeCustomers,
          newLeadsThisMonth: data.newLeadsThisMonth,
        });
        setActivities(data.recentActivities || []);
        setLeadsByStatus(data.leadsByStatus || []);
      }

      if (crmResponse?.ok) {
        const crmData = await crmResponse.json();
        setCrmStats(crmData);
      }

      if (hrResponse?.ok) {
        const hrData = await hrResponse.json();
        setHrStats(hrData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      PROPOSAL: 'bg-purple-100 text-purple-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActionTitle = (action: string) => {
    const titles: { [key: string]: string } = {
      USER_CREATED: 'Benutzer erstellt',
      CUSTOMER_CREATED: 'Kunde angelegt',
      CUSTOMER_UPDATED: 'Kunde aktualisiert',
      LEAD_CREATED: 'Lead erstellt',
      LEAD_UPDATED: 'Lead aktualisiert',
      CONTACT_HISTORY_CREATED: 'Kontakt hinzugefügt',
    };
    return titles[action] || action;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Ihr zentraler Überblick über Kunden, Leads und Aktivitäten
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamtkunden</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.totalCustomers || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeCustomers || 0} aktive Kunden
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamte Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.totalLeads || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.newLeadsThisMonth || 0} neue diesen Monat
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
                <UserCheck className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.totalUsers || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Registrierte Benutzer
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neue Leads</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.newLeadsThisMonth || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Diesen Monat
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Business Module Widgets */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* CRM Stats */}
          {crmStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    CRM Übersicht
                  </CardTitle>
                  <CardDescription>
                    Kontakte, Opportunities und Deal-Pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        <AnimatedCounter end={crmStats.contacts?.total || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Kontakte</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        <AnimatedCounter end={crmStats.opportunities?.total || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Opportunities</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        <AnimatedCounter end={crmStats.deals?.thisMonth || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Deals</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {crmStats.opportunities?.wonRate?.toFixed(1) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" asChild>
                      <Link href="/crm">CRM Dashboard öffnen</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* HR Stats */}
          {hrStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    HR Übersicht
                  </CardTitle>
                  <CardDescription>
                    Mitarbeiter, Urlaub und Performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        <AnimatedCounter end={hrStats.employees?.active || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        <AnimatedCounter end={hrStats.departments?.length || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Abteilungen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        <AnimatedCounter end={hrStats.leave?.pending || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Urlaubsanträge</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        <AnimatedCounter end={hrStats.performance?.dueReviews || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" asChild>
                      <Link href="/hr">HR Dashboard öffnen</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CREATE Module Widget */}
          <CreateDashboardWidget />

          {/* SELL Module Widget */}
          <SellDashboardWidget />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Lead-Status Übersicht</CardTitle>
                <CardDescription>
                  Verteilung der Leads nach aktuellem Status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.status === 'NEW' && 'Neu'}
                          {item.status === 'CONTACTED' && 'Kontaktiert'}
                          {item.status === 'QUALIFIED' && 'Qualifiziert'}
                          {item.status === 'PROPOSAL' && 'Angebot'}
                          {item.status === 'WON' && 'Gewonnen'}
                          {item.status === 'LOST' && 'Verloren'}
                        </span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
                <CardDescription>
                  Aktuelle Systemaktivitäten und Änderungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {getActionTitle(activity.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user?.name || 'System'} • {' '}
                          {new Date(activity.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Häufig verwendete Funktionen für effizienten Zugriff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Core Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Kern-Funktionen</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href="/customers/new">Neuen Kunden anlegen</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/leads/new">Neuen Lead erstellen</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/customers">Kundenliste anzeigen</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/ai-chat">KI-Assistent starten</Link>
                    </Button>
                  </div>
                </div>

                {/* CRM Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    CRM
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/crm/contacts/new">
                        <Phone className="h-3 w-3 mr-1" />
                        Neuer Kontakt
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/crm/opportunities/new">
                        <Target className="h-3 w-3 mr-1" />
                        Neue Opportunity
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/crm/deals">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Deals anzeigen
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/crm/dashboard">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        CRM Analytics
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* HR Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    HR
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/hr/employees/new">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Neuer Mitarbeiter
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/hr/leave/new">
                        <Plane className="h-3 w-3 mr-1" />
                        Urlaubsantrag
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/hr/performance/new">
                        <Award className="h-3 w-3 mr-1" />
                        Performance Review
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/hr/dashboard">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        HR Analytics
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* CREATE Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Content Creation
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/create/ai-generate">
                        <Lightbulb className="h-3 w-3 mr-1" />
                        KI-Generierung
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/create/templates">
                        <FileText className="h-3 w-3 mr-1" />
                        Neues Template
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/create/projects">
                        <FolderKanban className="h-3 w-3 mr-1" />
                        Content-Projekt
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/create/analytics">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Content Analytics
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* SELL Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Sales & Vertrieb
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sell/opportunities">
                        <Target className="h-3 w-3 mr-1" />
                        Neue Opportunity
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sell/quotes">
                        <Quote className="h-3 w-3 mr-1" />
                        Angebot erstellen
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sell/products">
                        <Package className="h-3 w-3 mr-1" />
                        Produktkatalog
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/sell/analytics">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Sales Analytics
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
