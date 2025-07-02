
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Building2, 
  Shield, 
  Save, 
  Plus, 
  Trash2,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react';
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
}

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userTenants: UserTenant[];
}

interface UserEditDialogProps {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserData) => void;
  availableTenants: Array<{ id: string; name: string; slug: string; }>;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-500' },
  { value: 'GLOBAL_ADMIN', label: 'Global Admin', color: 'bg-red-600' },
  { value: 'TENANT_ADMIN', label: 'Tenant Admin', color: 'bg-orange-500' },
  { value: 'CEO', label: 'CEO', color: 'bg-purple-500' },
  { value: 'CFO', label: 'CFO', color: 'bg-purple-600' },
  { value: 'CTO', label: 'CTO', color: 'bg-purple-700' },
  { value: 'COO', label: 'COO', color: 'bg-purple-400' },
  { value: 'DEPARTMENT_HEAD', label: 'Abteilungsleiter', color: 'bg-blue-500' },
  { value: 'TEAM_LEAD', label: 'Teamleiter', color: 'bg-blue-600' },
  { value: 'PROJECT_MANAGER', label: 'Projektmanager', color: 'bg-blue-700' },
  { value: 'HR_MANAGER', label: 'HR Manager', color: 'bg-blue-400' },
  { value: 'SENIOR_EMPLOYEE', label: 'Senior Mitarbeiter', color: 'bg-green-500' },
  { value: 'EMPLOYEE', label: 'Mitarbeiter', color: 'bg-green-600' },
  { value: 'JUNIOR_EMPLOYEE', label: 'Junior Mitarbeiter', color: 'bg-green-700' },
  { value: 'INTERN', label: 'Praktikant', color: 'bg-green-400' },
  { value: 'CUSTOMER_ADMIN', label: 'Kunde Admin', color: 'bg-teal-500' },
  { value: 'CUSTOMER_USER', label: 'Kunde', color: 'bg-teal-600' },
  { value: 'SUPPLIER_ADMIN', label: 'Lieferant Admin', color: 'bg-amber-500' },
  { value: 'SUPPLIER_USER', label: 'Lieferant', color: 'bg-amber-600' },
];

export function UserEditDialog({ user, isOpen, onClose, onUserUpdated, availableTenants }: UserEditDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    isActive: user.isActive
  });
  
  const [userTenants, setUserTenants] = useState<UserTenant[]>(user.userTenants || []);
  const [newTenantAssignment, setNewTenantAssignment] = useState({
    tenantId: '',
    role: 'EMPLOYEE',
    isPrimary: false
  });

  const updateUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onUserUpdated(data.user);
        toast({
          title: 'Benutzer aktualisiert',
          description: 'Die Benutzerdaten wurden erfolgreich gespeichert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Benutzer konnte nicht aktualisiert werden.',
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
      setIsLoading(false);
    }
  };

  const updateUserRole = async (tenantId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId, role: newRole }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserTenants(prev => prev.map(ut => 
          ut.tenantId === tenantId ? { ...ut, role: newRole } : ut
        ));
        toast({
          title: 'Rolle aktualisiert',
          description: 'Die Benutzerrolle wurde erfolgreich geändert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Rolle konnte nicht aktualisiert werden.',
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

  const addTenantAssignment = async () => {
    if (!newTenantAssignment.tenantId) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Mandanten aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTenantAssignment),
      });

      if (response.ok) {
        const data = await response.json();
        setUserTenants(prev => [...prev, data.userTenant]);
        setNewTenantAssignment({ tenantId: '', role: 'EMPLOYEE', isPrimary: false });
        toast({
          title: 'Mandant zugeordnet',
          description: 'Der Benutzer wurde erfolgreich dem Mandanten zugeordnet.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Mandant konnte nicht zugeordnet werden.',
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

  const removeTenantAssignment = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/tenants?tenantId=${tenantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserTenants(prev => prev.filter(ut => ut.tenantId !== tenantId));
        toast({
          title: 'Mandant entfernt',
          description: 'Der Benutzer wurde erfolgreich vom Mandanten entfernt.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Mandant konnte nicht entfernt werden.',
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

  const getRoleOption = (role: string) => {
    return ROLE_OPTIONS.find(option => option.value === role) || {
      value: role,
      label: role,
      color: 'bg-gray-500'
    };
  };

  const getAvailableTenants = () => {
    const assignedTenantIds = userTenants.map(ut => ut.tenantId);
    return availableTenants.filter(tenant => !assignedTenantIds.includes(tenant.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Benutzer bearbeiten: {user.name}</span>
          </DialogTitle>
          <DialogDescription>
            Verwalten Sie Benutzerdetails, Rollen und Mandanten-Zuordnungen.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Mandanten</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Berechtigungen</span>
            </TabsTrigger>
          </TabsList>

          {/* User Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basis-Informationen</CardTitle>
                <CardDescription>
                  Grundlegende Benutzerdaten bearbeiten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Name</Label>
                    <Input
                      id="user-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Vollständiger Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">E-Mail</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="E-Mail-Adresse"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="user-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="user-active">Benutzer ist aktiv</Label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={updateUserDetails} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Speichern...' : 'Änderungen speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mandanten-Zuordnungen</CardTitle>
                <CardDescription>
                  Verwalten Sie, zu welchen Mandanten der Benutzer gehört und welche Rollen er hat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Assignments */}
                <div className="space-y-3">
                  {userTenants.map((userTenant) => {
                    const roleOption = getRoleOption(userTenant.role);
                    return (
                      <div key={userTenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{userTenant.tenant.name}</div>
                            <div className="text-sm text-gray-500">/{userTenant.tenant.slug}</div>
                          </div>
                          <Badge className={`${roleOption.color} text-white`}>
                            <Crown className="h-3 w-3 mr-1" />
                            {roleOption.label}
                          </Badge>
                          {userTenant.isPrimary && (
                            <Badge variant="secondary">Primary</Badge>
                          )}
                          {userTenant.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <UserX className="h-3 w-3 mr-1" />
                              Inaktiv
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select
                            value={userTenant.role}
                            onValueChange={(value) => updateUserRole(userTenant.tenantId, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTenantAssignment(userTenant.tenantId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Assignment */}
                {getAvailableTenants().length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Neuen Mandanten zuordnen</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Select
                        value={newTenantAssignment.tenantId}
                        onValueChange={(value) => setNewTenantAssignment(prev => ({ ...prev, tenantId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mandant wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTenants().map(tenant => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={newTenantAssignment.role}
                        onValueChange={(value) => setNewTenantAssignment(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button onClick={addTenantAssignment}>
                        <Plus className="h-4 w-4 mr-2" />
                        Hinzufügen
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spezielle Berechtigungen</CardTitle>
                <CardDescription>
                  Zusätzliche Berechtigungen, die diesem Benutzer direkt gewährt wurden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Berechtigungsverwaltung</p>
                  <p className="text-sm">Wird in einer zukünftigen Version implementiert</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
