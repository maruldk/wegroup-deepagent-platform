
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users
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

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
  notes?: string;
  emergencyContact?: string;
  approvalDate?: string;
  approvalNotes?: string;
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
  approver?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

interface LeaveResponse {
  leaveRequests: LeaveRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function LeavePage() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [department, setDepartment] = useState('all');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, [search, status, type, department, period, page]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status,
        type,
        department,
        period,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/hr/leave?${params}`);
      if (response.ok) {
        const data: LeaveResponse = await response.json();
        setLeaveRequests(data.leaveRequests);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeaveRequest = async (leaveId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Urlaubsantrag löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/leave/${leaveId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLeaveRequests(leaveRequests.filter(l => l.id !== leaveId));
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/hr/leave/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'APPROVED',
          approvalNotes: 'Genehmigt über Dashboard'
        }),
      });

      if (response.ok) {
        fetchLeaveRequests(); // Refresh data
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/hr/leave/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'REJECTED',
          approvalNotes: 'Abgelehnt über Dashboard'
        }),
      });

      if (response.ok) {
        fetchLeaveRequests(); // Refresh data
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors['PENDING'];
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'PENDING': Clock,
      'APPROVED': CheckCircle,
      'REJECTED': XCircle,
      'CANCELLED': AlertCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'VACATION': 'bg-blue-100 text-blue-800',
      'SICK': 'bg-red-100 text-red-800',
      'PERSONAL': 'bg-purple-100 text-purple-800',
      'MATERNITY': 'bg-pink-100 text-pink-800',
      'PATERNITY': 'bg-green-100 text-green-800',
      'BEREAVEMENT': 'bg-gray-100 text-gray-800',
      'UNPAID': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || colors['VACATION'];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const isOverdue = (startDate: string, status: string) => {
    return status === 'PENDING' && new Date(startDate) < new Date();
  };

  const pendingRequests = leaveRequests.filter(l => l.status === 'PENDING');
  const approvedRequests = leaveRequests.filter(l => l.status === 'APPROVED');
  const rejectedRequests = leaveRequests.filter(l => l.status === 'REJECTED');
  const overdueRequests = leaveRequests.filter(l => isOverdue(l.startDate, l.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urlaubsmanagement</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Urlaubsanträge und Genehmigungen
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/leave/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Urlaubsantrag
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Warten auf Genehmigung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genehmigt</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Genehmigte Anträge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgelehnt</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Abgelehnte Anträge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overdueRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dringende Bearbeitung
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
                placeholder="Urlaubsanträge durchsuchen..."
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
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="APPROVED">Genehmigt</SelectItem>
                <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                <SelectItem value="CANCELLED">Storniert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="VACATION">Urlaub</SelectItem>
                <SelectItem value="SICK">Krankheit</SelectItem>
                <SelectItem value="PERSONAL">Persönlich</SelectItem>
                <SelectItem value="MATERNITY">Mutterschaft</SelectItem>
                <SelectItem value="PATERNITY">Vaterschaft</SelectItem>
                <SelectItem value="BEREAVEMENT">Trauerfall</SelectItem>
                <SelectItem value="UNPAID">Unbezahlt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zeiträume</SelectItem>
                <SelectItem value="current_month">Dieser Monat</SelectItem>
                <SelectItem value="next_month">Nächster Monat</SelectItem>
                <SelectItem value="current_quarter">Dieses Quartal</SelectItem>
                <SelectItem value="current_year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Urlaubsanträge ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Urlaubsanträge im Überblick
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
                      <TableHead>Zeitraum</TableHead>
                      <TableHead>Tage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grund</TableHead>
                      <TableHead>Genehmiger</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((leave) => (
                      <TableRow 
                        key={leave.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${
                          isOverdue(leave.startDate, leave.status) ? 'bg-orange-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={`${leave.employee.firstName} ${leave.employee.lastName}`} />
                              <AvatarFallback className="text-xs">
                                {getInitials(leave.employee.firstName, leave.employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {leave.employee.firstName} {leave.employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {leave.employee.employeeId}
                                {leave.employee.department && ` • ${leave.employee.department.name}`}
                              </div>
                              {leave.employee.position && (
                                <div className="text-xs text-muted-foreground">
                                  {leave.employee.position.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(leave.type)}>
                            {leave.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDateRange(leave.startDate, leave.endDate)}
                            </div>
                            {isOverdue(leave.startDate, leave.status) && (
                              <div className="text-xs text-orange-600 font-medium">
                                Überfällig
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{leave.days}</div>
                            <div className="text-xs text-muted-foreground">
                              Tag{leave.days !== 1 ? 'e' : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(leave.status)}
                            <Badge variant="secondary" className={getStatusColor(leave.status)}>
                              {leave.status === 'PENDING' ? 'Ausstehend' :
                               leave.status === 'APPROVED' ? 'Genehmigt' :
                               leave.status === 'REJECTED' ? 'Abgelehnt' :
                               leave.status === 'CANCELLED' ? 'Storniert' : leave.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {leave.reason && (
                            <div className="text-sm max-w-[200px] truncate" title={leave.reason}>
                              {leave.reason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {leave.approver ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {leave.approver.firstName} {leave.approver.lastName}
                              </div>
                              {leave.approvalDate && (
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(leave.approvalDate)}
                                </div>
                              )}
                            </div>
                          ) : leave.status === 'PENDING' ? (
                            <div className="text-sm text-muted-foreground">
                              Wartend
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {leave.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveLeave(leave.id);
                                  }}
                                  className="h-8 px-2 text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectLeave(leave.id);
                                  }}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/hr/leave/${leave.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Anzeigen
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/hr/leave/${leave.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                {leave.status === 'PENDING' && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteLeaveRequest(leave.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
