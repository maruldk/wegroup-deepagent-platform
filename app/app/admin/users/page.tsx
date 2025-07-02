
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  UserX, 
  Shield, 
  Building2,
  Crown,
  Briefcase,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { TenantSwitcher } from '@/components/layout/tenant-switcher';
import { UserEditDialog } from '@/components/admin/user-edit-dialog';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';
import { useToast } from '@/hooks/use-toast';

interface UserTenant {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  joinedAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    isActive: boolean;
    createdAt: string;
  };
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  totalTenants: number;
  recentJoins: number;
}

// Role badge colors and icons
const ROLE_CONFIG = {
  SUPER_ADMIN: { color: 'bg-red-500', icon: Shield, label: 'Super Admin' },
  GLOBAL_ADMIN: { color: 'bg-red-600', icon: Shield, label: 'Global Admin' },
  TENANT_ADMIN: { color: 'bg-orange-500', icon: Shield, label: 'Tenant Admin' },
  CEO: { color: 'bg-purple-500', icon: Crown, label: 'CEO' },
  CFO: { color: 'bg-purple-600', icon: Crown, label: 'CFO' },
  CTO: { color: 'bg-purple-700', icon: Crown, label: 'CTO' },
  COO: { color: 'bg-purple-400', icon: Crown, label: 'COO' },
  DEPARTMENT_HEAD: { color: 'bg-blue-500', icon: Briefcase, label: 'Abteilungsleiter' },
  TEAM_LEAD: { color: 'bg-blue-600', icon: Briefcase, label: 'Teamleiter' },
  PROJECT_MANAGER: { color: 'bg-blue-700', icon: Briefcase, label: 'Projektmanager' },
  HR_MANAGER: { color: 'bg-blue-400', icon: Briefcase, label: 'HR Manager' },
  SENIOR_EMPLOYEE: { color: 'bg-green-500', icon: Users, label: 'Senior Mitarbeiter' },
  EMPLOYEE: { color: 'bg-green-600', icon: Users, label: 'Mitarbeiter' },
  JUNIOR_EMPLOYEE: { color: 'bg-green-700', icon: Users, label: 'Junior Mitarbeiter' },
  INTERN: { color: 'bg-green-400', icon: Users, label: 'Praktikant' },
  CUSTOMER_ADMIN: { color: 'bg-teal-500', icon: Star, label: 'Kunde Admin' },
  CUSTOMER_USER: { color: 'bg-teal-600', icon: Star, label: 'Kunde' },
  SUPPLIER_ADMIN: { color: 'bg-amber-500', icon: Building2, label: 'Lieferant Admin' },
  SUPPLIER_USER: { color: 'bg-amber-600', icon: Building2, label: 'Lieferant' },
};

export default function UsersAdminPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserTenant[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserTenant[]>([]);
  const [availableTenants, setAvailableTenants] = useState<Array<{ id: string; name: string; slug: string; }>>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalTenants: 0,
    recentJoins: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserTenant | null>(null);

  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, tenantFilter, statusFilter]);

  const fetchUsersAndStats = async () => {
    try {
      const [usersResponse, statsResponse, tenantsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/tenants')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }

      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json();
        setAvailableTenants(tenantsData.tenants || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Fehler',
        description: 'Admin-Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (userTenant: UserTenant) => {
    try {
      const response = await fetch(`/api/admin/users/${userTenant.userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData.user);
        setIsEditDialogOpen(true);
      } else {
        toast({
          title: 'Fehler',
          description: 'Benutzerdaten konnten nicht geladen werden.',
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsersAndStats(); // Refresh data
        toast({
          title: 'Benutzer gelöscht',
          description: 'Der Benutzer wurde erfolgreich deaktiviert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Benutzer konnte nicht gelöscht werden.',
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
      setUserToDelete(null);
    }
  };

  const handleUserCreated = () => {
    fetchUsersAndStats(); // Refresh data
  };

  const handleUserUpdated = () => {
    fetchUsersAndStats(); // Refresh data
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(userTenant =>
        userTenant.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userTenant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userTenant.tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(userTenant => userTenant.role === roleFilter);
    }

    // Tenant filter
    if (tenantFilter !== 'all') {
      filtered = filtered.filter(userTenant => userTenant.tenantId === tenantFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(userTenant => userTenant.isActive === isActive);
    }

    setFilteredUsers(filtered);
  };

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || {
      color: 'bg-gray-500',
      icon: Users,
      label: role
    };
  };

  const getUniqueRoles = () => {
    const roles = Array.from(new Set(users.map(ut => ut.role)));
    return roles.sort();
  };

  const getUniqueTenants = () => {
    const tenants = Array.from(new Set(users.map(ut => ({
      id: ut.tenantId,
      name: ut.tenant.name
    }))));
    return tenants.sort((a, b) => a.name.localeCompare(b.name));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Benutzerverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie Benutzer und deren Zugriffsrechte im Multi-Tenant-System</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="w-80">
            <TenantSwitcher />
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer hinzufügen
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Gesamt Benutzer</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Aktive Benutzer</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Administratoren</p>
                <p className="text-2xl font-bold text-purple-600">{stats.adminUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mandanten</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalTenants}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Neue (30T)</p>
                <p className="text-2xl font-bold text-teal-600">{stats.recentJoins}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter & Suche</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name, Email oder Mandant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role-filter">Rolle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Rollen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  {getUniqueRoles().map(role => {
                    const config = getRoleConfig(role);
                    return (
                      <SelectItem key={role} value={role}>
                        {config.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tenant-filter">Mandant</Label>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Mandanten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mandanten</SelectItem>
                  {getUniqueTenants().map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Benutzer ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Übersicht aller Benutzer mit deren Rollen und Mandanten-Zuordnungen
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Mandant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Beigetreten</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userTenant) => {
                  const roleConfig = getRoleConfig(userTenant.role);
                  const RoleIcon = roleConfig.icon;
                  
                  return (
                    <TableRow key={userTenant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={userTenant.user.image} alt={userTenant.user.name} />
                            <AvatarFallback>
                              {userTenant.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userTenant.user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{userTenant.user.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${roleConfig.color} text-white`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleConfig.label}
                        </Badge>
                        {userTenant.isPrimary && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Primary
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{userTenant.tenant.name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {userTenant.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inaktiv
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-600 flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(userTenant.joinedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
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
                            <DropdownMenuItem onClick={() => handleEditUser(userTenant)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(userTenant)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Rollen ändern
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setUserToDelete(userTenant);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onUserCreated={handleUserCreated}
        availableTenants={availableTenants}
      />

      {selectedUser && (
        <UserEditDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
          availableTenants={availableTenants}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Benutzer löschen</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Benutzer <strong>{userToDelete?.user.name}</strong> löschen möchten? 
              Diese Aktion wird den Benutzer deaktivieren und kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
