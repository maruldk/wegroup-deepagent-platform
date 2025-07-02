
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Award, 
  Calendar, 
  UserPlus,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function HRPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Personalressourcen und HR-Prozesse zentral
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/hr/employees/new">
              <Plus className="h-4 w-4 mr-2" />
              Neuer Mitarbeiter
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Aktive Mitarbeiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abteilungen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Organisationseinheiten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urlaubsanträge</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Ausstehende Genehmigungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Reviews</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="...">
                <span>--</span>
              </Suspense>
            </div>
            <p className="text-xs text-muted-foreground">
              Fällige Bewertungen
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
              Häufig verwendete HR-Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/hr/employees">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Mitarbeiter verwalten</div>
                    <div className="text-sm text-muted-foreground">
                      Mitarbeiterdaten und Profile verwalten
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/hr/departments">
                  <Building2 className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Abteilungen</div>
                    <div className="text-sm text-muted-foreground">
                      Organisationsstruktur und Hierarchien
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/hr/leave">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Urlaubsmanagement</div>
                    <div className="text-sm text-muted-foreground">
                      Urlaubsanträge und Genehmigungen
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link href="/hr/performance">
                  <Award className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Performance Management</div>
                    <div className="text-sm text-muted-foreground">
                      Leistungsbeurteilungen und Reviews
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
            <CardTitle>Letzte HR-Aktivitäten</CardTitle>
            <CardDescription>
              Neueste Änderungen und Updates
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
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Neuer Mitarbeiter</span> wurde eingestellt
                      <div className="text-muted-foreground">vor 2 Stunden</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Urlaubsantrag</span> genehmigt
                      <div className="text-muted-foreground">vor 4 Stunden</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Performance Review</span> abgeschlossen
                      <div className="text-muted-foreground">vor 1 Tag</div>
                    </div>
                  </div>
                </div>
              </Suspense>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/hr/dashboard">
                  Alle Aktivitäten anzeigen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Onboarding
            </CardTitle>
            <CardDescription>
              Neue Mitarbeiter einführen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/hr/onboarding">
                Onboarding-Prozess starten
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              HR-Kennzahlen und Berichte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/hr/dashboard">
                HR Dashboard öffnen
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Payroll
            </CardTitle>
            <CardDescription>
              Gehaltsabrechnungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/hr/payroll">
                Zur Gehaltsabrechnung
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
