
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, TrendingUp, Mail, Phone, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/lib/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
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
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      NEW: 'Neu',
      CONTACTED: 'Kontaktiert',
      QUALIFIED: 'Qualifiziert',
      PROPOSAL: 'Angebot',
      NEGOTIATION: 'Verhandlung',
      WON: 'Gewonnen',
      LOST: 'Verloren',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return 'Nicht angegeben';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Leads...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie Ihre Verkaufschancen und Pipeline
            </p>
          </div>
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="h-4 w-4 mr-2" />
              Neuen Lead erstellen
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nach Firma, Kontaktperson oder E-Mail suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="NEW">Neu</SelectItem>
                    <SelectItem value="CONTACTED">Kontaktiert</SelectItem>
                    <SelectItem value="QUALIFIED">Qualifiziert</SelectItem>
                    <SelectItem value="PROPOSAL">Angebot</SelectItem>
                    <SelectItem value="NEGOTIATION">Verhandlung</SelectItem>
                    <SelectItem value="WON">Gewonnen</SelectItem>
                    <SelectItem value="LOST">Verloren</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/leads/${lead.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{lead.companyName}</CardTitle>
                        {lead.contactPerson && (
                          <CardDescription>{lead.contactPerson}</CardDescription>
                        )}
                      </div>
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lead.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.assignedUser && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          {lead.assignedUser.name || lead.assignedUser.email}
                        </div>
                      )}
                      {lead.estimatedValue && (
                        <div className="flex items-center text-sm text-gray-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {formatCurrency(lead.estimatedValue)}
                        </div>
                      )}
                      {lead.source && (
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Quelle: {lead.source}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {leads.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <TrendingUp className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Leads gefunden
            </h3>
            <p className="text-gray-600 mb-6">
              {search || statusFilter !== 'all'
                ? 'Keine Leads entsprechen den aktuellen Filterkriterien.'
                : 'Erstellen Sie Ihren ersten Lead, um Ihre Pipeline zu starten.'}
            </p>
            <Button asChild>
              <Link href="/leads/new">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Lead erstellen
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
