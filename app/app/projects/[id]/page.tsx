
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Settings,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Activity,
  Kanban,
  Plus
} from 'lucide-react';
import { TaskStatus } from '@prisma/client';
import { toast } from 'sonner';

// Import our project management components
import ProjectOverview from '@/components/project-management/project-overview';
import KanbanBoard from '@/components/project-management/kanban-board';
import ProjectTimeline from '@/components/project-management/project-timeline';
import TeamDashboard from '@/components/project-management/team-dashboard';
import ActivityFeed from '@/components/project-management/activity-feed';
import ProjectFiles from '@/components/project-management/project-files';
import TaskForm from '@/components/project-management/task-form';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus | undefined>();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Project not found');
          router.push('/projects');
          return;
        }
        throw new Error('Failed to load project');
      }
      
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = (status?: TaskStatus) => {
    setTaskFormStatus(status);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          projectId,
          startDate: taskData.startDate?.toISOString(),
          dueDate: taskData.dueDate?.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      toast.success('Task created successfully');
      setShowTaskForm(false);
      setTaskFormStatus(undefined);
      
      // Refresh the current tab if it's kanban
      if (activeTab === 'kanban') {
        // The kanban board will refresh automatically
      }
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleTaskClick = (task: any) => {
    // Navigate to task detail or open task modal
    toast.info(`Opening task: ${task.name}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge variant="secondary">
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Manager: {project.manager.name || project.manager.email}</span>
              <span>•</span>
              <span>{project._count.members} members</span>
              <span>•</span>
              <span>{project._count.tasks} tasks</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={() => handleCreateTask()}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProjectOverview
            projectId={projectId}
            onEditProject={() => toast.info('Edit project feature coming soon')}
            onManageTeam={() => setActiveTab('team')}
            onViewTasks={() => setActiveTab('kanban')}
          />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Task Board</h2>
            <Button onClick={() => handleCreateTask()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          <KanbanBoard
            projectId={projectId}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Timeline</h2>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Export Schedule
            </Button>
          </div>
          <ProjectTimeline projectId={projectId} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamDashboard
            projectId={projectId}
            onAddMember={() => toast.info('Add member feature coming soon')}
            onManageRoles={() => toast.info('Manage roles feature coming soon')}
          />
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Files</h2>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
          <ProjectFiles projectId={projectId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Activity Feed</h2>
            <Button variant="outline" size="sm">
              Filter Activities
            </Button>
          </div>
          <ActivityFeed
            projectId={projectId}
            limit={50}
            showProjectName={false}
          />
        </TabsContent>
      </Tabs>

      {/* Task Creation Dialog */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project and assign it to team members.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            defaultStatus={taskFormStatus}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setShowTaskForm(false);
              setTaskFormStatus(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
