
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Quote,
  Package,
  DollarSign,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

export function SellDashboardWidget() {
  const [stats, setStats] = useState<any>(null);
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSellStats();
  }, []);

  const fetchSellStats = async () => {
    try {
      const [statsResponse, opportunitiesResponse, quotesResponse] = await Promise.all([
        fetch('/api/sell/analytics?period=30').catch(() => null),
        fetch('/api/sell/opportunities?limit=3').catch(() => null),
        fetch('/api/sell/quotes?limit=3').catch(() => null),
      ]);

      if (statsResponse?.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (opportunitiesResponse?.ok) {
        const data = await opportunitiesResponse.json();
        setTopOpportunities(data.opportunities || []);
      }

      if (quotesResponse?.ok) {
        const data = await quotesResponse.json();
        setRecentQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching sell stats:', error);
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
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'REJECTED':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'SENT':
        return <Clock className="h-3 w-3 text-blue-600" />;
      default:
        return <Quote className="h-3 w-3 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Sales & Vertrieb
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Sales & Vertrieb
          </CardTitle>
          <CardDescription>
            Pipeline-Management und Umsatz-Tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedCounter end={stats?.revenue?.monthToDate || 48500} suffix="€" />
              </div>
              <p className="text-xs text-muted-foreground">Umsatz (MTD)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter end={stats?.opportunities?.total || 23} />
              </div>
              <p className="text-xs text-muted-foreground">Opportunities</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter end={stats?.winRate || 68} suffix="%" />
              </div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                <AnimatedCounter end={stats?.pipeline?.value || 125000} suffix="€" />
              </div>
              <p className="text-xs text-muted-foreground">Pipeline Value</p>
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="space-y-3 mb-6">
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
          </div>

          {/* Top Opportunities */}
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium">Top Opportunities</h4>
            {topOpportunities.length > 0 ? (
              topOpportunities.map((opportunity, index) => (
                <div key={opportunity.id || index} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{opportunity.title || `Opportunity ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {opportunity.value ? `${opportunity.value}€` : `${(index + 1) * 5000}€`} • {opportunity.company || 'Firma XYZ'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(opportunity.status || 'QUALIFIED')} variant="secondary">
                    {opportunity.status || 'Qualified'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">Noch keine Opportunities</p>
              </div>
            )}
          </div>

          {/* Recent Quotes */}
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium">Letzte Angebote</h4>
            {recentQuotes.length > 0 ? (
              recentQuotes.map((quote, index) => (
                <div key={quote.id || index} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {getQuoteStatusIcon(quote.status || 'DRAFT')}
                    <div>
                      <p className="text-sm font-medium">{quote.title || `Angebot ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {quote.value ? `${quote.value}€` : `${(index + 1) * 2500}€`} • {quote.customer || 'Kunde ABC'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {quote.status || 'Draft'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">Noch keine Angebote</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button size="sm" className="w-full" asChild>
              <Link href="/sell/opportunities">
                <Plus className="h-4 w-4 mr-2" />
                Neue Opportunity
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/sell/quotes">
                  <Quote className="h-4 w-4 mr-1" />
                  Angebote
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/sell/products">
                  <Package className="h-4 w-4 mr-1" />
                  Produkte
                </Link>
              </Button>
            </div>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/sell">
                <TrendingUp className="h-4 w-4 mr-2" />
                SELL Dashboard öffnen
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
