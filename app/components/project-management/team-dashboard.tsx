
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserPlus,
  Crown,
  Clock,
  CheckCircle2,
  Activity,
  MessageSquare,
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';
import { TaskStatus } from '@prisma/client';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  role?: string;
  joinedAt: string;
}

interface TeamStats {
  totalMembers: number;
  activeUsers: number;
  totalActivities: number;
  totalFiles: number;
  userActivityLevels: Record<string, number>;
  recentActivities: Array<{
    type: string;
    description: string;
    user: string;
    createdAt: string;
  }>;
}

interface UserTaskStats {
  [userId: string]: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
  };
}

interface TeamDashboardProps {
  projectId: string;
  onAddMember?: () => void;
  onManageRoles?: () => void;
  className?: string;
}

export default function TeamDashboard({ 
  projectId, 
  onAddMember, 
  onManageRoles, 
  className = "" 
}: TeamDashboardProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [userTaskStats, setUserTaskStats] = useState<UserTaskStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [projectId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load project with members
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setMembers(projectData.project?.members || []);
      }

      // Load team collaboration stats
      const statsResponse = await fetch(`/api/project-management/collaboration/${projectId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTeamStats(statsData.stats);
      }

      // Load user task statistics
      const tasksResponse = await fetch(`/api/tasks?projectId=${projectId}&limit=500`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const tasks = tasksData.tasks || [];
        
        // Calculate task stats per user
        const userStats: UserTaskStats = {};
        tasks.forEach((task: any) => {
          if (task.assigneeId) {
            if (!userStats[task.assigneeId]) {
              userStats[task.assigneeId] = {
                total: 0,
                completed: 0,
                inProgress: 0,
                todo: 0,
                completionRate: 0,
              };
            }
            
            userStats[task.assigneeId].total++;
            
            switch (task.status) {
              case TaskStatus.DONE:
                userStats[task.assigneeId].completed++;
                break;
              case TaskStatus.IN_PROGRESS:
                userStats[task.assigneeId].inProgress++;
                break;
              case TaskStatus.TODO:
                userStats[task.assigneeId].todo++;
                break;
            }
          }
        });

        // Calculate completion rates
        Object.keys(userStats).forEach(userId => {
          const stats = userStats[userId];
          stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        });

        setUserTaskStats(userStats);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const getMemberTaskStats = (memberId: string) => {
    return userTaskStats[memberId] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      completionRate: 0,
    };
  };

  const getTopPerformers = () => {
    return members
      .map(member => ({
        ...member,
        stats: getMemberTaskStats(member.user.id),
      }))
      .filter(member => member.stats.total > 0)
      .sort((a, b) => b.stats.completionRate - a.stats.completionRate)
      .slice(0, 3);
  };

  const getRoleIcon = (role?: string) => {
    if (role?.toLowerCase().includes('manager') || role?.toLowerCase().includes('lead')) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    return <Users className="h-4 w-4 text-gray-600" />;
  };

  const getRoleBadgeColor = (role?: string) => {
    if (role?.toLowerCase().includes('manager') || role?.toLowerCase().includes('lead')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (role?.toLowerCase().includes('developer')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (role?.toLowerCase().includes('designer')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const MemberCard = ({ member }: { member: TeamMember }) => {
    const taskStats = getMemberTaskStats(member.user.id);
    const activityLevel = teamStats?.userActivityLevels[member.user.name || member.user.email] || 0;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback>
                  {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-sm">
                  {member.user.name || member.user.email}
                </h4>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {getRoleIcon(member.role)}
            </div>
          </div>

          {/* Role Badge */}
          {member.role && (
            <Badge 
              variant="secondary" 
              className={`text-xs mb-3 ${getRoleBadgeColor(member.role)}`}
            >
              {member.role}
            </Badge>
          )}

          {/* Task Statistics */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span>Task Completion</span>
              <span className="font-medium">{Math.round(taskStats.completionRate)}%</span>
            </div>
            <Progress value={taskStats.completionRate} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">{taskStats.completed}</div>
                <div className="text-muted-foreground">Done</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{taskStats.inProgress}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{taskStats.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Activity
            </span>
            <Badge variant="outline" className="text-xs">
              {activityLevel} actions
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Team Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPerformers = getTopPerformers();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Dashboard
            <Badge variant="secondary">{members.length} members</Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onManageRoles}>
              Manage Roles
            </Button>
            <Button size="sm" onClick={onAddMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats?.totalMembers || members.length}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats?.activeUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats?.totalActivities || 0}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats?.totalFiles || 0}</p>
                  <p className="text-xs text-muted-foreground">Files Shared</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((member, index) => (
                <Card key={member.user.id} className="relative">
                  <CardContent className="p-4">
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-500 text-white">
                          #1
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">
                          {member.user.name || member.user.email}
                        </h4>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Completion Rate</span>
                      <span className="font-bold text-sm">
                        {Math.round(member.stats.completionRate)}%
                      </span>
                    </div>
                    <Progress value={member.stats.completionRate} className="h-2 mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Team Members Grid */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Team Members</h3>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add team members to start collaborating
              </p>
              <Button onClick={onAddMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <MemberCard key={member.user.id} member={member} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Team Activity */}
        {teamStats?.recentActivities && teamStats.recentActivities.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Team Activity
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {teamStats.recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p>{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.user} • {activity.createdAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
