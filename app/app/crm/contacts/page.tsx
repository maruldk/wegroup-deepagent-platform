
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

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  companyName?: string;
  source: string;
  tags?: string[];
  createdAt: string;
  owner?: {
    name: string;
    email: string;
  };
  customer?: {
    companyName: string;
    status: string;
  };
  _count: {
    opportunities: number;
    activities: number;
    deals: number;
  };
}

interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    fetchContacts();
  }, [search, source, page]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        source,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/crm/contacts?${params}`);
      if (response.ok) {
        const data: ContactsResponse = await response.json();
        setContacts(data.contacts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'WEBSITE': 'bg-blue-100 text-blue-800',
      'SOCIAL_MEDIA': 'bg-purple-100 text-purple-800',
      'EMAIL': 'bg-green-100 text-green-800',
      'PHONE': 'bg-orange-100 text-orange-800',
      'REFERRAL': 'bg-pink-100 text-pink-800',
      'EVENT': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[source] || colors['OTHER'];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontakte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Ihre Kundenkontakte
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/contacts/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kontakt
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Kontakte durchsuchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                <SelectItem value="EMAIL">E-Mail</SelectItem>
                <SelectItem value="PHONE">Telefon</SelectItem>
                <SelectItem value="REFERRAL">Empfehlung</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="OTHER">Andere</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kontakte ({pagination.total})
          </CardTitle>
          <CardDescription>
            Alle Ihre Kundenkontakte im Überblick
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
                      <TableHead>Unternehmen</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Quelle</TableHead>
                      <TableHead>Aktivität</TableHead>
                      <TableHead>Eigentümer</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={contact.fullName} />
                              <AvatarFallback className="text-xs">
                                {getInitials(contact.firstName, contact.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{contact.fullName}</div>
                              {contact.title && (
                                <div className="text-sm text-muted-foreground">{contact.title}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.companyName && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.companyName}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {contact.email}
                              </div>
                            )}
                            {(contact.phone || contact.mobile) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {contact.phone || contact.mobile}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getSourceColor(contact.source)}>
                            {contact.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{contact._count.opportunities} Opportunities</div>
                            <div className="text-muted-foreground">
                              {contact._count.activities} Aktivitäten
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.owner && (
                            <div className="text-sm">
                              <div className="font-medium">{contact.owner.name}</div>
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
                                onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/crm/contacts/${contact.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteContact(contact.id)}
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
