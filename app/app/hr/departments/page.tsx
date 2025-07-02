
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  Plus, 
  Search,
  Users,
  UserCheck,
  Briefcase,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  costCenter?: string;
  budget?: number;
  createdAt: string;
  manager?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
  };
  parentDepartment?: {
    name: string;
    code: string;
  };
  childDepartments: Array<{
    name: string;
    code: string;
  }>;
  _count: {
    employees: number;
    positions: number;
    childDepartments: number;
  };
}

interface DepartmentsResponse {
  departments: Department[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchDepartments();
  }, [search, page]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '12',
      });

      const response = await fetch(`/api/hr/departments?${params}`);
      if (response.ok) {
        const data: DepartmentsResponse = await response.json();
        setDepartments(data.departments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Abteilung löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDepartments(departments.filter(d => d.id !== departmentId));
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totalEmployees = departments.reduce((sum, dept) => sum + dept._count.employees, 0);
  const totalPositions = departments.reduce((sum, dept) => sum + dept._count.positions, 0);
  const avgEmployeesPerDept = departments.length > 0 ? (totalEmployees / departments.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abteilungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Organisationsstruktur und Abteilungshierarchie
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/departments/new">
            <Plus className="h-4 w-4 mr-2" />
            Neue Abteilung
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abteilungen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Ø {avgEmployeesPerDept} pro Abteilung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positionen</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Verfügbare Stellen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mit Manager</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.manager).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Abteilungen mit Leitung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Abteilungen durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          departments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {department.code}
                      </Badge>
                      {department.location && (
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {department.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/hr/departments/${department.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/hr/departments/${department.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {department.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {department.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Manager */}
                {department.manager && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={`${department.manager.firstName} ${department.manager.lastName}`} />
                      <AvatarFallback className="text-xs">
                        {getInitials(department.manager.firstName, department.manager.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {department.manager.firstName} {department.manager.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Abteilungsleiter • {department.manager.employeeId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Parent Department */}
                {department.parentDepartment && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Übergeordnet:</span>
                    <div className="font-medium">{department.parentDepartment.name}</div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {department._count.employees}
                    </div>
                    <div className="text-xs text-muted-foreground">Mitarbeiter</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {department._count.positions}
                    </div>
                    <div className="text-xs text-muted-foreground">Positionen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {department._count.childDepartments}
                    </div>
                    <div className="text-xs text-muted-foreground">Unterabt.</div>
                  </div>
                </div>

                {/* Budget & Cost Center */}
                {(department.budget || department.costCenter) && (
                  <div className="pt-3 border-t space-y-1">
                    {department.budget && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium">{formatCurrency(department.budget)}</span>
                      </div>
                    )}
                    {department.costCenter && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kostenstelle:</span>
                        <span className="font-medium">{department.costCenter}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Child Departments */}
                {department.childDepartments.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Unterabteilungen:</p>
                    <div className="flex flex-wrap gap-1">
                      {department.childDepartments.slice(0, 3).map((child, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {child.code}
                        </Badge>
                      ))}
                      {department.childDepartments.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{department.childDepartments.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
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
    </div>
  );
}
