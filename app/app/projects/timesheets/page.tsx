
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Plus, 
  Search,
  Calendar,
  User,
  Play,
  Pause,
  Square,
  Download,
  Filter,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');

  // Mock data for charts
  const weeklyHours = [
    { day: 'Mo', hours: 8.5 },
    { day: 'Di', hours: 7.2 },
    { day: 'Mi', hours: 9.1 },
    { day: 'Do', hours: 8.0 },
    { day: 'Fr', hours: 6.8 },
    { day: 'Sa', hours: 0 },
    { day: 'So', hours: 0 },
  ];

  const projectHours = [
    { name: 'DeepAgent V2.0', hours: 32.5, fill: COLORS[0] },
    { name: 'Customer Portal', hours: 18.2, fill: COLORS[1] },
    { name: 'Mobile App', hours: 12.8, fill: COLORS[2] },
    { name: 'Admin Dashboard', hours: 8.5, fill: COLORS[3] },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timesheetsRes, projectsRes] = await Promise.all([
          fetch('/api/timesheets'),
          fetch('/api/projects')
        ]);

        if (timesheetsRes.ok) {
          const data = await timesheetsRes.json();
          setTimesheets(data.timesheets || []);
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

  const filteredTimesheets = timesheets.filter((timesheet: any) => {
    const matchesSearch = timesheet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.task?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = projectFilter === 'all' || timesheet.projectId === projectFilter;

    return matchesSearch && matchesProject;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}h`;
  };

  const calculateStats = () => {
    const totalHours = filteredTimesheets.reduce((sum: number, ts: any) => sum + ts.hours, 0);
    const todayHours = filteredTimesheets
      .filter((ts: any) => new Date(ts.date).toDateString() === new Date().toDateString())
      .reduce((sum: number, ts: any) => sum + ts.hours, 0);
    
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
    const weekHours = filteredTimesheets
      .filter((ts: any) => new Date(ts.date) >= thisWeekStart)
      .reduce((sum: number, ts: any) => sum + ts.hours, 0);

    const uniqueProjects = [...new Set(filteredTimesheets.map((ts: any) => ts.projectId))].length;

    return { totalHours, todayHours, weekHours, uniqueProjects };
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
          <h1 className="text-3xl font-bold text-gray-900">Zeiterfassung</h1>
          <p className="text-gray-600 mt-2">
            Erfassen und analysieren Sie Ihre Arbeitszeiten
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Timer starten
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Zeit erfassen
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Heute', 
            value: formatTime(stats.todayHours), 
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          { 
            title: 'Diese Woche', 
            value: formatTime(stats.weekHours), 
            icon: Calendar,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          { 
            title: 'Gesamt (gefiltert)', 
            value: formatTime(stats.totalHours), 
            icon: BarChart3,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          { 
            title: 'Projekte', 
            value: stats.uniqueProjects, 
            icon: Target,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Wochenstunden
              </CardTitle>
              <CardDescription>
                Erfasste Stunden pro Wochentag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}h`, 'Stunden']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill={COLORS[0]} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Hours Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Projektstunden
              </CardTitle>
              <CardDescription>
                Verteilung der Arbeitszeit nach Projekten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectHours}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="hours"
                    >
                      {projectHours.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}h`, 'Stunden']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {projectHours.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name}: {item.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zeiterfassungen durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Projekt auswählen" />
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
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Zeitraum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Heute</SelectItem>
            <SelectItem value="week">Diese Woche</SelectItem>
            <SelectItem value="month">Dieser Monat</SelectItem>
            <SelectItem value="all">Alle</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </motion.div>

      {/* Active Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Aktive Zeiterfassung</h3>
                  <p className="text-sm text-gray-600">DeepAgent Platform V2.0 - API Entwicklung</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">02:34:15</div>
                  <div className="text-sm text-gray-600">Gestartet um 09:15</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timesheets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {filteredTimesheets.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Zeiterfassungen</CardTitle>
              <CardDescription>
                {filteredTimesheets.length} Eintrag/Einträge gefunden
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projekt/Aufgabe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stunden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Benutzer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTimesheets.map((timesheet: any) => (
                      <motion.tr
                        key={timesheet.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(timesheet.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {timesheet.project && (
                              <div className="text-sm font-medium text-gray-900">
                                {timesheet.project.name}
                              </div>
                            )}
                            {timesheet.task && (
                              <div className="text-sm text-gray-500">
                                {timesheet.task.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {timesheet.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(timesheet.hours)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-900">
                              {timesheet.user?.name || timesheet.user?.email}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Zeiterfassungen gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || projectFilter !== 'all' 
                  ? 'Keine Zeiterfassungen entsprechen Ihren Suchkriterien.' 
                  : 'Starten Sie Ihre erste Zeiterfassung.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Zeiterfassung
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Zeiterfassung Tipps</CardTitle>
            <CardDescription>
              Optimieren Sie Ihre Zeiterfassung und Produktivität
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Regelmäßig erfassen',
                  description: 'Erfassen Sie Zeiten täglich für bessere Genauigkeit',
                  icon: Calendar,
                  tip: 'Setzen Sie tägliche Erinnerungen'
                },
                {
                  title: 'Detaillierte Beschreibungen',
                  description: 'Fügen Sie konkrete Aktivitätsbeschreibungen hinzu',
                  icon: Clock,
                  tip: 'Verwenden Sie aussagekräftige Beschreibungen'
                },
                {
                  title: 'Projektbudgets im Blick',
                  description: 'Überwachen Sie Ihre Zeitbudgets pro Projekt',
                  icon: TrendingUp,
                  tip: 'Wöchentliche Budget-Reviews durchführen'
                }
              ].map((tip) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={tip.title}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{tip.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          💡 {tip.tip}
                        </Badge>
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
