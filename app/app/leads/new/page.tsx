
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name?: string | null;
  email: string;
}

export default function NewLeadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'NEW',
    source: '',
    notes: '',
    estimatedValue: '',
    assignedUserId: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        assignedUserId: formData.assignedUserId || null,
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const lead = await response.json();
        toast({
          title: 'Lead erfolgreich erstellt',
          description: `${lead.companyName} wurde als neuer Lead angelegt.`,
        });
        router.push(`/leads/${lead.id}`);
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler beim Erstellen',
          description: error.error || 'Ein Fehler ist aufgetreten.',
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
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Neuen Lead erstellen</h1>
            <p className="text-gray-600 mt-2">
              Neue Verkaufschance in der Pipeline anlegen
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Grundinformationen</CardTitle>
                <CardDescription>
                  Basis-Leadinformationen und Kontaktdaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Ansprechpartner</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Lead-Quelle</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="z.B. Website, Kaltakquise, Empfehlung"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sales Information */}
            <Card>
              <CardHeader>
                <CardTitle>Verkaufsinformationen</CardTitle>
                <CardDescription>
                  Status, Zuordnung und Potenzial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">Neu</SelectItem>
                      <SelectItem value="CONTACTED">Kontaktiert</SelectItem>
                      <SelectItem value="QUALIFIED">Qualifiziert</SelectItem>
                      <SelectItem value="PROPOSAL">Angebot</SelectItem>
                      <SelectItem value="NEGOTIATION">Verhandlung</SelectItem>
                      <SelectItem value="WON">Gewonnen</SelectItem>
                      <SelectItem value="LOST">Verloren</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedUserId">Zugewiesener Benutzer</Label>
                  <Select value={formData.assignedUserId} onValueChange={(value) => handleInputChange('assignedUserId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Benutzer auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Nicht zugewiesen</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Geschätzter Wert (EUR)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedValue}
                    onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Zusätzliche Informationen zum Lead..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" type="button" asChild>
              <Link href="/leads">Abbrechen</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Erstellen...' : 'Lead erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
