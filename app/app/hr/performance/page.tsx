
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Star,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle
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

interface PerformanceReview {
  id: string;
  type: string;
  reviewDate: string;
  overallRating?: number;
  status: string;
  goals?: any;
  achievements?: any;
  strengths?: string[];
  improvementAreas?: string[];
  comments?: string;
  createdAt: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      name: string;
    };
    position?: {
      title: string;
    };
  };
  reviewer?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

interface PerformanceResponse {
  reviews: PerformanceReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function PerformancePage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchPerformanceReviews();
  }, [search, status, type, department, page]);

  const fetchPerformanceReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status,
        type,
        department,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/hr/performance?${params}`);
      if (response.ok) {
        const data: PerformanceResponse = await response.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Leistungsbeurteilung löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/performance/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Error deleting performance review:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'APPROVED': 'bg-green-100 text-green-800',
    };
    return colors[status] || colors['DRAFT'];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ANNUAL': 'bg-blue-100 text-blue-800',
      'QUARTERLY': 'bg-purple-100 text-purple-800',
      'PROBATION': 'bg-orange-100 text-orange-800',
      'PROJECT': 'bg-green-100 text-green-800',
      'PROMOTION': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || colors['ANNUAL'];
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const renderStars = (rating?: number) => {
    if (!rating) return 'N/A';
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-200 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-3 w-3 text-gray-300" />);
      }
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const draftReviews = reviews.filter(r => r.status === 'DRAFT');
  const pendingReviews = reviews.filter(r => r.status === 'PENDING');
  const completedReviews = reviews.filter(r => r.status === 'COMPLETED');
  const avgRating = reviews
    .filter(r => r.overallRating)
    .reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.filter(r => r.overallRating).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Leistungsbeurteilungen und Performance Reviews
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/performance/new">
            <Plus className="h-4 w-4 mr-2" />
            Neue Beurteilung
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {draftReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Noch nicht abgeschlossen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Warten auf Review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Erfolgreich beendet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Bewertung</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRating ? avgRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              von 5.0 Sternen
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
                placeholder="Reviews durchsuchen..."
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
                <SelectItem value="DRAFT">Entwurf</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                <SelectItem value="APPROVED">Genehmigt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="ANNUAL">Jährlich</SelectItem>
                <SelectItem value="QUARTERLY">Quartalsweise</SelectItem>
                <SelectItem value="PROBATION">Probezeit</SelectItem>
                <SelectItem value="PROJECT">Projekt</SelectItem>
                <SelectItem value="PROMOTION">Beförderung</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Abteilungen</SelectItem>
                {/* Diese sollten dynamisch geladen werden */}
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="sales">Vertrieb</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Performance Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Reviews ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Leistungsbeurteilungen im Überblick
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bewertung</TableHead>
                      <TableHead>Review-Datum</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Fortschritt</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={`${review.employee.firstName} ${review.employee.lastName}`} />
                              <AvatarFallback className="text-xs">
                                {getInitials(review.employee.firstName, review.employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {review.employee.firstName} {review.employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {review.employee.employeeId}
                                {review.employee.department && ` • ${review.employee.department.name}`}
                              </div>
                              {review.employee.position && (
                                <div className="text-xs text-muted-foreground">
                                  {review.employee.position.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(review.type)}>
                            {review.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {renderStars(review.overallRating)}
                            {review.overallRating && (
                              <span className={`text-sm font-medium ${getRatingColor(review.overallRating)}`}>
                                {review.overallRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(review.reviewDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.reviewer && (
                            <div className="text-sm">
                              <div className="font-medium">
                                {review.reviewer.firstName} {review.reviewer.lastName}
                              </div>
                              <div className="text-muted-foreground">
                                {review.reviewer.employeeId}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress 
                              value={
                                review.status === 'COMPLETED' || review.status === 'APPROVED' ? 100 :
                                review.status === 'IN_PROGRESS' ? 75 :
                                review.status === 'PENDING' ? 50 :
                                review.status === 'DRAFT' ? 25 : 0
                              } 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {review.status === 'COMPLETED' || review.status === 'APPROVED' ? '100%' :
                               review.status === 'IN_PROGRESS' ? '75%' :
                               review.status === 'PENDING' ? '50%' :
                               review.status === 'DRAFT' ? '25%' : '0%'}
                            </div>
                          </div>
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
                                onClick={() => router.push(`/hr/performance/${review.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/hr/performance/${review.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteReview(review.id)}
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
