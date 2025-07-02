
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: any) => void;
  availableTenants: Array<{ id: string; name: string; slug: string; }>;
}

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Mitarbeiter' },
  { value: 'SENIOR_EMPLOYEE', label: 'Senior Mitarbeiter' },
  { value: 'TEAM_LEAD', label: 'Teamleiter' },
  { value: 'PROJECT_MANAGER', label: 'Projektmanager' },
  { value: 'DEPARTMENT_HEAD', label: 'Abteilungsleiter' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'TENANT_ADMIN', label: 'Tenant Admin' },
  { value: 'CEO', label: 'CEO' },
  { value: 'CFO', label: 'CFO' },
  { value: 'CTO', label: 'CTO' },
  { value: 'COO', label: 'COO' },
];

export function CreateUserDialog({ isOpen, onClose, onUserCreated, availableTenants }: CreateUserDialogProps) {
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantId: '',
    role: 'EMPLOYEE',
    isActive: true,
    isPrimary: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.tenantId) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onUserCreated(data);
        setFormData({
          name: '',
          email: '',
          password: '',
          tenantId: '',
          role: 'EMPLOYEE',
          isActive: true,
          isPrimary: false
        });
        onClose();
        toast({
          title: 'Benutzer erstellt',
          description: `${data.user.name} wurde erfolgreich angelegt.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Benutzer konnte nicht erstellt werden.',
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

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast({
      title: 'Passwort generiert',
      description: 'Ein sicheres Passwort wurde erstellt.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Neuen Benutzer erstellen</span>
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Benutzer und ordnen Sie ihn einem Mandanten zu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name *</Label>
                <Input
                  id="user-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vollständiger Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">E-Mail *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="E-Mail-Adresse"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">Passwort *</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Sicheres Passwort"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generieren
                </Button>
              </div>
            </div>
          </div>

          {/* Tenant and Role Assignment */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-tenant">Mandant *</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tenantId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mandant wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Rolle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
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
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="user-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="user-active">Benutzer ist aktiv</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="user-primary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrimary: checked }))}
              />
              <Label htmlFor="user-primary">Als primärer Mandant setzen</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Erstellen...' : 'Benutzer erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
