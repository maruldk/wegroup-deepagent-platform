
'use client';
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle,
  Eye,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
  _count: {
    subtasks: number;
    taskComments: number;
  };
}

interface KanbanData {
  todo: Task[];
  inProgress: Task[];
  review: Task[];
  done: Task[];
}

interface KanbanBoardProps {
  projectId: string;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (status: TaskStatus) => void;
}

const STATUS_COLUMNS = [
  { key: 'todo', title: 'To Do', status: TaskStatus.TODO, color: 'bg-gray-100' },
  { key: 'inProgress', title: 'In Progress', status: TaskStatus.IN_PROGRESS, color: 'bg-blue-100' },
  { key: 'review', title: 'Review', status: TaskStatus.REVIEW, color: 'bg-yellow-100' },
  { key: 'done', title: 'Done', status: TaskStatus.DONE, color: 'bg-green-100' },
];

const PRIORITY_COLORS = {
  [TaskPriority.LOW]: 'bg-gray-500',
  [TaskPriority.MEDIUM]: 'bg-blue-500',
  [TaskPriority.HIGH]: 'bg-orange-500',
  [TaskPriority.URGENT]: 'bg-red-500',
};

const PRIORITY_LABELS = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.URGENT]: 'Urgent',
};

export default function KanbanBoard({ projectId, onTaskClick, onCreateTask }: KanbanBoardProps) {
  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadKanbanData();
  }, [projectId]);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/project-management/kanban/${projectId}`);
      if (!response.ok) throw new Error('Failed to load kanban data');
      
      const data = await response.json();
      setKanbanData(data.kanban);
    } catch (error) {
      console.error('Error loading kanban data:', error);
      toast.error('Failed to load kanban board');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task status');
      
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      // Reload data to revert changes
      loadKanbanData();
    } finally {
      setUpdating(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
    loadKanbanData(); // Reload data after update
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

    return (
      <div className="mb-3">
            <Card 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isOverdue ? 'border-red-200 bg-red-50' : ''
              }`}
              onClick={() => onTaskClick?.(task)}
            >
              <CardContent className="p-4">
                {/* Priority Badge */}
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                  {isOverdue && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Task Title */}
                <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.name}</h4>

                {/* Task Description */}
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <div className={`flex items-center gap-1 text-xs mb-3 ${
                    isOverdue ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'MMM dd')}
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  {/* Assignee */}
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Task Stats */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task._count.taskComments > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task._count.taskComments}
                      </div>
                    )}
                    {task._count.subtasks > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {task._count.subtasks}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
    );
  };

  const ColumnHeader = ({ column, count }: { column: typeof STATUS_COLUMNS[0]; count: number }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onCreateTask?.(column.status)}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.key} className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!kanbanData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load kanban board</p>
        <Button onClick={loadKanbanData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((column) => {
          const count = kanbanData[column.key as keyof KanbanData]?.length || 0;
          return (
            <Card key={column.key}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{column.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUS_COLUMNS.map((column) => {
          const tasks = kanbanData[column.key as keyof KanbanData] || [];
          
          return (
            <div key={column.key} className={`${column.color} rounded-lg p-4 min-h-[600px]`}>
              <ColumnHeader column={column} count={tasks.length} />
              
              <div className="min-h-[400px]">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateTask?.(column.status)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {updating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p>Updating task status...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
