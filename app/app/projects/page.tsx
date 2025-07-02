
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  BarChart3,
  FileText,
  Brain,
  Zap
} from 'lucide-react';
import { ProjectStatus } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectAnalyticsDashboard from '@/components/project-management/project-analytics-dashboard';
import TeamPerformanceDashboard from '@/components/project-management/team-performance-dashboard';
import ResourceOptimizationDashboard from '@/components/project-management/resource-optimization-dashboard';
import AdvancedReportingInterface from '@/components/project-management/advanced-reporting-interface';

interface ProjectWithDetails {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  manager: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    role?: string;
  }>;
  _count: {
    tasks: number;
    members: number;
    milestones: number;
  };
}

const STATUS_COLORS = {
  [ProjectStatus.PLANNING]: 'bg-blue-500',
  [ProjectStatus.ACTIVE]: 'bg-green-500',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-500',
  [ProjectStatus.COMPLETED]: 'bg-emerald-500',
  [ProjectStatus.CANCELLED]: 'bg-red-500',
};

const STATUS_LABELS = {
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.CANCELLED]: 'Cancelled',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      let url = '/api/projects?limit=50';
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.manager.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectProgress = (project: ProjectWithDetails) => {
    // This would be calculated from task completion in a real scenario
    // For now, return a mock progress based on status
    switch (project.status) {
      case ProjectStatus.COMPLETED: return 100;
      case ProjectStatus.ACTIVE: return Math.random() * 60 + 20; // 20-80%
      case ProjectStatus.ON_HOLD: return Math.random() * 30 + 10; // 10-40%
      case ProjectStatus.PLANNING: return Math.random() * 20; // 0-20%
      default: return 0;
    }
  };

  const getTimelineStatus = (project: ProjectWithDetails) => {
    if (!project.endDate) return null;
    
    const daysUntilDeadline = differenceInDays(new Date(project.endDate), new Date());
    
    if (daysUntilDeadline < 0) {
      return { type: 'overdue', message: `${Math.abs(daysUntilDeadline)} days overdue`, color: 'text-red-600' };
    } else if (daysUntilDeadline <= 7) {
      return { type: 'urgent', message: `${daysUntilDeadline} days remaining`, color: 'text-orange-600' };
    } else {
      return { type: 'ontrack', message: `${daysUntilDeadline} days remaining`, color: 'text-green-600' };
    }
  };

  const ProjectCard = ({ project }: { project: ProjectWithDetails }) => {
    const progress = getProjectProgress(project);
    const timelineStatus = getTimelineStatus(project);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`text-white text-xs ${STATUS_COLORS[project.status]}`}
                >
                  {STATUS_LABELS[project.status]}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${project.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <CheckCircle2 className="h-3 w-3" />
                {project._count.tasks}
              </div>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Users className="h-3 w-3" />
                {project._count.members}
              </div>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Target className="h-3 w-3" />
                {project._count.milestones}
              </div>
              <p className="text-xs text-muted-foreground">Milestones</p>
            </div>
          </div>

          {/* Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Team:</span>
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member, index) => (
                  <Avatar key={member.user.id} className="h-6 w-6 border-2 border-white">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{project.members.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {project.budget && (
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3" />
                €{project.budget.toLocaleString()}
              </div>
            )}
          </div>

          {/* Timeline */}
          {timelineStatus && (
            <div className={`text-xs ${timelineStatus.color} flex items-center gap-1`}>
              <Clock className="h-3 w-3" />
              {timelineStatus.message}
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {project.startDate && (
              <span>Started: {format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
            )}
            {project.endDate && (
              <span>Due: {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProjectListItem = ({ project }: { project: ProjectWithDetails }) => {
    const progress = getProjectProgress(project);
    const timelineStatus = getTimelineStatus(project);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Project Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${STATUS_COLORS[project.status]}`}
                  >
                    {STATUS_LABELS[project.status]}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div className="w-32">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {project._count.tasks}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {project._count.members}
                </div>
                {project.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    €{project.budget.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {timelineStatus && (
                <div className={`text-xs ${timelineStatus.color}`}>
                  {timelineStatus.message}
                </div>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate overview stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
  const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
  const overdueProjects = projects.filter(p => {
    const timeline = getTimelineStatus(p);
    return timeline?.type === 'overdue';
  }).length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            AI-powered project management and analytics platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/projects/analytics')}>
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team Performance</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Resources</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All projects in portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueProjects}</div>
            <p className="text-xs text-muted-foreground">
              Past deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <SelectItem key={status} value={status}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {projects.length === 0 
              ? 'Create your first project to get started'
              : 'Try adjusting your search criteria'
            }
          </p>
          {projects.length === 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredProjects.map((project) => (
            viewMode === 'grid' 
              ? <ProjectCard key={project.id} project={project} />
              : <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}

        {/* Create Project Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new project to organize your team's work and track progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will redirect you to the project creation form.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => router.push('/projects/new')}>
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ProjectAnalyticsDashboard 
            projectId={projects.length > 0 ? projects[0].id : 'sample-project-id'} 
            className="mt-6"
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamPerformanceDashboard 
            teamUserIds={projects.length > 0 ? projects.flatMap(p => p.members.map(m => m.user.id)) : ['user1', 'user2', 'user3']} 
            projectId={projects.length > 0 ? projects[0].id : undefined}
            className="mt-6"
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <ResourceOptimizationDashboard 
            userIds={projects.length > 0 ? projects.flatMap(p => p.members.map(m => m.user.id)) : ['user1', 'user2', 'user3']}
            projectIds={projects.map(p => p.id)}
            className="mt-6"
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AdvancedReportingInterface 
            availableProjects={projects.map(p => ({ id: p.id, name: p.name }))}
            availableUsers={projects.length > 0 ? 
              Array.from(new Set(projects.flatMap(p => p.members.map(m => m.user))))
                .map(user => ({ id: user.id, name: user.name || 'Unknown', email: user.email }))
              : [
                { id: 'user1', name: 'John Doe', email: 'john@example.com' },
                { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
                { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' }
              ]
            }
            className="mt-6"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
