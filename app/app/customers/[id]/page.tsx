
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Plus, MessageSquare, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Customer, ContactHistory } from '@/lib/types';

interface CustomerDetailPageProps {
  params: { id: string };
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactType, setContactType] = useState('NOTE');
  const [contactDescription, setContactDescription] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else if (response.status === 404) {
        toast({
          title: 'Kunde nicht gefunden',
          description: 'Der angeforderte Kunde existiert nicht.',
          variant: 'destructive',
        });
        router.push('/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingContact(true);

    try {
      const response = await fetch(`/api/customers/${params.id}/contact-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contactType,
          description: contactDescription,
        }),
      });

      if (response.ok) {
        const newContact = await response.json();
        setCustomer((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            contactHistories: [newContact, ...(prev.contactHistories || [])],
          };
        });
        setContactDescription('');
        toast({
          title: 'Kontakt hinzugefügt',
          description: 'Kontakthistorie wurde erfolgreich aktualisiert.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Kontakt konnte nicht hinzugefügt werden.',
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
      setIsAddingContact(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PROSPECT: 'bg-blue-100 text-blue-800',
      CHURNED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      ACTIVE: 'Aktiv',
      INACTIVE: 'Inaktiv',
      PROSPECT: 'Interessent',
      CHURNED: 'Gekündigt',
    };
    return labels[status] || status;
  };

  const getContactTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      CALL: Phone,
      EMAIL: Mail,
      MEETING: MessageSquare,
      NOTE: MessageSquare,
      TASK: Clock,
    };
    const Icon = icons[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getContactTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CALL: 'Anruf',
      EMAIL: 'E-Mail',
      MEETING: 'Meeting',
      NOTE: 'Notiz',
      TASK: 'Aufgabe',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Kundendaten...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Kunde nicht gefunden
          </h3>
          <p className="text-gray-600 mb-6">
            Der angeforderte Kunde existiert nicht oder wurde gelöscht.
          </p>
          <Button asChild>
            <Link href="/customers">Zurück zur Kundenliste</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.companyName}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {customer.contactPerson && (
                  <p className="text-gray-600">{customer.contactPerson}</p>
                )}
                <Badge className={getStatusColor(customer.status)}>
                  {getStatusLabel(customer.status)}
                </Badge>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Kundendaten</CardTitle>
                <CardDescription>
                  Vollständige Informationen und Kontaktdaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {(customer.address || customer.city || customer.country) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      {customer.address && <div>{customer.address}</div>}
                      <div>
                        {customer.postalCode && `${customer.postalCode} `}
                        {customer.city}
                        {customer.country && `, ${customer.country}`}
                      </div>
                    </div>
                  </div>
                )}
                {customer.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Notizen</h4>
                    <p className="text-sm text-gray-600">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Add Contact History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Neuen Kontakt hinzufügen</CardTitle>
                <CardDescription>
                  Dokumentieren Sie Ihre Kommunikation mit diesem Kunden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Select value={contactType} onValueChange={setContactType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALL">Anruf</SelectItem>
                        <SelectItem value="EMAIL">E-Mail</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="NOTE">Notiz</SelectItem>
                        <SelectItem value="TASK">Aufgabe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Beschreibung des Kontakts..."
                      value={contactDescription}
                      onChange={(e) => setContactDescription(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isAddingContact || !contactDescription.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isAddingContact ? 'Hinzufügen...' : 'Kontakt hinzufügen'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Kontakthistorie</CardTitle>
                <CardDescription>
                  Chronologische Übersicht aller Interaktionen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.contactHistories && customer.contactHistories.length > 0 ? (
                  <div className="space-y-4">
                    {customer.contactHistories.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getContactTypeIcon(contact.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {getContactTypeLabel(contact.type)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(contact.createdAt).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{contact.description}</p>
                          {contact.user && (
                            <p className="text-xs text-gray-500">
                              {contact.user.name || contact.user.email}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Keine Kontakthistorie
                    </h3>
                    <p className="text-gray-600">
                      Fügen Sie den ersten Kontakt hinzu, um die Historie zu starten.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
