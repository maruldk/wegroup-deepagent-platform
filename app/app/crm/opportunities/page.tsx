
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp
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

interface Opportunity {
  id: string;
  name: string;
  description?: string;
  stage: string;
  amount?: number;
  currency: string;
  probability?: number;
  expectedCloseDate?: string;
  source: string;
  tags?: string[];
  createdAt: string;
  contact?: {
    fullName: string;
    companyName?: string;
  };
  owner?: {
    name: string;
    email: string;
  };
  _count: {
    activities: number;
    deals: number;
  };
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchOpportunities();
  }, [search, stage, page]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        stage,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/crm/opportunities?${params}`);
      if (response.ok) {
        const data: OpportunitiesResponse = await response.json();
        setOpportunities(data.opportunities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Opportunity löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOpportunities(opportunities.filter(o => o.id !== opportunityId));
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'LEAD': 'bg-blue-100 text-blue-800',
      'QUALIFIED': 'bg-yellow-100 text-yellow-800',
      'PROPOSAL': 'bg-orange-100 text-orange-800',
      'NEGOTIATION': 'bg-purple-100 text-purple-800',
      'CLOSED_WON': 'bg-green-100 text-green-800',
      'CLOSED_LOST': 'bg-red-100 text-red-800',
    };
    return colors[stage] || colors['LEAD'];
  };

  const getStageProgress = (stage: string) => {
    const progressMap: Record<string, number> = {
      'LEAD': 10,
      'QUALIFIED': 30,
      'PROPOSAL': 50,
      'NEGOTIATION': 80,
      'CLOSED_WON': 100,
      'CLOSED_LOST': 0,
    };
    return progressMap[stage] || 0;
  };

  const formatCurrency = (amount?: number, currency = 'EUR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Sales-Pipeline und Geschäftsmöglichkeiten
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/opportunities/new">
            <Plus className="h-4 w-4 mr-2" />
            Neue Opportunity
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {opportunities.length} Opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualifiziert</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.filter(o => o.stage === 'QUALIFIED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktive Opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verhandlung</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.filter(o => o.stage === 'NEGOTIATION').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Kurz vor Abschluss
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
              {opportunities.length > 0 
                ? ((opportunities.filter(o => o.stage === 'CLOSED_WON').length / opportunities.length) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conversion Rate
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
                placeholder="Opportunities durchsuchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Phasen</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="QUALIFIED">Qualifiziert</SelectItem>
                <SelectItem value="PROPOSAL">Angebot</SelectItem>
                <SelectItem value="NEGOTIATION">Verhandlung</SelectItem>
                <SelectItem value="CLOSED_WON">Gewonnen</SelectItem>
                <SelectItem value="CLOSED_LOST">Verloren</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Opportunities ({pagination.total})
          </CardTitle>
          <CardDescription>
            Ihre Sales-Pipeline im Detail
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
                      <TableHead>Name</TableHead>
                      <TableHead>Kontakt/Unternehmen</TableHead>
                      <TableHead>Wert</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Fortschritt</TableHead>
                      <TableHead>Abschluss erwartet</TableHead>
                      <TableHead>Eigentümer</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunities.map((opportunity) => (
                      <TableRow key={opportunity.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{opportunity.name}</div>
                            {opportunity.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {opportunity.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {opportunity.contact && (
                            <div>
                              <div className="font-medium">{opportunity.contact.fullName}</div>
                              {opportunity.contact.companyName && (
                                <div className="text-sm text-muted-foreground">
                                  {opportunity.contact.companyName}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(opportunity.amount, opportunity.currency)}
                          </div>
                          {opportunity.probability && (
                            <div className="text-sm text-muted-foreground">
                              {opportunity.probability}% Wahrscheinlichkeit
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStageColor(opportunity.stage)}>
                            {opportunity.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress 
                              value={getStageProgress(opportunity.stage)} 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {getStageProgress(opportunity.stage)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(opportunity.expectedCloseDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {opportunity.owner && (
                            <div className="text-sm">
                              <div className="font-medium">{opportunity.owner.name}</div>
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
                                onClick={() => router.push(`/crm/opportunities/${opportunity.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/opportunities/${opportunity.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteOpportunity(opportunity.id)}
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
