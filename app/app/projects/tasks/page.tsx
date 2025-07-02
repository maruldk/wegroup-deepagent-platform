
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Plus, 
  Search,
  Filter,
  User,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  CircleDot,
  Flag,
  Users,
  Folder,
  Eye,
  Edit
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects')
        ]);

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks || []);
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'DONE':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'TODO': 'Zu erledigen',
      'IN_PROGRESS': 'In Bearbeitung',
      'REVIEW': 'Review',
      'DONE': 'Erledigt',
      'CANCELLED': 'Abgebrochen'
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <CircleDot className="h-4 w-4 text-gray-600" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'REVIEW':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-700';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700';
      case 'URGENT':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'LOW': 'Niedrig',
      'MEDIUM': 'Mittel',
      'HIGH': 'Hoch',
      'URGENT': 'Dringend'
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Flag className="h-3 w-3 text-gray-500" />;
      case 'MEDIUM':
        return <Flag className="h-3 w-3 text-blue-500" />;
      case 'HIGH':
        return <Flag className="h-3 w-3 text-orange-500" />;
      case 'URGENT':
        return <Flag className="h-3 w-3 text-red-500" />;
      default:
        return <Flag className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const calculateStats = () => {
    const totalTasks = filteredTasks.length;
    const todoTasks = filteredTasks.filter((t: any) => t.status === 'TODO').length;
    const inProgressTasks = filteredTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const doneTasks = filteredTasks.filter((t: any) => t.status === 'DONE').length;
    const overdueTasks = filteredTasks.filter((t: any) => isOverdue(t.dueDate) && t.status !== 'DONE').length;

    return { totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
          <p className="text-gray-600 mt-2">
            Verwalten und verfolgen Sie alle Projektaufgaben
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neue Aufgabe
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { 
            title: 'Gesamt', 
            value: stats.totalTasks, 
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          { 
            title: 'Zu erledigen', 
            value: stats.todoTasks, 
            icon: CircleDot,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
          },
          { 
            title: 'In Bearbeitung', 
            value: stats.inProgressTasks, 
            icon: PlayCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          { 
            title: 'Erledigt', 
            value: stats.doneTasks, 
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          { 
            title: 'Überfällig', 
            value: stats.overdueTasks, 
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Aufgaben durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="TODO">Zu erledigen</SelectItem>
            <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="DONE">Erledigt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="LOW">Niedrig</SelectItem>
            <SelectItem value="MEDIUM">Mittel</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
            <SelectItem value="URGENT">Dringend</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Projekt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Projekte</SelectItem>
            {projects.map((project: any) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task: any, index: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isOverdue(task.dueDate) && task.status !== 'DONE' ? 'border-red-200 bg-red-50/50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Status Icon */}
                        <div className="mt-1">
                          {getStatusIcon(task.status)}
                        </div>

                        {/* Task Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 truncate">{task.name}</h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Task Meta Information */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {/* Status */}
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusText(task.status)}
                            </Badge>

                            {/* Priority */}
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {getPriorityIcon(task.priority)}
                              <span className="ml-1">{getPriorityText(task.priority)}</span>
                            </Badge>

                            {/* Project */}
                            {task.project && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Folder className="h-4 w-4" />
                                <span>{task.project.name}</span>
                              </div>
                            )}

                            {/* Assignee */}
                            {task.assignee && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">
                                  {task.assignee.name || task.assignee.email}
                                </span>
                              </div>
                            )}

                            {/* Due Date */}
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 text-sm ${
                                isOverdue(task.dueDate) && task.status !== 'DONE' 
                                  ? 'text-red-600 font-medium' 
                                  : 'text-gray-600'
                              }`}>
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(task.dueDate)}</span>
                                {isOverdue(task.dueDate) && task.status !== 'DONE' && (
                                  <span className="text-xs">(Überfällig)</span>
                                )}
                              </div>
                            )}

                            {/* Time Tracking */}
                            {(task.estimatedHours || task.actualHours) && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {task.actualHours || 0}h / {task.estimatedHours || 0}h
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Aufgaben gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                  ? 'Keine Aufgaben entsprechen Ihren Suchkriterien.' 
                  : 'Erstellen Sie Ihre erste Aufgabe.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Aufgabe erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>
              Häufig verwendete Task-Management Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Bulk Status Update',
                  description: 'Mehrere Aufgaben gleichzeitig bearbeiten',
                  icon: CheckCircle,
                  action: 'bulk-update'
                },
                {
                  title: 'Zeiterfassung',
                  description: 'Arbeitszeiten für Aufgaben erfassen',
                  icon: Clock,
                  action: 'time-tracking'
                },
                {
                  title: 'Team Zuweisungen',
                  description: 'Aufgaben an Teammitglieder verteilen',
                  icon: Users,
                  action: 'assignments'
                }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.title}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
