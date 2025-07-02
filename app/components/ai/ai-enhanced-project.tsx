
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FolderOpen, 
  TrendingUp, 
  TrendingDown,
  Brain, 
  AlertTriangle, 
  Users,
  Clock,
  Target,
  Zap,
  Calendar,
  Activity,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface ProjectInsight {
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'RESOURCE' | 'TIMELINE' | 'RISK' | 'OPTIMIZATION';
  trend: 'up' | 'down' | 'stable';
  actionable: boolean;
}

interface ResourceOptimization {
  memberId: string;
  memberName: string;
  currentWorkload: number;
  optimizedWorkload: number;
  skills: string[];
  recommendations: string[];
  efficiency: number;
}

interface ProjectHealthScore {
  projectId: string;
  projectName: string;
  healthScore: number;
  completionProbability: number;
  riskFactors: string[];
  estimatedCompletion: string;
  confidence: number;
}

export function AIEnhancedProject() {
  const [insights, setInsights] = useState<ProjectInsight[]>([]);
  const [resourceOptimization, setResourceOptimization] = useState<ResourceOptimization[]>([]);
  const [healthScores, setHealthScores] = useState<ProjectHealthScore[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchProjectAIData();
  }, []);

  const fetchProjectAIData = async () => {
    try {
      setLoading(true);
      
      // Generate AI project analysis
      const response = await fetch('/api/ai/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'PROJECT_OPTIMIZATION',
          data: { requestType: 'COMPREHENSIVE_ANALYSIS' },
          resourceType: 'PROJECT'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Mock comprehensive project AI data
        setInsights([
          {
            projectId: '1',
            projectName: 'Website Redesign',
            title: 'Kritisches Zeitproblem erkannt',
            description: 'Projekt läuft 23% hinter dem Zeitplan. Ressourcen-Umverteilung empfohlen.',
            confidence: 0.89,
            impact: 'high',
            category: 'TIMELINE',
            trend: 'down',
            actionable: true
          },
          {
            projectId: '2',
            projectName: 'Mobile App',
            title: 'Optimale Ressourcenverteilung',
            description: 'Aktueller Fortschritt 15% über Plan. Team-Effizienz außergewöhnlich hoch.',
            confidence: 0.93,
            impact: 'high',
            category: 'RESOURCE',
            trend: 'up',
            actionable: false
          },
          {
            projectId: '1',
            projectName: 'Website Redesign',
            title: 'Skill-Mismatch erkannt',
            description: 'Frontend-Entwickler wird für Backend-Tasks eingesetzt. Effizienz-Verlust: 35%.',
            confidence: 0.78,
            impact: 'medium',
            category: 'OPTIMIZATION',
            trend: 'down',
            actionable: true
          },
          {
            projectId: '3',
            projectName: 'CRM Integration',
            title: 'Scope-Creep Risiko',
            description: 'Indikationen für unkontrollierte Anforderungs-Erweiterung. Warnung empfohlen.',
            confidence: 0.84,
            impact: 'high',
            category: 'RISK',
            trend: 'down',
            actionable: true
          }
        ]);

        setResourceOptimization([
          {
            memberId: '1',
            memberName: 'Sarah Mueller',
            currentWorkload: 95,
            optimizedWorkload: 75,
            skills: ['React', 'TypeScript', 'UI/UX'],
            recommendations: [
              'Umverteilung von 2 Backend-Tasks',
              'Fokus auf Frontend-Optimierung',
              'Mentoring für Junior-Entwickler'
            ],
            efficiency: 0.87
          },
          {
            memberId: '2',
            memberName: 'Max Schmidt',
            currentWorkload: 65,
            optimizedWorkload: 85,
            skills: ['Node.js', 'Database', 'DevOps'],
            recommendations: [
              'Übernahme kritischer Backend-Tasks',
              'Code-Review Verantwortung',
              'Infrastruktur-Optimierung'
            ],
            efficiency: 0.92
          },
          {
            memberId: '3',
            memberName: 'Anna Weber',
            currentWorkload: 85,
            optimizedWorkload: 80,
            skills: ['Project Management', 'Scrum', 'Analytics'],
            recommendations: [
              'Fokus auf Koordination',
              'Stakeholder-Management',
              'Quality-Assurance'
            ],
            efficiency: 0.95
          }
        ]);

        setHealthScores([
          {
            projectId: '1',
            projectName: 'Website Redesign',
            healthScore: 0.68,
            completionProbability: 0.82,
            riskFactors: ['Zeitverzug', 'Ressourcen-Konflikt', 'Scope-Änderungen'],
            estimatedCompletion: '2024-04-15',
            confidence: 0.86
          },
          {
            projectId: '2',
            projectName: 'Mobile App',
            healthScore: 0.91,
            completionProbability: 0.95,
            riskFactors: ['Minimale Risiken'],
            estimatedCompletion: '2024-03-28',
            confidence: 0.93
          },
          {
            projectId: '3',
            projectName: 'CRM Integration',
            healthScore: 0.74,
            completionProbability: 0.79,
            riskFactors: ['API-Abhängigkeiten', 'Daten-Migration'],
            estimatedCompletion: '2024-05-10',
            confidence: 0.81
          }
        ]);

        setTimelineData([
          { week: 'KW 10', planned: 25, actual: 22, predicted: 28 },
          { week: 'KW 11', planned: 50, actual: 45, predicted: 52 },
          { week: 'KW 12', planned: 75, actual: 68, predicted: 76 },
          { week: 'KW 13', planned: 100, predicted: 95 },
          { week: 'KW 14', planned: 100, predicted: 100 }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch project AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeResources = async () => {
    setOptimizing(true);
    try {
      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update resource optimization
      setResourceOptimization(prev => 
        prev.map(member => ({
          ...member,
          currentWorkload: member.optimizedWorkload,
          efficiency: Math.min(0.98, member.efficiency + 0.05)
        }))
      );

      // Add new insight
      const newInsight: ProjectInsight = {
        projectId: 'all',
        projectName: 'Alle Projekte',
        title: 'Ressourcen-Optimierung angewendet',
        description: 'KI-gesteuerte Umverteilung erhöht Gesamt-Effizienz um 12%.',
        confidence: 0.94,
        impact: 'high',
        category: 'OPTIMIZATION',
        trend: 'up',
        actionable: false
      };
      
      setInsights(prev => [newInsight, ...prev]);
    } catch (error) {
      console.error('Resource optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'RESOURCE': return <Users className="w-4 h-4" />;
      case 'TIMELINE': return <Clock className="w-4 h-4" />;
      case 'RISK': return <AlertTriangle className="w-4 h-4" />;
      case 'OPTIMIZATION': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RESOURCE': return 'text-blue-500';
      case 'TIMELINE': return 'text-orange-500';
      case 'RISK': return 'text-red-500';
      case 'OPTIMIZATION': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold">KI-Enhanced Project Management</h2>
          <Badge variant="secondary" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            AI-Optimized
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={optimizeResources} 
            disabled={optimizing}
            variant="outline"
            className="gap-2"
          >
            <Target className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
            {optimizing ? 'Optimiere...' : 'Ressourcen optimieren'}
          </Button>
          <Button 
            onClick={fetchProjectAIData} 
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Project Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthScores.map((project, index) => (
          <motion.div
            key={project.projectId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.projectName}</CardTitle>
                  <Badge variant={project.healthScore >= 0.8 ? 'default' : project.healthScore >= 0.6 ? 'secondary' : 'destructive'}>
                    {Math.round(project.healthScore * 100)}% Gesundheit
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Projekt-Gesundheit</span>
                      <span className={`text-sm font-medium ${getHealthColor(project.healthScore)}`}>
                        {Math.round(project.healthScore * 100)}%
                      </span>
                    </div>
                    <Progress value={project.healthScore * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Abschluss-Wahrscheinlichkeit</span>
                      <span className={`text-sm font-medium ${getHealthColor(project.completionProbability)}`}>
                        {Math.round(project.completionProbability * 100)}%
                      </span>
                    </div>
                    <Progress value={project.completionProbability * 100} className="h-2" />
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Geschätzte Fertigstellung:</p>
                    <p className="font-medium">{new Date(project.estimatedCompletion).toLocaleDateString('de-DE')}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hauptrisiken:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.riskFactors.slice(0, 2).map((risk, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline-Prognose</TabsTrigger>
          <TabsTrigger value="resources">Ressourcen-Optimierung</TabsTrigger>
          <TabsTrigger value="insights">KI-Insights</TabsTrigger>
          <TabsTrigger value="analytics">Performance-Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                KI-Timeline-Prognose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Fortschritt (%)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 11 } 
                    }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="#60B5FF" 
                    strokeWidth={2}
                    name="Geplant"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#FF9149" 
                    strokeWidth={2}
                    name="Tatsächlich"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#80D8C3" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="KI-Prognose"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="space-y-4">
            {resourceOptimization.map((member, index) => (
              <motion.div
                key={member.memberId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.memberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{member.memberName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Effizienz: {Math.round(member.efficiency * 100)}%
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.currentWorkload > 90 ? 'destructive' : member.currentWorkload > 75 ? 'secondary' : 'outline'}>
                        {member.currentWorkload}% Auslastung
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Workload-Optimierung</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Aktuell:</span>
                            <span>{member.currentWorkload}%</span>
                          </div>
                          <Progress value={member.currentWorkload} className="h-2" />
                          <div className="flex items-center justify-between text-sm">
                            <span>Optimiert:</span>
                            <span>{member.optimizedWorkload}%</span>
                          </div>
                          <Progress value={member.optimizedWorkload} className="h-2" />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Skills & Empfehlungen</h4>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {member.skills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <ul className="text-sm space-y-1">
                            {member.recommendations.map((rec, i) => (
                              <li key={i} className="text-muted-foreground">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={`${insight.projectId}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  insight.impact === 'high' ? 'border-l-red-500' :
                  insight.impact === 'medium' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={getCategoryColor(insight.category)}>
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {insight.projectName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                          {insight.impact.toUpperCase()}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="default">
                            <Target className="w-3 h-3 mr-1" />
                            Handlungsbedarf
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Konfidenz: {Math.round(insight.confidence * 100)}%</span>
                        <span>•</span>
                        <span>Kategorie: {insight.category}</span>
                      </div>
                      {insight.actionable && (
                        <Button variant="outline" size="sm">
                          Maßnahme ergreifen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Team-Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceOptimization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="memberName" 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#60B5FF" name="Effizienz" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projekt-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={healthScores.map(p => ({
                        name: p.projectName,
                        value: Math.round(p.healthScore * 100)
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Gesundheit']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Durchschnittliche Gesundheit
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(healthScores.reduce((sum, p) => sum + p.healthScore, 0) / healthScores.length * 100)}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Team-Effizienz
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(resourceOptimization.reduce((sum, m) => sum + m.efficiency, 0) / resourceOptimization.length * 100)}%
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kritische Insights
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {insights.filter(i => i.impact === 'high' && i.actionable).length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      KI-Konfidenz
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100)}%
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
