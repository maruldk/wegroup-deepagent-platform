
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  Award,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Deal {
  id: string;
  name: string;
  description?: string;
  status: string;
  amount: number;
  currency: string;
  closedDate?: string;
  tags?: string[];
  createdAt: string;
  contact?: {
    fullName: string;
    companyName?: string;
  };
  opportunity?: {
    name: string;
    stage: string;
  };
  owner?: {
    name: string;
    email: string;
  };
  _count: {
    activities: number;
  };
}

interface DealsResponse {
  deals: Deal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchDeals();
  }, [search, status, page]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/crm/deals?${params}`);
      if (response.ok) {
        const data: DealsResponse = await response.json();
        setDeals(data.deals);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Deal löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeals(deals.filter(d => d.id !== dealId));
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'WON': 'bg-green-100 text-green-800',
      'LOST': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors['PENDING'];
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const wonDeals = deals.filter(d => d.status === 'WON');
  const lostDeals = deals.filter(d => d.status === 'LOST');
  const totalWonValue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const totalLostValue = lostDeals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Übersicht über alle abgeschlossenen und aktiven Deals
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/deals/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Deal
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewonnene Deals</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {wonDeals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalWonValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verlorene Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lostDeals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalLostValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Wert</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(deals.reduce((sum, deal) => sum + deal.amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Alle Deals ({deals.length})
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
              {deals.length > 0 
                ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1) || '0'
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Erfolgsquote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Deals durchsuchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="WON">Gewonnen</SelectItem>
                <SelectItem value="LOST">Verloren</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="CANCELLED">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deals ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Ihre Deals im Detail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Kontakt/Unternehmen</TableHead>
                      <TableHead>Wert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Abschlussdatum</TableHead>
                      <TableHead>Eigentümer</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{deal.name}</div>
                            {deal.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {deal.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deal.contact && (
                            <div>
                              <div className="font-medium">{deal.contact.fullName}</div>
                              {deal.contact.companyName && (
                                <div className="text-sm text-muted-foreground">
                                  {deal.contact.companyName}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-lg">
                            {formatCurrency(deal.amount, deal.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(deal.status)}>
                            {deal.status === 'WON' ? 'Gewonnen' :
                             deal.status === 'LOST' ? 'Verloren' :
                             deal.status === 'PENDING' ? 'Ausstehend' :
                             deal.status === 'CANCELLED' ? 'Storniert' : deal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deal.opportunity && (
                            <div>
                              <div className="font-medium">{deal.opportunity.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {deal.opportunity.stage}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(deal.closedDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deal.owner && (
                            <div className="text-sm">
                              <div className="font-medium">{deal.owner.name}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/deals/${deal.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/deals/${deal.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDeal(deal.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {[...Array(pagination.pages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === page || Math.abs(pageNum - page) <= 2) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNum);
                                }}
                                isActive={pageNum === page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < pagination.pages) setPage(page + 1);
                          }}
                          className={page >= pagination.pages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
