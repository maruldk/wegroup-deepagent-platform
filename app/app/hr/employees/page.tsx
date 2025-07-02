
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Building,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Calendar
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

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  hireDate: string;
  status: string;
  contractType: string;
  employmentType: string;
  workingHours: number;
  salary?: number;
  currency: string;
  createdAt: string;
  department?: {
    name: string;
    code: string;
  };
  position?: {
    title: string;
    level: string;
  };
  manager?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  _count: {
    directReports: number;
    performanceReviews: number;
    leaveRequests: number;
  };
}

interface EmployeesResponse {
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchEmployees();
  }, [search, department, status, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        department,
        status,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/hr/employees?${params}`);
      if (response.ok) {
        const data: EmployeesResponse = await response.json();
        setEmployees(data.employees);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEmployees(employees.filter(e => e.id !== employeeId));
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'TERMINATED': 'bg-red-100 text-red-800',
      'ON_LEAVE': 'bg-blue-100 text-blue-800',
      'PROBATION': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || colors['ACTIVE'];
  };

  const getContractTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'FULL_TIME': 'bg-blue-100 text-blue-800',
      'PART_TIME': 'bg-purple-100 text-purple-800',
      'CONTRACT': 'bg-orange-100 text-orange-800',
      'INTERN': 'bg-pink-100 text-pink-800',
      'FREELANCE': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors['FULL_TIME'];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount?: number, currency = 'EUR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Mitarbeiterdaten und Profile
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/employees/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Mitarbeiter
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              Alle Mitarbeiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(e => e.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktuell beschäftigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vollzeit</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(e => e.contractType === 'FULL_TIME').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Vollzeitbeschäftigte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Mitarbeiter</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {employees.filter(e => {
                const hireDate = new Date(e.hireDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return hireDate >= thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Letzte 30 Tage
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
                placeholder="Mitarbeiter durchsuchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="ACTIVE">Aktiv</SelectItem>
                <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                <SelectItem value="ON_LEAVE">Beurlaubt</SelectItem>
                <SelectItem value="PROBATION">Probezeit</SelectItem>
                <SelectItem value="TERMINATED">Gekündigt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mitarbeiter ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Mitarbeiter im Überblick
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
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead>Abteilung/Position</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vertragsart</TableHead>
                      <TableHead>Eingestellt</TableHead>
                      <TableHead>Vorgesetzter</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={employee.fullName} />
                              <AvatarFallback className="text-xs">
                                {getInitials(employee.firstName, employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{employee.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {employee.employeeId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {employee.department && (
                              <div className="font-medium">{employee.department.name}</div>
                            )}
                            {employee.position && (
                              <div className="text-sm text-muted-foreground">
                                {employee.position.title}
                                {employee.position.level && ` (${employee.position.level})`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {employee.email}
                              </div>
                            )}
                            {(employee.phone || employee.mobile) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {employee.phone || employee.mobile}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getContractTypeColor(employee.contractType)}>
                            {employee.contractType}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {employee.workingHours}h/Woche
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(employee.hireDate)}
                          </div>
                          {employee.salary && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(employee.salary, employee.currency)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.manager && (
                            <div className="text-sm">
                              <div className="font-medium">
                                {employee.manager.firstName} {employee.manager.lastName}
                              </div>
                              <div className="text-muted-foreground">
                                {employee.manager.employeeId}
                              </div>
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
                                onClick={() => router.push(`/hr/employees/${employee.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/hr/employees/${employee.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEmployee(employee.id)}
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
