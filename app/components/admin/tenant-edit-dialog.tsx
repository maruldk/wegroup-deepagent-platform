
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Save, 
  Users, 
  TrendingUp,
  Mail,
  Globe,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenantData {
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

interface TenantEditDialogProps {
  tenant: TenantData;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdated: (updatedTenant: TenantData) => void;
}

export function TenantEditDialog({ tenant, isOpen, onClose, onTenantUpdated }: TenantEditDialogProps) {
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name || '',
    slug: tenant.slug || '',
    description: tenant.description || '',
    businessType: tenant.businessType || '',
    logo: tenant.logo || '',
    primaryColor: tenant.primaryColor || '',
    website: tenant.website || '',
    isActive: tenant.isActive
  });

  const updateTenant = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onTenantUpdated(data.tenant);
        onClose();
        toast({
          title: 'Mandant aktualisiert',
          description: 'Die Mandantendaten wurden erfolgreich gespeichert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Mandant konnte nicht aktualisiert werden.',
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(tenant.name) ? generateSlug(name) : prev.slug
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Mandant bearbeiten: {tenant.name}</span>
          </DialogTitle>
          <DialogDescription>
            Verwalten Sie Mandantendetails, Einstellungen und Branding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basis-Informationen</CardTitle>
              <CardDescription>
                Grundlegende Mandantendaten bearbeiten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Name *</Label>
                  <Input
                    id="tenant-name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Firmen- oder Organisationsname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-slug">Slug *</Label>
                  <Input
                    id="tenant-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="eindeutige-url-kennung"
                  />
                  <p className="text-xs text-gray-500">
                    Eindeutige URL-Kennung (nur Kleinbuchstaben, Zahlen und Bindestriche)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-description">Beschreibung</Label>
                <Textarea
                  id="tenant-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreibung des Mandanten"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-business-type">Geschäftstyp</Label>
                  <Input
                    id="tenant-business-type"
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    placeholder="z.B. Manufacturing, Services, Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="tenant-website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="tenant-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="tenant-active">Mandant ist aktiv</Label>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Branding</span>
              </CardTitle>
              <CardDescription>
                Logo und Farben für das Corporate Design
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-logo">Logo URL</Label>
                <Input
                  id="tenant-logo"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://i.pinimg.com/originals/06/5d/d8/065dd81475b715ee33d1ce55d5b216ed.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-primary-color">Primärfarbe</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tenant-primary-color"
                    type="color"
                    value={formData.primaryColor || '#0066cc'}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#0066cc"
                    className="flex-1"
                  />
                </div>
              </div>

              {formData.logo && (
                <div className="space-y-2">
                  <Label>Logo-Vorschau</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={formData.logo}
                      alt="Logo Preview"
                      className="max-h-16 max-w-32 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
            <Button onClick={updateTenant} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Speichern...' : 'Änderungen speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
