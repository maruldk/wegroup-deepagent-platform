
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface ProjectAnalytics {
  project: {
    id: string;
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    progressPercentage: number;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    usagePercentage: number;
  };
  team: {
    totalMembers: number;
  };
  timeline: {
    estimatedCompletion?: string;
    daysUntilDeadline?: number;
  };
}

interface ProjectWithDetails {
  id: string;
  name: string;
  description?: string;
  status: string;
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

interface ProjectOverviewProps {
  projectId: string;
  onEditProject?: () => void;
  onManageTeam?: () => void;
  onViewTasks?: () => void;
}

const STATUS_COLORS = {
  PLANNING: 'bg-blue-500',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

const STATUS_LABELS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function ProjectOverview({ 
  projectId, 
  onEditProject, 
  onManageTeam, 
  onViewTasks 
}: ProjectOverviewProps) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
    loadAnalytics();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project details');
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/analytics`);
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load project analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTimelineStatus = () => {
    if (!project?.endDate) return null;
    
    const daysUntilDeadline = analytics?.timeline.daysUntilDeadline;
    if (daysUntilDeadline === null || daysUntilDeadline === undefined) return null;
    
    if (daysUntilDeadline < 0) {
      return { type: 'overdue', message: `${Math.abs(daysUntilDeadline)} days overdue`, color: 'text-red-600' };
    } else if (daysUntilDeadline <= 7) {
      return { type: 'urgent', message: `${daysUntilDeadline} days remaining`, color: 'text-orange-600' };
    } else {
      return { type: 'ontrack', message: `${daysUntilDeadline} days remaining`, color: 'text-green-600' };
    }
  };

  const getBudgetStatus = () => {
    if (!analytics?.budget.allocated) return null;
    
    const usagePercentage = analytics.budget.usagePercentage;
    if (usagePercentage > 100) {
      return { type: 'overbudget', message: 'Over budget', color: 'text-red-600' };
    } else if (usagePercentage > 80) {
      return { type: 'warning', message: 'Budget warning', color: 'text-orange-600' };
    } else {
      return { type: 'ontrack', message: 'On budget', color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!project || !analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load project overview</p>
        <Button onClick={() => { loadProjectData(); loadAnalytics(); }} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const timelineStatus = getTimelineStatus();
  const budgetStatus = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge 
              variant="secondary" 
              className={`text-white ${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]}`}
            >
              {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditProject}>
            Edit Project
          </Button>
          <Button variant="outline" onClick={onManageTeam}>
            Manage Team
          </Button>
          <Button onClick={onViewTasks}>
            View Tasks
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.tasks.progressPercentage)}%
            </div>
            <Progress value={analytics.tasks.progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics.tasks.completed} of {analytics.tasks.total} tasks completed
            </p>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{analytics.budget.spent.toLocaleString()}
            </div>
            <Progress value={analytics.budget.usagePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              of €{analytics.budget.allocated.toLocaleString()} allocated
            </p>
            {budgetStatus && (
              <p className={`text-xs mt-1 ${budgetStatus.color}`}>
                {budgetStatus.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.team.totalMembers}
            </div>
            <div className="flex -space-x-2 mt-2">
              {project.members.slice(0, 4).map((member, index) => (
                <Avatar key={member.user.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{project.members.length - 4}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active team members
            </p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'No deadline'}
            </div>
            {timelineStatus && (
              <p className={`text-xs mt-2 ${timelineStatus.color}`}>
                {timelineStatus.message}
              </p>
            )}
            {analytics.timeline.estimatedCompletion && (
              <p className="text-xs text-muted-foreground mt-1">
                Est. completion: {format(new Date(analytics.timeline.estimatedCompletion), 'MMM dd')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Task Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-muted-foreground">{analytics.tasks.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="text-sm text-muted-foreground">{analytics.tasks.inProgress}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">To Do</span>
                  <span className="text-sm text-muted-foreground">{analytics.tasks.todo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-semibold">{analytics.tasks.total}</span>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={onViewTasks} className="w-full">
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Project Manager</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {project.manager.name?.split(' ').map(n => n[0]).join('') || 'PM'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{project.manager.name || project.manager.email}</span>
                </div>
              </div>
              
              {project.startDate && (
                <div>
                  <span className="text-sm font-medium">Start Date</span>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.startDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              )}
              
              {project.endDate && (
                <div>
                  <span className="text-sm font-medium">End Date</span>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.endDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium">Team Size</span>
                <p className="text-sm text-muted-foreground">
                  {analytics.team.totalMembers} members
                </p>
              </div>
            </div>
            
            <Button variant="outline" onClick={onEditProject} className="w-full">
              Edit Project Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
