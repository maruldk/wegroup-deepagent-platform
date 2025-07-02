
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Target,
  Quote,
  Package,
  Calendar,
  BarChart3,
  Plus,
  DollarSign,
  Users,
  Award,
  Clock,
  Zap,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Phone
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LazySalesPipeline } from '@/components/optimized/dynamic-imports';
import { debounce, createCleanupManager } from '@/lib/performance/memory-optimization';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }: AnimatedCounterProps) {
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

  return <span>{prefix}{count}{suffix}</span>;
}

export default function SellPage() {
  const [stats, setStats] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cleanupManager = createCleanupManager();
    
    const debouncedFetch = debounce(fetchDashboardData, 300);
    debouncedFetch();
    
    return () => {
      cleanupManager.cleanup();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, opportunitiesResponse, quotesResponse, activitiesResponse] = await Promise.all([
        fetch('/api/sell/analytics?period=30').catch(() => null),
        fetch('/api/sell/opportunities?limit=5').catch(() => null),
        fetch('/api/sell/quotes?limit=5').catch(() => null),
        fetch('/api/sell/activities?limit=5').catch(() => null),
      ]);

      if (statsResponse?.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (opportunitiesResponse?.ok) {
        const data = await opportunitiesResponse.json();
        setOpportunities(data.opportunities || []);
      }

      if (quotesResponse?.ok) {
        const data = await quotesResponse.json();
        setQuotes(data.quotes || []);
      }

      if (activitiesResponse?.ok) {
        const data = await activitiesResponse.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching sell dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      LEAD: 'bg-blue-100 text-blue-800',
      QUALIFIED: 'bg-yellow-100 text-yellow-800',
      PROPOSAL: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'SENT':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Quote className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Sales Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              Sales & Vertrieb Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie Ihre Sales-Pipeline und maximieren Sie Ihren Umsatz
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/sell/opportunities">
                <Plus className="h-4 w-4 mr-2" />
                Neue Opportunity
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sell/quotes">
                <Quote className="h-4 w-4 mr-2" />
                Angebot erstellen
              </Link>
            </Button>
          </div>
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
                <CardTitle className="text-sm font-medium">Umsatz (MTD)</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter 
                    end={stats?.revenue?.monthToDate || 0} 
                    suffix="€"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.revenue?.growth >= 0 ? '+' : ''}{stats?.revenue?.growth || 0}% vs. letzter Monat
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
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.opportunities?.total || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.opportunities?.active || 0} aktive Opportunities
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
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.winRate || 0} suffix="%" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.deals?.won || 0} von {stats?.deals?.total || 0} Deals gewonnen
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
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter 
                    end={stats?.pipeline?.value || 0} 
                    suffix="€"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ø {stats?.pipeline?.averageDealSize || 0}€ pro Deal
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Pipeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Sales Pipeline
                </CardTitle>
                <CardDescription>
                  Überblick über Ihre aktuelle Sales-Pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazySalesPipeline />
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="space-y-6">
            {/* Top Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Top Opportunities
                </CardTitle>
                <CardDescription>
                  Ihre wertvollsten aktiven Opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.slice(0, 4).map((opportunity, index) => (
                    <div key={opportunity.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{opportunity.title || `Opportunity ${index + 1}`}</h4>
                        <p className="text-xs text-muted-foreground">
                          {opportunity.value ? `${opportunity.value}€` : '5.000€'} • {opportunity.company || 'Firma XYZ'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(opportunity.status || 'QUALIFIED')}>
                        {opportunity.status || 'Qualified'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/sell/opportunities">Alle Opportunities</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Quotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-purple-600" />
                  Letzte Angebote
                </CardTitle>
                <CardDescription>
                  Kürzlich erstellte Angebote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotes.slice(0, 4).map((quote, index) => (
                    <div key={quote.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getQuoteStatusIcon(quote.status || 'DRAFT')}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{quote.title || `Angebot ${index + 1}`}</h4>
                          <p className="text-xs text-muted-foreground">
                            {quote.value ? `${quote.value}€` : '2.500€'} • {quote.customer || 'Kunde ABC'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {quote.status || 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/sell/quotes">Alle Angebote</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activities & Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Letzte Aktivitäten
                </CardTitle>
                <CardDescription>
                  Ihre kürzlichen Sales-Aktivitäten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {activity.type || 'Call'}: {activity.title || `Aktivität ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.opportunity || `Opportunity ${index + 1}`} • {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('de-DE') : 'Heute'}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Phone className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Noch keine Aktivitäten vorhanden</p>
                      <Button size="sm" className="mt-4" asChild>
                        <Link href="/sell/activities">Aktivität hinzufügen</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Ihre Sales-Performance der letzten 30 Tage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Conversion Rate</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {stats?.performance?.conversionRate || '23'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Ø Sales Cycle</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {stats?.performance?.avgSalesCycle || '45'} Tage
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Neue Leads</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {stats?.performance?.newLeads || '18'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Aktivitätsrate</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {stats?.performance?.activityRate || '92'}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/sell/analytics">Detaillierte Analytics</Link>
                  </Button>
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
                Häufig verwendete Sales-Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button asChild className="h-auto p-4">
                  <Link href="/sell/opportunities" className="flex flex-col items-center gap-2">
                    <Target className="h-6 w-6" />
                    <span>Neue Opportunity</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/sell/quotes" className="flex flex-col items-center gap-2">
                    <Quote className="h-6 w-6" />
                    <span>Angebot erstellen</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/sell/products" className="flex flex-col items-center gap-2">
                    <Package className="h-6 w-6" />
                    <span>Produkte verwalten</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/sell/analytics" className="flex flex-col items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Analytics anzeigen</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
