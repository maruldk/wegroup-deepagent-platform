
'use client';
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  FileText,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  Upload,
  AlertTriangle,
  Target,
  Calendar,
  Settings,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ActivityType } from '@prisma/client';

interface ActivityItem {
  id: string;
  activityType: ActivityType;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
  metadata?: any;
  entityType?: string;
  entityId?: string;
}

interface ActivityFeedProps {
  projectId?: string;
  userId?: string;
  limit?: number;
  showProjectName?: boolean;
  className?: string;
}

const ACTIVITY_ICONS: Record<string, any> = {
  'PROJECT_COMPLETED': CheckCircle2,
  'TASK_COMPLETED': CheckCircle2,
  'MILESTONE_COMPLETED': CheckCircle2,
  'RISK_IDENTIFIED': AlertTriangle,
  'MEMBER_REMOVED': UserPlus,
  'FILE_DELETED': Upload,
  'COMMENT_ADDED': MessageSquare,
  'FILE_UPLOADED': Upload,
  'MEMBER_ADDED': UserPlus,
  'TASK_CREATED': FileText,
  'TASK_UPDATED': Settings,
  'TASK_ASSIGNED': UserPlus,
  'MILESTONE_CREATED': Target,
  'BUDGET_UPDATED': Settings,
  'TIMELINE_CHANGED': Calendar,
};

const ACTIVITY_COLORS: Record<string, string> = {
  'PROJECT_COMPLETED': 'text-green-600',
  'TASK_COMPLETED': 'text-green-600',
  'MILESTONE_COMPLETED': 'text-green-600',
  'RISK_IDENTIFIED': 'text-red-600',
  'MEMBER_REMOVED': 'text-red-600',
  'FILE_DELETED': 'text-red-600',
  'COMMENT_ADDED': 'text-blue-600',
  'FILE_UPLOADED': 'text-indigo-600',
  'MEMBER_ADDED': 'text-purple-600',
  'TASK_CREATED': 'text-blue-600',
  'TASK_UPDATED': 'text-gray-600',
  'TASK_ASSIGNED': 'text-purple-600',
  'MILESTONE_CREATED': 'text-orange-600',
  'BUDGET_UPDATED': 'text-yellow-600',
  'TIMELINE_CHANGED': 'text-orange-600',
};

export default function ActivityFeed({ 
  projectId, 
  userId, 
  limit = 20, 
  showProjectName = false,
  className = ""
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [projectId, userId, limit]);

  const loadActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = '';
      if (projectId) {
        url = `/api/project-management/activity/${projectId}?limit=${limit}`;
      } else if (userId) {
        url = `/api/users/${userId}/activities?limit=${limit}`;
      } else {
        // Default to recent activities across all projects
        url = `/api/project-management/activities?limit=${limit}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load activities');

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadActivities(true);
  };

  const getActivityIcon = (activityType: ActivityType) => {
    const IconComponent = ACTIVITY_ICONS[activityType] || Activity;
    const colorClass = ACTIVITY_COLORS[activityType] || 'text-gray-600';
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
  };

  const getActivityBadge = (activityType: ActivityType) => {
    const colors: Partial<Record<ActivityType, string>> = {
      [ActivityType.PROJECT_CREATED]: 'bg-blue-100 text-blue-800',
      [ActivityType.PROJECT_UPDATED]: 'bg-yellow-100 text-yellow-800',
      [ActivityType.PROJECT_COMPLETED]: 'bg-green-100 text-green-800',
      [ActivityType.TASK_CREATED]: 'bg-blue-100 text-blue-800',
      [ActivityType.TASK_UPDATED]: 'bg-yellow-100 text-yellow-800',
      [ActivityType.TASK_ASSIGNED]: 'bg-purple-100 text-purple-800',
      [ActivityType.TASK_COMPLETED]: 'bg-green-100 text-green-800',
      [ActivityType.MILESTONE_CREATED]: 'bg-blue-100 text-blue-800',
      [ActivityType.MILESTONE_COMPLETED]: 'bg-green-100 text-green-800',
      [ActivityType.MEMBER_ADDED]: 'bg-purple-100 text-purple-800',
      [ActivityType.MEMBER_REMOVED]: 'bg-red-100 text-red-800',
      [ActivityType.FILE_UPLOADED]: 'bg-indigo-100 text-indigo-800',
      [ActivityType.FILE_DELETED]: 'bg-red-100 text-red-800',
      [ActivityType.COMMENT_ADDED]: 'bg-gray-100 text-gray-800',
      [ActivityType.RISK_IDENTIFIED]: 'bg-red-100 text-red-800',
      [ActivityType.RISK_MITIGATED]: 'bg-green-100 text-green-800',
      [ActivityType.BUDGET_UPDATED]: 'bg-yellow-100 text-yellow-800',
      [ActivityType.TIMELINE_CHANGED]: 'bg-orange-100 text-orange-800',
    };

    const badgeColor = colors[activityType] || 'bg-gray-100 text-gray-800';

    return (
      <Badge variant="secondary" className={`text-xs ${badgeColor}`}>
        {activityType.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    );
  };

  const ActivityItem = ({ activity }: { activity: ActivityItem }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {/* Activity Icon */}
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.activityType)}
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm">{activity.description}</p>
            
            {/* Project Name */}
            {showProjectName && (
              <p className="text-xs text-muted-foreground mt-1">
                in {activity.project.name}
              </p>
            )}

            {/* User and Time */}
            <div className="flex items-center gap-2 mt-2">
              {activity.user && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {activity.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.name || activity.user.email}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Activity Badge */}
          <div className="flex-shrink-0">
            {getActivityBadge(activity.activityType)}
          </div>
        </div>

        {/* Metadata */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 p-2 bg-muted rounded-md">
            <div className="text-xs text-muted-foreground space-y-1">
              {activity.metadata.fileName && (
                <div>File: {activity.metadata.fileName}</div>
              )}
              {activity.metadata.oldValue && activity.metadata.newValue && (
                <div>
                  Changed from "{activity.metadata.oldValue}" to "{activity.metadata.newValue}"
                </div>
              )}
              {activity.metadata.riskScore && (
                <div>Risk Score: {activity.metadata.riskScore}/16</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Activity Feed</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activities yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Activities will appear here as team members work on the project
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {activities.length >= limit && (
          <div className="pt-4 border-t border-border mt-4">
            <Button variant="outline" className="w-full" size="sm">
              Load More Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
