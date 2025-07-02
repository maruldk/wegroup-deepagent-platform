
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Download,
  Calculator,
  TrendingUp,
  Users,
  FileText,
  Clock,
  MoreHorizontal,
  Edit,
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

interface PayrollRecord {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  grossSalary: number;
  netSalary: number;
  currency: string;
  status: string;
  taxes?: number;
  socialSecurity?: number;
  healthInsurance?: number;
  overtime?: number;
  bonus?: number;
  deductions?: number;
  notes?: string;
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
}

// Mock data since payroll API is not fully implemented yet
const mockPayrollData: PayrollRecord[] = [
  {
    id: '1',
    payPeriodStart: '2025-01-01',
    payPeriodEnd: '2025-01-31',
    payDate: '2025-02-01',
    grossSalary: 5000,
    netSalary: 3500,
    currency: 'EUR',
    status: 'PAID',
    taxes: 1000,
    socialSecurity: 300,
    healthInsurance: 200,
    overtime: 150,
    bonus: 0,
    deductions: 0,
    createdAt: '2025-01-30',
    employee: {
      firstName: 'Max',
      lastName: 'Mustermann',
      employeeId: 'EMP001',
      department: { name: 'IT' },
      position: { title: 'Senior Developer' },
    },
  },
  // Add more mock data as needed
];

export default function PayrollPage() {
  const router = useRouter();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [period, setPeriod] = useState('current_month');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: mockPayrollData.length,
    page: 1,
    limit: 10,
    pages: 1,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colors[status] || colors['DRAFT'];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  };

  const totalGrossSalary = payrollRecords.reduce((sum, record) => sum + record.grossSalary, 0);
  const totalNetSalary = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0);
  const totalTaxes = payrollRecords.reduce((sum, record) => sum + (record.taxes || 0), 0);
  const paidRecords = payrollRecords.filter(r => r.status === 'PAID');
  const pendingRecords = payrollRecords.filter(r => r.status === 'PENDING' || r.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gehaltsabrechnung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Gehaltsabrechnungen und Lohnbuchhaltung
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/hr/payroll/export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
          <Button asChild>
            <Link href="/hr/payroll/new">
              <Plus className="h-4 w-4 mr-2" />
              Neue Abrechnung
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bruttolohn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGrossSalary)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gesamtbetrag diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nettolohn</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalNetSalary)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ausgezahlt an Mitarbeiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steuern & Abgaben</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalTaxes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Abgeführte Steuern
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausgezahlt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paidRecords.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingRecords.length} ausstehend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Massenabrechnung
            </CardTitle>
            <CardDescription>
              Alle Mitarbeiter auf einmal abrechnen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/hr/payroll/bulk">
                Massenabrechnung starten
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Berichte
            </CardTitle>
            <CardDescription>
              Lohn- und Gehaltsberichte generieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/hr/payroll/reports">
                Berichte erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Zeiterfassung
            </CardTitle>
            <CardDescription>
              Arbeitszeiten für Abrechnung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/hr/timesheets">
                Zeiterfassung öffnen
              </Link>
            </Button>
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
                placeholder="Abrechnungen durchsuchen..."
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
                <SelectItem value="APPROVED">Genehmigt</SelectItem>
                <SelectItem value="PAID">Ausgezahlt</SelectItem>
                <SelectItem value="CANCELLED">Storniert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Abteilungen</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="sales">Vertrieb</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Dieser Monat</SelectItem>
                <SelectItem value="last_month">Letzter Monat</SelectItem>
                <SelectItem value="current_quarter">Dieses Quartal</SelectItem>
                <SelectItem value="current_year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gehaltsabrechnungen ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Lohn- und Gehaltsabrechnungen im Überblick
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
                      <TableHead>Abrechnungszeitraum</TableHead>
                      <TableHead>Bruttolohn</TableHead>
                      <TableHead>Abzüge</TableHead>
                      <TableHead>Nettolohn</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zahldatum</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={`${record.employee.firstName} ${record.employee.lastName}`} />
                              <AvatarFallback className="text-xs">
                                {getInitials(record.employee.firstName, record.employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {record.employee.firstName} {record.employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.employee.employeeId}
                                {record.employee.department && ` • ${record.employee.department.name}`}
                              </div>
                              {record.employee.position && (
                                <div className="text-xs text-muted-foreground">
                                  {record.employee.position.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDateRange(record.payPeriodStart, record.payPeriodEnd)}
                            </div>
                            <div className="text-muted-foreground">
                              1 Monat
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(record.grossSalary, record.currency)}
                          </div>
                          {record.overtime && record.overtime > 0 && (
                            <div className="text-xs text-green-600">
                              +{formatCurrency(record.overtime)} Überstunden
                            </div>
                          )}
                          {record.bonus && record.bonus > 0 && (
                            <div className="text-xs text-blue-600">
                              +{formatCurrency(record.bonus)} Bonus
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {record.taxes && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Steuern:</span>
                                <span className="text-red-600">-{formatCurrency(record.taxes)}</span>
                              </div>
                            )}
                            {record.socialSecurity && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sozialvers.:</span>
                                <span className="text-red-600">-{formatCurrency(record.socialSecurity)}</span>
                              </div>
                            )}
                            {record.healthInsurance && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Krankenvers.:</span>
                                <span className="text-red-600">-{formatCurrency(record.healthInsurance)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-lg text-green-600">
                            {formatCurrency(record.netSalary, record.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((record.netSalary / record.grossSalary) * 100).toFixed(1)}% vom Brutto
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(record.status)}>
                            {record.status === 'DRAFT' ? 'Entwurf' :
                             record.status === 'PENDING' ? 'Ausstehend' :
                             record.status === 'APPROVED' ? 'Genehmigt' :
                             record.status === 'PAID' ? 'Ausgezahlt' :
                             record.status === 'CANCELLED' ? 'Storniert' : record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(record.payDate)}
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
                                onClick={() => router.push(`/hr/payroll/${record.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/hr/payroll/${record.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/hr/payroll/${record.id}/pdf`, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* No pagination needed for mock data */}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
