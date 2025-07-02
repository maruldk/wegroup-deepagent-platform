
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Plus, Users, TrendingUp, Filter, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TenantEditDialog } from '@/components/admin/tenant-edit-dialog';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  businessType?: string | null;
  logo?: string | null;
  primaryColor?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    customers: number;
    leads: number;
  };
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    description: '',
  });
  
  // Edit/Delete states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, [search]);

  const fetchTenants = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/tenants?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTenant),
      });

      if (response.ok) {
        const tenant = await response.json();
        setTenants((prev) => [tenant, ...prev]);
        setNewTenant({ name: '', slug: '', description: '' });
        setIsDialogOpen(false);
        toast({
          title: 'Mandant erstellt',
          description: `${tenant.name} wurde erfolgreich angelegt.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Mandant konnte nicht erstellt werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewTenant((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleEditTenant = async (tenant: Tenant) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`);
      if (response.ok) {
        const tenantData = await response.json();
        setSelectedTenant(tenantData.tenant);
        setIsEditDialogOpen(true);
      } else {
        toast({
          title: 'Fehler',
          description: 'Mandantendaten konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      const response = await fetch(`/api/admin/tenants/${tenantToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTenants(prev => prev.filter(t => t.id !== tenantToDelete.id));
        toast({
          title: 'Mandant gelöscht',
          description: 'Der Mandant wurde erfolgreich deaktiviert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Mandant konnte nicht gelöscht werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    }
  };

  const handleTenantUpdated = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => 
      t.id === updatedTenant.id ? updatedTenant : t
    ));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Mandanten...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Mandantenverwaltung</h1>
            <p className="text-gray-600 mt-2">
              Multi-Tenant-Struktur und Organisationen verwalten
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neuen Mandanten erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Mandanten erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Mandanten für die Multi-Tenant-Struktur.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createTenant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Firma oder Organisationsname"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="eindeutige-url-kennung"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Eindeutige URL-Kennung (nur Kleinbuchstaben, Zahlen und Bindestriche)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Input
                    id="description"
                    value={newTenant.description}
                    onChange={(e) => setNewTenant((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optionale Beschreibung"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Erstellen...' : 'Mandanten erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nach Name oder Slug suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tenants Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                      <CardDescription>/{tenant.slug}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                        {tenant.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setTenantToDelete(tenant);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenant.description && (
                      <p className="text-sm text-gray-600">{tenant.description}</p>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold">{tenant._count.users}</p>
                        <p className="text-xs text-gray-500">Benutzer</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold">{tenant._count.customers}</p>
                        <p className="text-xs text-gray-500">Kunden</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold">{tenant._count.leads}</p>
                        <p className="text-xs text-gray-500">Leads</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Erstellt: {new Date(tenant.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {tenants.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Building2 className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Mandanten gefunden
            </h3>
            <p className="text-gray-600 mb-6">
              {search
                ? 'Keine Mandanten entsprechen den aktuellen Suchkriterien.'
                : 'Erstellen Sie Ihren ersten Mandanten für die Multi-Tenant-Struktur.'}
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Mandanten erstellen
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedTenant && (
        <TenantEditDialog
          tenant={selectedTenant}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedTenant(null);
          }}
          onTenantUpdated={handleTenantUpdated}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Mandant löschen</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Mandanten <strong>{tenantToDelete?.name}</strong> löschen möchten? 
              Diese Aktion wird den Mandanten deaktivieren und kann nicht rückgängig gemacht werden.
              <br /><br />
              <strong>Warnung:</strong> Alle Benutzer dieses Mandanten werden ebenfalls deaktiviert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTenantToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
