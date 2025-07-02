
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
  Phone,
  Mail,
  MessageSquare,
  Users,
  Clock,
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
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
  deal?: {
    name: string;
    amount: number;
    currency: string;
  };
  owner?: {
    name: string;
    email: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
}

interface ActivitiesResponse {
  activities: Activity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchActivities();
  }, [search, type, status, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        type,
        status,
        page: page.toString(),
        limit: '15',
      });

      const response = await fetch(`/api/crm/activities?${params}`);
      if (response.ok) {
        const data: ActivitiesResponse = await response.json();
        setActivities(data.activities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Aktivität löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActivities(activities.filter(a => a.id !== activityId));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'CALL': Phone,
      'EMAIL': Mail,
      'MEETING': Users,
      'TASK': Calendar,
      'NOTE': MessageSquare,
    };
    const Icon = icons[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'CALL': 'bg-blue-100 text-blue-800',
      'EMAIL': 'bg-green-100 text-green-800',
      'MEETING': 'bg-purple-100 text-purple-800',
      'TASK': 'bg-orange-100 text-orange-800',
      'NOTE': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors['NOTE'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors['PENDING'];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors['MEDIUM'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Aktivitäten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle CRM-Aktivitäten, Follow-ups und Aufgaben
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/activities/new">
            <Plus className="h-4 w-4 mr-2" />
            Neue Aktivität
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
              {activities.filter(a => a.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Noch zu erledigen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activities.filter(a => a.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktuell bearbeitet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Diese Woche erledigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activities.filter(a => 
                a.status !== 'COMPLETED' && 
                a.dueDate && 
                new Date(a.dueDate) < new Date()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Benötigen Aufmerksamkeit
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
                placeholder="Aktivitäten durchsuchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="CALL">Anrufe</SelectItem>
                <SelectItem value="EMAIL">E-Mails</SelectItem>
                <SelectItem value="MEETING">Meetings</SelectItem>
                <SelectItem value="TASK">Aufgaben</SelectItem>
                <SelectItem value="NOTE">Notizen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                <SelectItem value="CANCELLED">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aktivitäten ({pagination.total})
          </CardTitle>
          <CardDescription>
            Chronologische Übersicht aller CRM-Aktivitäten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Activity Icon */}
                    <div className={`p-2 rounded-full ${getTypeColor(activity.type)}`}>
                      {getTypeIcon(activity.type)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm">{activity.subject}</h3>
                            <Badge variant="secondary" className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                              {activity.priority}
                            </Badge>
                          </div>

                          {activity.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {activity.contact && (
                              <span>
                                Kontakt: {activity.contact.fullName}
                                {activity.contact.companyName && ` (${activity.contact.companyName})`}
                              </span>
                            )}
                            
                            {activity.opportunity && (
                              <span>
                                Opportunity: {activity.opportunity.name}
                              </span>
                            )}
                            
                            {activity.deal && (
                              <span>
                                Deal: {activity.deal.name} - {formatCurrency(activity.deal.amount, activity.deal.currency)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {activity.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Fällig: {formatDate(activity.dueDate)}
                              </span>
                            )}
                            
                            {activity.completedDate && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Badge className="h-3 w-3" />
                                Erledigt: {formatDate(activity.completedDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assignee & Actions */}
                        <div className="flex items-center gap-3">
                          {activity.assignee && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="" alt={activity.assignee.name} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(activity.assignee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {activity.assignee.name}
                              </span>
                            </div>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/activities/${activity.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/activities/${activity.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
