
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isWithinInterval } from 'date-fns';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { toast } from 'sonner';

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  estimatedHours?: number;
  actualHours?: number;
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  isCompleted: boolean;
  description?: string;
}

interface ProjectTimelineProps {
  projectId: string;
  className?: string;
}

const PRIORITY_COLORS = {
  [TaskPriority.LOW]: 'bg-gray-400',
  [TaskPriority.MEDIUM]: 'bg-blue-400',
  [TaskPriority.HIGH]: 'bg-orange-400',
  [TaskPriority.URGENT]: 'bg-red-400',
};

const STATUS_COLORS: Partial<Record<TaskStatus, string>> = {
  [TaskStatus.TODO]: 'bg-gray-300',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-400',
  [TaskStatus.REVIEW]: 'bg-yellow-400',
  [TaskStatus.DONE]: 'bg-green-400',
};

export default function ProjectTimeline({ projectId, className = "" }: ProjectTimelineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadTimelineData();
  }, [projectId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      
      // Load tasks
      const tasksResponse = await fetch(`/api/tasks?projectId=${projectId}&limit=100`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

      // Load milestones
      const milestonesResponse = await fetch(`/api/projects/${projectId}/milestones`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData.milestones || []);
      }
    } catch (error) {
      console.error('Error loading timeline data:', error);
      toast.error('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.startDate && !task.dueDate) return false;
      
      const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
      const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);
      
      return isWithinInterval(date, { start: taskStart, end: taskEnd });
    });
  };

  const getMilestonesForDate = (date: Date) => {
    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.dueDate);
      return format(milestoneDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getTaskProgress = (task: Task) => {
    if (task.status === TaskStatus.DONE) return 100;
    if (task.status === TaskStatus.REVIEW) return 80;
    if (task.status === TaskStatus.IN_PROGRESS) return 50;
    return 0;
  };

  const isTaskOverdue = (task: Task) => {
    return task.dueDate && 
           new Date(task.dueDate) < new Date() && 
           task.status !== TaskStatus.DONE;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'next' ? 7 : -7);
    setCurrentWeek(newWeek);
  };

  const TaskBar = ({ task, date }: { task: Task; date: Date }) => {
    const isOverdue = isTaskOverdue(task);
    const progress = getTaskProgress(task);
    
    return (
      <div className="mb-1 group">
        <div 
          className={`
            relative h-6 rounded px-2 text-xs text-white font-medium flex items-center justify-between cursor-pointer
            ${STATUS_COLORS[task.status]} hover:opacity-80 transition-opacity
            ${isOverdue ? 'ring-2 ring-red-500' : ''}
          `}
          title={`${task.name} - ${task.status} ${isOverdue ? '(Overdue)' : ''}`}
        >
          <span className="truncate">{task.name}</span>
          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-200 ml-1" />}
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full mt-1">
          <div 
            className="h-full bg-white/50 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const MilestoneMarker = ({ milestone }: { milestone: Milestone }) => (
    <div 
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
        ${milestone.isCompleted 
          ? 'bg-green-100 text-green-800' 
          : 'bg-orange-100 text-orange-800'
        }
      `}
      title={milestone.description}
    >
      <Target className="h-3 w-3" />
      <span className="truncate">{milestone.name}</span>
      {milestone.isCompleted && <CheckCircle2 className="h-3 w-3" />}
    </div>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const weekDays = getWeekDays();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            >
              {viewMode === 'week' ? 'Month View' : 'Week View'}
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm font-medium">
                {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd, yyyy')}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Timeline Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {weekDays.map((day) => (
              <div 
                key={day.toISOString()} 
                className={`
                  p-3 text-center border-r last:border-r-0
                  ${isToday(day) ? 'bg-primary/10 font-semibold' : ''}
                `}
              >
                <div className="text-sm font-medium">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg ${isToday(day) ? 'text-primary' : ''}`}>
                  {format(day, 'dd')}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const dayMilestones = getMilestonesForDate(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`
                    p-2 border-r last:border-r-0 min-h-[400px]
                    ${isToday(day) ? 'bg-primary/5' : ''}
                  `}
                >
                  {/* Milestones */}
                  {dayMilestones.map((milestone) => (
                    <div key={milestone.id} className="mb-2">
                      <MilestoneMarker milestone={milestone} />
                    </div>
                  ))}
                  
                  {/* Tasks */}
                  {dayTasks.map((task) => (
                    <TaskBar key={task.id} task={task} date={day} />
                  ))}
                  
                  {/* Empty state */}
                  {dayTasks.length === 0 && dayMilestones.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-4">
                      No events
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Task Status Legend */}
          <div>
            <h4 className="font-medium text-sm mb-2">Task Status</h4>
            <div className="space-y-1">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span>{status.replace('_', ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Legend */}
          <div>
            <h4 className="font-medium text-sm mb-2">Priority</h4>
            <div className="space-y-1">
              {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
                <div key={priority} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span>{priority.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === TaskStatus.DONE).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(isTaskOverdue).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
