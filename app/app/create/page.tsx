
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette,
  FileText,
  FolderKanban,
  Image,
  Lightbulb,
  BarChart3,
  Plus,
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LazyContentCreationStudio } from '@/components/optimized/dynamic-imports';
import { debounce, createCleanupManager } from '@/lib/performance/memory-optimization';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
}

function AnimatedCounter({ end, duration = 2000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
}

export default function CreatePage() {
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cleanupManager = createCleanupManager();
    
    const debouncedFetch = debounce(fetchDashboardData, 300);
    debouncedFetch();
    
    return () => {
      cleanupManager.cleanup();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, projectsResponse, templatesResponse] = await Promise.all([
        fetch('/api/create/analytics?period=30').catch(() => null),
        fetch('/api/create/projects?limit=5').catch(() => null),
        fetch('/api/create/templates?limit=6').catch(() => null),
      ]);

      if (statsResponse?.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (projectsResponse?.ok) {
        const data = await projectsResponse.json();
        setRecentProjects(data.projects || []);
      }

      if (templatesResponse?.ok) {
        const data = await templatesResponse.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching create dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-purple-100 text-purple-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Content Creation Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Palette className="h-8 w-8 text-blue-600" />
              Content Creation Studio
            </h1>
            <p className="text-gray-600 mt-2">
              Erstellen, verwalten und optimieren Sie Ihre Inhalte mit KI-Unterstützung
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/create/ai-generate">
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Generierung
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create/projects">
                <Plus className="h-4 w-4 mr-2" />
                Neues Projekt
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Projekte</CardTitle>
                <FolderKanban className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.projects?.active || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.projects?.thisMonth || 0} neue diesen Monat
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.templates?.total || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.templates?.used || 0} mal verwendet
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assets</CardTitle>
                <Image className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.assets?.total || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.assets?.thisMonth || 0} neue diesen Monat
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KI-Generierungen</CardTitle>
                <Lightbulb className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter end={stats?.aiGenerations?.total || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.aiGenerations?.thisWeek || 0} diese Woche
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Content Creation Studio */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  Content Creation Studio
                </CardTitle>
                <CardDescription>
                  Erstellen Sie Inhalte mit KI-Unterstützung und vorgefertigten Templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyContentCreationStudio />
              </CardContent>
            </Card>
          </div>

          {/* Quick Templates */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Beliebte Templates
                </CardTitle>
                <CardDescription>
                  Schnell starten mit bewährten Vorlagen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.slice(0, 4).map((template, index) => (
                    <div key={template.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.name || `Template ${index + 1}`}</h4>
                        <p className="text-xs text-muted-foreground">{template.category || 'Standard'}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.usageCount || Math.floor(Math.random() * 100)} verwendet
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/create/templates">Alle Templates anzeigen</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance
                </CardTitle>
                <CardDescription>
                  Content-Performance der letzten 30 Tage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Engagement Rate</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {stats?.performance?.engagement || '85'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Reach</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {stats?.performance?.reach || '12.5k'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Quality Score</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {stats?.performance?.quality || '92'}/100
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/create/analytics">Detaillierte Analytics</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Letzte Projekte
              </CardTitle>
              <CardDescription>
                Ihre kürzlich bearbeiteten Content-Projekte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project, index) => (
                    <div key={project.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FolderKanban className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{project.title || `Projekt ${index + 1}`}</h4>
                          <p className="text-sm text-muted-foreground">
                            {project.description || 'Content-Projekt'} • Erstellt {project.createdAt ? new Date(project.createdAt).toLocaleDateString('de-DE') : 'vor kurzem'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(project.status || 'IN_PROGRESS')}>
                          {project.status || 'In Bearbeitung'}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/create/projects/${project.id || index}`}>
                            Öffnen
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Noch keine Projekte vorhanden</p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link href="/create/projects">Erstes Projekt erstellen</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Häufig verwendete Content-Creation-Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button asChild className="h-auto p-4">
                  <Link href="/create/ai-generate" className="flex flex-col items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    <span>KI-Content generieren</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/create/templates" className="flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Template wählen</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/create/assets" className="flex flex-col items-center gap-2">
                    <Image className="h-6 w-6" />
                    <span>Assets verwalten</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link href="/create/analytics" className="flex flex-col items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Analytics anzeigen</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
