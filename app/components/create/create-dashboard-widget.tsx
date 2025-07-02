
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
  TrendingUp,
  Users,
  Award,
  Plus,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

export function CreateDashboardWidget() {
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreateStats();
  }, []);

  const fetchCreateStats = async () => {
    try {
      const [statsResponse, projectsResponse] = await Promise.all([
        fetch('/api/create/analytics?period=30').catch(() => null),
        fetch('/api/create/projects?limit=3').catch(() => null),
      ]);

      if (statsResponse?.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (projectsResponse?.ok) {
        const data = await projectsResponse.json();
        setRecentProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching create stats:', error);
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
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            Content Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            Content Creation
          </CardTitle>
          <CardDescription>
            Content-Erstellung und Template-Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter end={stats?.projects?.active || 12} />
              </div>
              <p className="text-xs text-muted-foreground">Aktive Projekte</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedCounter end={stats?.templates?.total || 35} />
              </div>
              <p className="text-xs text-muted-foreground">Templates</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter end={stats?.assets?.total || 128} />
              </div>
              <p className="text-xs text-muted-foreground">Assets</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                <AnimatedCounter end={stats?.aiGenerations?.total || 67} />
              </div>
              <p className="text-xs text-muted-foreground">KI-Generierungen</p>
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="space-y-3 mb-6">
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
                <span className="text-sm">Content Reach</span>
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

          {/* Recent Projects */}
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium">Letzte Projekte</h4>
            {recentProjects.length > 0 ? (
              recentProjects.map((project, index) => (
                <div key={project.id || index} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{project.title || `Projekt ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{project.type || 'Content'}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status || 'IN_PROGRESS')} variant="secondary">
                    {project.status === 'IN_PROGRESS' ? 'Aktiv' : project.status || 'Aktiv'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">Noch keine Projekte</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button size="sm" className="w-full" asChild>
              <Link href="/create/ai-generate">
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Content generieren
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/create/templates">
                  <FileText className="h-4 w-4 mr-1" />
                  Templates
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/create/assets">
                  <Image className="h-4 w-4 mr-1" />
                  Assets
                </Link>
              </Button>
            </div>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/create">
                <BarChart3 className="h-4 w-4 mr-2" />
                CREATE Dashboard öffnen
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
