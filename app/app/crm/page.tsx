
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Mail,
  Calendar,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function CRMPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kundenbeziehungen und Sales-Pipeline effizient
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/crm/contacts/new">
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kontakt
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontakte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              +12% gegenüber letztem Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline-Wert: €--
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Geschlossene Deals diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--%</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              +5% gegenüber letztem Quartal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>
              Häufig verwendete CRM-Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/crm/contacts">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Kontakte verwalten</div>
                    <div className="text-sm text-muted-foreground">
                      Alle Kundenkontakte anzeigen und bearbeiten
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/crm/opportunities">
                  <Target className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Pipeline Management</div>
                    <div className="text-sm text-muted-foreground">
                      Sales-Opportunities und Pipeline verwalten
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/crm/deals">
                  <DollarSign className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Deal Management</div>
                    <div className="text-sm text-muted-foreground">
                      Abgeschlossene und aktive Deals überwachen
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/crm/activities">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Aktivitäten</div>
                    <div className="text-sm text-muted-foreground">
                      CRM-Aktivitäten und Follow-ups verwalten
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>
              Neueste CRM-Aktivitäten und Updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Suspense fallback={
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              }>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Neuer Kontakt</span> wurde erstellt
                      <div className="text-muted-foreground">vor 2 Stunden</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Deal geschlossen</span> - €15.000
                      <div className="text-muted-foreground">vor 4 Stunden</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Follow-up</span> geplant
                      <div className="text-muted-foreground">vor 6 Stunden</div>
                    </div>
                  </div>
                </div>
              </Suspense>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/crm/activities">
                  Alle Aktivitäten anzeigen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard Link */}
      <Card>
        <CardHeader>
          <CardTitle>Erweiterte Analytics</CardTitle>
          <CardDescription>
            Detaillierte CRM-Berichte und Analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/crm/dashboard">
              <TrendingUp className="h-4 w-4 mr-2" />
              CRM Dashboard öffnen
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
