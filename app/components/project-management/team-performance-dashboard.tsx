
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Star, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Award,
  Brain,
  Zap,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamMemberPerformance {
  userId: string;
  userName: string;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  efficiencyScore: number;
  deliveryScore: number;
  overallScore: number;
  trends: {
    productivity: 'improving' | 'stable' | 'declining';
    quality: 'improving' | 'stable' | 'declining';
    collaboration: 'improving' | 'stable' | 'declining';
  };
  strengths: string[];
  improvementAreas: string[];
  workloadStatus: 'underutilized' | 'optimal' | 'overloaded';
  burnoutRisk: 'low' | 'medium' | 'high';
}

interface TeamCollaboration {
  overallScore: number;
  communicationScore: number;
  coordinationScore: number;
  knowledgeSharingScore: number;
  conflictResolutionScore: number;
  teamDynamics: {
    cohesion: number;
    diversity: number;
    leadership: number;
    autonomy: number;
  };
  collaborationPatterns: {
    pairings: Array<{ users: string[]; frequency: number; effectiveness: number }>;
    isolatedMembers: string[];
    communicationHubs: string[];
  };
  recommendations: string[];
}

interface WorkloadDistribution {
  userId: string;
  userName: string;
  currentWorkload: number;
  capacity: number;
  utilizationRate: number;
  taskCount: number;
  avgTaskComplexity: number;
  skillMatch: number;
  stress: number;
}

interface TeamProductivityMetrics {
  velocity: number;
  throughput: number;
  cycleTime: number;
  leadTime: number;
  qualityIndex: number;
  innovationIndex: number;
  teamSatisfaction: number;
  knowledgeSharing: number;
  crossTraining: number;
  mentoring: number;
}

interface BurnoutRiskAssessment {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: {
    workload: number;
    workLifeBalance: number;
    jobSatisfaction: number;
    stress: number;
    supportSystem: number;
    growth: number;
  };
  indicators: string[];
  recommendations: string[];
  interventions: Array<{ action: string; priority: 'immediate' | 'short-term' | 'long-term' }>;
}

interface TeamPerformanceDashboardProps {
  teamUserIds: string[];
  projectId?: string;
  className?: string;
}

const TeamPerformanceDashboard: React.FC<TeamPerformanceDashboardProps> = ({ 
  teamUserIds, 
  projectId,
  className = '' 
}) => {
  const [individualPerformances, setIndividualPerformances] = useState<TeamMemberPerformance[]>([]);
  const [collaboration, setCollaboration] = useState<TeamCollaboration | null>(null);
  const [workloadDistribution, setWorkloadDistribution] = useState<WorkloadDistribution[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<TeamProductivityMetrics | null>(null);
  const [burnoutAssessments, setBurnoutAssessments] = useState<BurnoutRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('MONTHLY');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  useEffect(() => {
    if (teamUserIds.length > 0) {
      fetchTeamPerformanceData();
    }
  }, [teamUserIds, projectId, selectedPeriod]);

  const fetchTeamPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = [
        // Individual performances
        fetch('/api/team/performance/individual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: teamUserIds, period: selectedPeriod, projectId })
        }),
        
        // Team collaboration
        teamUserIds.length >= 2 ? fetch('/api/team/performance/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: teamUserIds, period: selectedPeriod, projectId })
        }) : Promise.resolve({ ok: false }),
        
        // Workload distribution
        fetch('/api/team/performance/workload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: teamUserIds, projectId })
        }),
        
        // Productivity metrics
        fetch('/api/team/performance/productivity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: teamUserIds, period: selectedPeriod, projectId })
        }),
        
        // Burnout assessments
        fetch('/api/team/performance/burnout-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: teamUserIds })
        })
      ];

      const responses = await Promise.all(requests) as Response[];

      // Process individual performances
      if (responses[0]?.ok) {
        const individualData = await responses[0].json();
        setIndividualPerformances(individualData.data || []);
      }

      // Process collaboration data
      if (responses[1]?.ok) {
        const collaborationData = await responses[1].json();
        setCollaboration(collaborationData.data);
      }

      // Process workload distribution
      if (responses[2]?.ok) {
        const workloadData = await responses[2].json();
        setWorkloadDistribution(workloadData.data || []);
      }

      // Process productivity metrics
      if (responses[3]?.ok) {
        const productivityData = await responses[3].json();
        setProductivityMetrics(productivityData.data);
      }

      // Process burnout assessments
      if (responses[4]?.ok) {
        const burnoutData = await responses[4].json();
        setBurnoutAssessments(burnoutData.data || []);
      }

    } catch (err) {
      console.error('Error fetching team performance data:', err);
      setError('Failed to load team performance data');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceReview = async (userId: string) => {
    try {
      const response = await fetch('/api/team/performance/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, period: selectedPeriod, projectId })
      });

      if (response.ok) {
        // Refresh data after generating review
        fetchTeamPerformanceData();
      }
    } catch (err) {
      console.error('Error generating performance review:', err);
    }
  };

  const analyzeSkillGaps = async () => {
    try {
      const response = await fetch('/api/team/performance/skill-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: teamUserIds, projectId })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle skill gap analysis results
        console.log('Skill gap analysis:', data.data);
      }
    } catch (err) {
      console.error('Error analyzing skill gaps:', err);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getBurnoutRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWorkloadStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-100';
      case 'underutilized': return 'text-blue-600 bg-blue-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default: return <Target className="h-3 w-3 text-gray-600" />;
    }
  };

  const formatScore = (score: number) => Math.round(score);

  // Prepare chart data
  const teamOverviewData = individualPerformances.map(perf => ({
    name: perf.userName.split(' ')[0],
    productivity: perf.productivityScore,
    quality: perf.qualityScore,
    collaboration: perf.collaborationScore,
    overall: perf.overallScore
  }));

  const workloadChartData = workloadDistribution.map(workload => ({
    name: workload.userName.split(' ')[0],
    utilization: Math.round(workload.utilizationRate * 100),
    capacity: 100,
    stress: Math.round(workload.stress * 100)
  }));

  const collaborationRadarData = collaboration ? [
    { subject: 'Communication', A: collaboration.communicationScore, fullMark: 100 },
    { subject: 'Coordination', A: collaboration.coordinationScore, fullMark: 100 },
    { subject: 'Knowledge Sharing', A: collaboration.knowledgeSharingScore, fullMark: 100 },
    { subject: 'Conflict Resolution', A: collaboration.conflictResolutionScore, fullMark: 100 },
    { subject: 'Team Cohesion', A: collaboration.teamDynamics.cohesion, fullMark: 100 },
    { subject: 'Leadership', A: collaboration.teamDynamics.leadership, fullMark: 100 }
  ] : [];

  const filteredPerformances = selectedMember === 'all' 
    ? individualPerformances 
    : individualPerformances.filter(p => p.userId === selectedMember);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTeamPerformanceData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Performance</h2>
          <p className="text-gray-600">Comprehensive team analytics and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Team Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {individualPerformances.map(perf => (
                <SelectItem key={perf.userId} value={perf.userId}>
                  {perf.userName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={analyzeSkillGaps} variant="outline" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Skill Analysis</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {productivityMetrics && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Velocity</p>
                  <p className="text-2xl font-bold text-blue-900">{formatScore(productivityMetrics.velocity)}</p>
                </div>
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Quality Index</p>
                  <p className="text-2xl font-bold text-green-900">{formatScore(productivityMetrics.qualityIndex)}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Satisfaction</p>
                  <p className="text-2xl font-bold text-purple-900">{formatScore(productivityMetrics.teamSatisfaction)}</p>
                </div>
                <Star className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Cycle Time</p>
                  <p className="text-2xl font-bold text-orange-900">{formatScore(productivityMetrics.cycleTime)}d</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Innovation</p>
                  <p className="text-2xl font-bold text-teal-900">{formatScore(productivityMetrics.innovationIndex)}</p>
                </div>
                <Zap className="h-5 w-5 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Overview</CardTitle>
                <CardDescription>Performance scores across all team members</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamOverviewData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="productivity" fill="#60B5FF" name="Productivity" />
                    <Bar dataKey="quality" fill="#FF9149" name="Quality" />
                    <Bar dataKey="collaboration" fill="#80D8C3" name="Collaboration" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workload Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Current team capacity utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="utilization" fill="#60B5FF" name="Utilization %" />
                    <Bar dataKey="stress" fill="#FF9898" name="Stress Level %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members Summary</CardTitle>
              <CardDescription>Overview of all team member performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {individualPerformances.map((member) => (
                  <motion.div
                    key={member.userId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm">{member.userName}</h4>
                          <p className="text-xs text-gray-600">Overall: {formatScore(member.overallScore)}</p>
                        </div>
                      </div>
                      <Badge className={getPerformanceColor(member.overallScore)}>
                        {member.overallScore >= 80 ? 'Excellent' : 
                         member.overallScore >= 70 ? 'Good' : 
                         member.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center space-x-1">
                          <span>Productivity</span>
                          {getTrendIcon(member.trends.productivity)}
                        </span>
                        <span>{formatScore(member.productivityScore)}</span>
                      </div>
                      <Progress value={member.productivityScore} className="h-1" />

                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center space-x-1">
                          <span>Quality</span>
                          {getTrendIcon(member.trends.quality)}
                        </span>
                        <span>{formatScore(member.qualityScore)}</span>
                      </div>
                      <Progress value={member.qualityScore} className="h-1" />

                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center space-x-1">
                          <span>Collaboration</span>
                          {getTrendIcon(member.trends.collaboration)}
                        </span>
                        <span>{formatScore(member.collaborationScore)}</span>
                      </div>
                      <Progress value={member.collaborationScore} className="h-1" />
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <Badge className={getWorkloadStatusColor(member.workloadStatus)} variant="outline">
                        {member.workloadStatus.replace('_', ' ')}
                      </Badge>
                      <Badge className={getBurnoutRiskColor(member.burnoutRisk)} variant="outline">
                        {member.burnoutRisk} risk
                      </Badge>
                    </div>

                    <Button 
                      onClick={() => generatePerformanceReview(member.userId)}
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      Generate Review
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="space-y-6">
            {filteredPerformances.map((member) => (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {member.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{member.userName}</CardTitle>
                          <CardDescription>Overall Performance: {formatScore(member.overallScore)}/100</CardDescription>
                        </div>
                      </div>
                      <Badge className={getPerformanceColor(member.overallScore)}>
                        {member.overallScore >= 80 ? 'Excellent' : 
                         member.overallScore >= 70 ? 'Good' : 
                         member.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Performance Metrics */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="flex items-center space-x-1">
                                <span>Productivity</span>
                                {getTrendIcon(member.trends.productivity)}
                              </span>
                              <span>{formatScore(member.productivityScore)}</span>
                            </div>
                            <Progress value={member.productivityScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="flex items-center space-x-1">
                                <span>Quality</span>
                                {getTrendIcon(member.trends.quality)}
                              </span>
                              <span>{formatScore(member.qualityScore)}</span>
                            </div>
                            <Progress value={member.qualityScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="flex items-center space-x-1">
                                <span>Collaboration</span>
                                {getTrendIcon(member.trends.collaboration)}
                              </span>
                              <span>{formatScore(member.collaborationScore)}</span>
                            </div>
                            <Progress value={member.collaborationScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Efficiency</span>
                              <span>{formatScore(member.efficiencyScore)}</span>
                            </div>
                            <Progress value={member.efficiencyScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Delivery</span>
                              <span>{formatScore(member.deliveryScore)}</span>
                            </div>
                            <Progress value={member.deliveryScore} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Strengths and Areas for Improvement */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                          <div className="space-y-1">
                            {member.strengths.map((strength, index) => (
                              <div key={index} className="flex items-center text-sm text-green-700">
                                <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                                {strength}
                              </div>
                            ))}
                          </div>
                        </div>

                        {member.improvementAreas.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                            <div className="space-y-1">
                              {member.improvementAreas.map((area, index) => (
                                <div key={index} className="flex items-center text-sm text-orange-700">
                                  <Target className="h-3 w-3 mr-2 flex-shrink-0" />
                                  {area}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex space-x-2">
                            <Badge className={getWorkloadStatusColor(member.workloadStatus)}>
                              {member.workloadStatus.replace('_', ' ')}
                            </Badge>
                            <Badge className={getBurnoutRiskColor(member.burnoutRisk)}>
                              {member.burnoutRisk} burnout risk
                            </Badge>
                          </div>
                          <Button 
                            onClick={() => generatePerformanceReview(member.userId)}
                            size="sm"
                            variant="outline"
                          >
                            <Award className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {collaboration ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collaboration Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Collaboration Analysis</CardTitle>
                  <CardDescription>Overall score: {formatScore(collaboration.overallScore)}/100</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={collaborationRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar dataKey="A" stroke="#60B5FF" fill="#60B5FF" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Collaboration Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Metrics</CardTitle>
                  <CardDescription>Detailed breakdown of team collaboration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Communication</span>
                      <span>{formatScore(collaboration.communicationScore)}</span>
                    </div>
                    <Progress value={collaboration.communicationScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Coordination</span>
                      <span>{formatScore(collaboration.coordinationScore)}</span>
                    </div>
                    <Progress value={collaboration.coordinationScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Knowledge Sharing</span>
                      <span>{formatScore(collaboration.knowledgeSharingScore)}</span>
                    </div>
                    <Progress value={collaboration.knowledgeSharingScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conflict Resolution</span>
                      <span>{formatScore(collaboration.conflictResolutionScore)}</span>
                    </div>
                    <Progress value={collaboration.conflictResolutionScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Team Dynamics */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Dynamics</CardTitle>
                  <CardDescription>Team cohesion and leadership analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Team Cohesion</span>
                      <span>{formatScore(collaboration.teamDynamics.cohesion)}</span>
                    </div>
                    <Progress value={collaboration.teamDynamics.cohesion} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Diversity</span>
                      <span>{formatScore(collaboration.teamDynamics.diversity)}</span>
                    </div>
                    <Progress value={collaboration.teamDynamics.diversity} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Leadership</span>
                      <span>{formatScore(collaboration.teamDynamics.leadership)}</span>
                    </div>
                    <Progress value={collaboration.teamDynamics.leadership} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Autonomy</span>
                      <span>{formatScore(collaboration.teamDynamics.autonomy)}</span>
                    </div>
                    <Progress value={collaboration.teamDynamics.autonomy} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {collaboration.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Recommendations</CardTitle>
                    <CardDescription>AI-generated suggestions to improve team collaboration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {collaboration.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Collaboration analysis requires at least 2 team members</p>
                <p className="text-sm text-gray-500">Add more team members to enable collaboration analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Workload Overview</CardTitle>
                <CardDescription>Team capacity and utilization analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="utilization" fill="#60B5FF" name="Utilization %" />
                    <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workload Distribution Details */}
            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Detailed workload analysis per team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workloadDistribution.map((workload) => (
                    <div key={workload.userId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{workload.userName}</span>
                        <Badge className={getWorkloadStatusColor(
                          workload.utilizationRate > 0.9 ? 'overloaded' : 
                          workload.utilizationRate < 0.6 ? 'underutilized' : 'optimal'
                        )}>
                          {Math.round(workload.utilizationRate * 100)}% utilized
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>Current: {workload.currentWorkload}h</div>
                        <div>Capacity: {workload.capacity}h</div>
                        <div>Tasks: {workload.taskCount}</div>
                        <div>Complexity: {workload.avgTaskComplexity}/5</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Skill Match</span>
                          <span>{Math.round(workload.skillMatch * 100)}%</span>
                        </div>
                        <Progress value={workload.skillMatch * 100} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wellbeing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {burnoutAssessments.map((assessment) => (
              <motion.div
                key={assessment.userId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`${assessment.riskLevel === 'critical' ? 'ring-2 ring-red-200 bg-red-50' : 
                                   assessment.riskLevel === 'high' ? 'ring-2 ring-orange-200 bg-orange-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {individualPerformances.find(p => p.userId === assessment.userId)?.userName || 'Unknown'}
                      </CardTitle>
                      <Badge className={getBurnoutRiskColor(assessment.riskLevel)}>
                        {assessment.riskLevel} risk
                      </Badge>
                    </div>
                    <CardDescription>Burnout risk score: {assessment.riskScore}/100</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Workload</span>
                            <span>{assessment.factors.workload}/100</span>
                          </div>
                          <Progress value={assessment.factors.workload} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Work-Life Balance</span>
                            <span>{assessment.factors.workLifeBalance}/100</span>
                          </div>
                          <Progress value={assessment.factors.workLifeBalance} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Job Satisfaction</span>
                            <span>{assessment.factors.jobSatisfaction}/100</span>
                          </div>
                          <Progress value={assessment.factors.jobSatisfaction} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Stress Level</span>
                            <span>{assessment.factors.stress}/100</span>
                          </div>
                          <Progress value={assessment.factors.stress} className="h-1" />
                        </div>
                      </div>

                      {assessment.indicators.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-900 mb-1">Risk Indicators</h5>
                          <div className="space-y-1">
                            {assessment.indicators.slice(0, 3).map((indicator, index) => (
                              <div key={index} className="text-xs text-red-600 flex items-center">
                                <AlertTriangle className="h-2 w-2 mr-1 flex-shrink-0" />
                                {indicator}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {assessment.interventions.some(i => i.priority === 'immediate') && (
                        <div className="p-2 bg-red-100 rounded text-xs">
                          <span className="font-medium text-red-800">Immediate Action Required</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {burnoutAssessments.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No burnout assessments available</p>
                <Button onClick={fetchTeamPerformanceData} variant="outline">
                  Assess Team Wellbeing
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPerformanceDashboard;
