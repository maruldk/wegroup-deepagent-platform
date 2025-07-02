
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PROSPECT: 'bg-blue-100 text-blue-800',
      CHURNED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      ACTIVE: 'Aktiv',
      INACTIVE: 'Inaktiv',
      PROSPECT: 'Interessent',
      CHURNED: 'Gekündigt',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Kunden...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Kunden</h1>
            <p className="text-gray-600 mt-2">
              Alle Ihre Kundenkonten einsehen, durchsuchen und verwalten
            </p>
          </div>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Neuen Kunden anlegen
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
                  placeholder="Nach Name, Firma oder E-Mail suchen..."
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
                    <SelectItem value="ACTIVE">Aktiv</SelectItem>
                    <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                    <SelectItem value="PROSPECT">Interessent</SelectItem>
                    <SelectItem value="CHURNED">Gekündigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/customers/${customer.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{customer.companyName}</CardTitle>
                        {customer.contactPerson && (
                          <CardDescription>{customer.contactPerson}</CardDescription>
                        )}
                      </div>
                      <Badge className={getStatusColor(customer.status)}>
                        {getStatusLabel(customer.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {(customer.city || customer.country) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {customer.city && customer.country
                            ? `${customer.city}, ${customer.country}`
                            : customer.city || customer.country}
                        </div>
                      )}
                      {customer.contactHistories && customer.contactHistories.length > 0 && (
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          {customer.contactHistories.length} Kontakt
                          {customer.contactHistories.length !== 1 ? 'e' : ''}
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
        {customers.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Users className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Kunden gefunden
            </h3>
            <p className="text-gray-600 mb-6">
              {search || statusFilter !== 'all'
                ? 'Keine Kunden entsprechen den aktuellen Filterkriterien.'
                : 'Legen Sie Ihren ersten Kunden an, um zu beginnen.'}
            </p>
            <Button asChild>
              <Link href="/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Kunden anlegen
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
