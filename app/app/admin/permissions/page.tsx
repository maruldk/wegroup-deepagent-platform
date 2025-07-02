
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Building2,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  Settings,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  resource?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RolePermission {
  id: string;
  role: string;
  permissionId: string;
  isDefault: boolean;
  permission: Permission;
}

interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  isGranted: boolean;
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  permission: Permission;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const MODULES = [
  'ADMIN', 'ANALYTICS', 'FINANCE', 'PROJECTS', 'CUSTOMERS', 
  'LEADS', 'SYSTEM', 'SECURITY', 'API', 'REPORTING'
];

const ACTIONS = [
  'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT',
  'MANAGE', 'VIEW', 'EDIT', 'APPROVE', 'REJECT'
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  GLOBAL_ADMIN: 'Global Admin',
  TENANT_ADMIN: 'Tenant Admin',
  CEO: 'CEO',
  CFO: 'CFO',
  CTO: 'CTO',
  COO: 'COO',
  DEPARTMENT_HEAD: 'Abteilungsleiter',
  TEAM_LEAD: 'Teamleiter',
  PROJECT_MANAGER: 'Projektmanager',
  HR_MANAGER: 'HR Manager',
  SENIOR_EMPLOYEE: 'Senior Mitarbeiter',
  EMPLOYEE: 'Mitarbeiter',
  JUNIOR_EMPLOYEE: 'Junior Mitarbeiter',
  INTERN: 'Praktikant',
  CUSTOMER_ADMIN: 'Kunde Admin',
  CUSTOMER_USER: 'Kunde',
  SUPPLIER_ADMIN: 'Lieferant Admin',
  SUPPLIER_USER: 'Lieferant'
};

export default function PermissionsAdminPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'users'>('permissions');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    module: '',
    action: '',
    resource: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permissionsResponse, rolePermissionsResponse, userPermissionsResponse] = await Promise.all([
        fetch('/api/admin/permissions'),
        fetch('/api/admin/permissions/roles'),
        fetch('/api/admin/permissions/users')
      ]);

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions || []);
      }

      if (rolePermissionsResponse.ok) {
        const rolePermissionsData = await rolePermissionsResponse.json();
        setRolePermissions(rolePermissionsData.rolePermissions || []);
      }

      if (userPermissionsResponse.ok) {
        const userPermissionsData = await userPermissionsResponse.json();
        setUserPermissions(userPermissionsData.userPermissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions data:', error);
      toast({
        title: 'Fehler',
        description: 'Berechtigungsdaten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      });

      if (response.ok) {
        const permission = await response.json();
        setPermissions(prev => [permission.permission, ...prev]);
        setNewPermission({ name: '', description: '', module: '', action: '', resource: '' });
        setIsCreateDialogOpen(false);
        toast({
          title: 'Berechtigung erstellt',
          description: `${permission.permission.name} wurde erfolgreich angelegt.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Berechtigung konnte nicht erstellt werden.',
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

  const toggleRolePermission = async (role: string, permissionId: string, isCurrentlyAssigned: boolean) => {
    try {
      const method = isCurrentlyAssigned ? 'DELETE' : 'POST';
      const response = await fetch('/api/admin/permissions/roles', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, permissionId }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        toast({
          title: isCurrentlyAssigned ? 'Berechtigung entfernt' : 'Berechtigung zugewiesen',
          description: `Rolle wurde erfolgreich ${isCurrentlyAssigned ? 'entfernt' : 'zugewiesen'}.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Rollenberechtigung konnte nicht geändert werden.',
        variant: 'destructive'
      });
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.module.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = moduleFilter === 'all' || permission.module === moduleFilter;
    
    return matchesSearch && matchesModule;
  });

  const getUniqueModules = () => {
    return Array.from(new Set(permissions.map(p => p.module))).sort();
  };

  const getRolePermissionMatrix = () => {
    const roles = Object.keys(ROLE_LABELS);
    const matrix: Record<string, Record<string, boolean>> = {};
    
    roles.forEach(role => {
      matrix[role] = {};
      filteredPermissions.forEach(permission => {
        matrix[role][permission.id] = rolePermissions.some(rp => 
          rp.role === role && rp.permissionId === permission.id
        );
      });
    });
    
    return { roles, matrix };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Lade Berechtigungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Berechtigungsverwaltung</h1>
          <p className="text-gray-600">Systemberechtigungen, Rollen und Benutzerzuweisungen verwalten</p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Neue Berechtigung
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Berechtigung erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Systemberechtigung für Rollen und Benutzer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createPermission} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="permission-name">Name *</Label>
                  <Input
                    id="permission-name"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. FINANCE_VIEW_REPORTS"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-description">Beschreibung</Label>
                  <Input
                    id="permission-description"
                    value={newPermission.description}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreibung der Berechtigung"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permission-module">Modul *</Label>
                    <Select 
                      value={newPermission.module} 
                      onValueChange={(value) => setNewPermission(prev => ({ ...prev, module: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Modul wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULES.map(module => (
                          <SelectItem key={module} value={module}>{module}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permission-action">Aktion *</Label>
                    <Select 
                      value={newPermission.action} 
                      onValueChange={(value) => setNewPermission(prev => ({ ...prev, action: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Aktion wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-resource">Ressource (optional)</Label>
                  <Input
                    id="permission-resource"
                    value={newPermission.resource}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, resource: e.target.value }))}
                    placeholder="z.B. REPORTS, INVOICES"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    Berechtigung erstellen
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Berechtigungen ({permissions.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Crown className="h-4 w-4 inline mr-2" />
              Rollen-Matrix
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Benutzer-Berechtigungen ({userPermissions.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name, Beschreibung oder Modul..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="module-filter">Modul</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Module</SelectItem>
                  {getUniqueModules().map(module => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'permissions' && (
        <Card>
          <CardHeader>
            <CardTitle>System-Berechtigungen</CardTitle>
            <CardDescription>
              Alle verfügbaren Berechtigungen im System verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{permission.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {permission.resource ? (
                          <Badge variant="outline">{permission.resource}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {permission.isSystem ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="h-3 w-3 mr-1" />
                            Custom
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            {!permission.isSystem && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <CardTitle>Rollen-Berechtigungs-Matrix</CardTitle>
            <CardDescription>
              Verwalten Sie, welche Berechtigungen standardmäßig für jede Rolle gewährt werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {(() => {
                  const { roles, matrix } = getRolePermissionMatrix();
                  return (
                    <div className="space-y-4">
                      {/* Role Headers */}
                      <div className="grid gap-2" style={{ gridTemplateColumns: `300px repeat(${roles.length}, 120px)` }}>
                        <div className="font-medium text-sm text-gray-600 p-2">Berechtigung</div>
                        {roles.map(role => (
                          <div key={role} className="text-center">
                            <div className="text-xs font-medium text-gray-600 transform -rotate-45 origin-center">
                              {ROLE_LABELS[role] || role}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Permission Matrix */}
                      {filteredPermissions.slice(0, 10).map(permission => (
                        <div key={permission.id} className="grid gap-2 items-center border-b pb-2" style={{ gridTemplateColumns: `300px repeat(${roles.length}, 120px)` }}>
                          <div className="text-sm">
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.module}.{permission.action}</div>
                          </div>
                          {roles.map(role => (
                            <div key={`${role}-${permission.id}`} className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleRolePermission(role, permission.id, matrix[role][permission.id])}
                              >
                                {matrix[role][permission.id] ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-300" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Benutzer-spezifische Berechtigungen</CardTitle>
            <CardDescription>
              Zusätzliche Berechtigungen, die einzelnen Benutzern direkt gewährt wurden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Berechtigung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gewährt von</TableHead>
                    <TableHead>Läuft ab</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPermissions.map((userPermission) => (
                    <TableRow key={userPermission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userPermission.user.name}</div>
                          <div className="text-sm text-gray-500">{userPermission.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userPermission.permission.name}</div>
                          <div className="text-sm text-gray-500">
                            {userPermission.permission.module}.{userPermission.permission.action}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {userPermission.isGranted ? (
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Gewährt
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="h-3 w-3 mr-1" />
                            Entzogen
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {userPermission.grantedBy ? (
                          <span className="text-sm text-gray-600">Admin</span>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {userPermission.expiresAt ? (
                          <span className="text-sm text-gray-600">
                            {new Date(userPermission.expiresAt).toLocaleDateString('de-DE')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Niemals</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Entziehen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
