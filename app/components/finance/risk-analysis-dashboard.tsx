
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  CreditCard, 
  DollarSign,
  Activity,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface RiskAssessment {
  id: string;
  type: 'CREDIT_RISK' | 'MARKET_RISK' | 'LIQUIDITY_RISK' | 'OPERATIONAL_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  indicators: Record<string, any>;
  mitigation?: string;
  reviewDate: string;
}

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c2d12'
};

const RISK_TYPE_ICONS = {
  CREDIT_RISK: CreditCard,
  MARKET_RISK: TrendingDown,
  LIQUIDITY_RISK: DollarSign,
  OPERATIONAL_RISK: Activity
};

export function RiskAnalysisDashboard() {
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/finance/risk-analysis');
      
      if (!response.ok) {
        throw new Error('Failed to load risk assessment data');
      }

      const result = await response.json();
      setRisks(result.data || []);
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load risk assessments');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskMatrix = () => {
    return risks.map(risk => ({
      type: risk.type.replace('_', ' '),
      probability: risk.probability * 100,
      impact: risk.impact / 1000, // Normalize for display
      severity: risk.severity,
      riskScore: risk.riskScore
    }));
  };

  const getRiskDistribution = () => {
    const distribution = risks.reduce((acc, risk) => {
      acc[risk.severity] = (acc[risk.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: RISK_COLORS[severity as keyof typeof RISK_COLORS]
    }));
  };

  const getTopRisks = () => {
    return [...risks]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Analyzing financial risks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={loadRiskData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Risk Analysis Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive financial risk assessment and monitoring</p>
        </div>
        <Button variant="outline" onClick={loadRiskData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.length}</div>
            <p className="text-xs text-muted-foreground">
              {risks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {risks.filter(r => r.severity === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskScoreColor(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length)}`}>
              {risks.length > 0 ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100 maximum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(risks.reduce((sum, r) => sum + r.impact, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total potential impact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
          <TabsTrigger value="details">Risk Details</TabsTrigger>
          <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution by Severity</CardTitle>
                <CardDescription>Breakdown of risks by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getRiskDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getRiskDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Risks */}
            <Card>
              <CardHeader>
                <CardTitle>Top Risk Areas</CardTitle>
                <CardDescription>Highest priority risks requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopRisks().map((risk, index) => {
                    const IconComponent = RISK_TYPE_ICONS[risk.type];
                    return (
                      <div
                        key={risk.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRisk(risk)}
                      >
                        <div className="flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{risk.type.replace('_', ' ')}</p>
                            <Badge variant={
                              risk.severity === 'CRITICAL' ? 'destructive' :
                              risk.severity === 'HIGH' ? 'secondary' : 'outline'
                            }>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{risk.description}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <Progress 
                                value={risk.riskScore} 
                                className="h-2"
                              />
                            </div>
                            <span className="text-xs font-medium">{risk.riskScore}/100</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Matrix</CardTitle>
              <CardDescription>Probability vs Impact analysis of all identified risks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRiskMatrix()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Probability"
                      dataKey="probability"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Risk Score"
                      dataKey="riskScore"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-4">
            {risks.map((risk) => {
              const IconComponent = RISK_TYPE_ICONS[risk.type];
              return (
                <Card key={risk.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-5 w-5" />
                        <CardTitle className="text-lg">{risk.type.replace('_', ' ')}</CardTitle>
                      </div>
                      <Badge variant={
                        risk.severity === 'CRITICAL' ? 'destructive' :
                        risk.severity === 'HIGH' ? 'secondary' : 'outline'
                      }>
                        {risk.severity}
                      </Badge>
                    </div>
                    <CardDescription>{risk.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Risk Score</label>
                        <div className="flex items-center space-x-2">
                          <Progress value={risk.riskScore} className="flex-1" />
                          <span className={`text-sm font-medium ${getRiskScoreColor(risk.riskScore)}`}>
                            {risk.riskScore}/100
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Probability</label>
                        <div className="text-lg font-semibold">{formatPercentage(risk.probability)}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Financial Impact</label>
                        <div className="text-lg font-semibold">{formatCurrency(risk.impact)}</div>
                      </div>
                    </div>
                    
                    {Object.keys(risk.indicators).length > 0 && (
                      <div className="mt-4">
                        <label className="text-sm font-medium">Risk Indicators</label>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          {Object.entries(risk.indicators).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                              <span className="ml-2 font-medium">
                                {typeof value === 'number' ? 
                                  (key.includes('Amount') || key.includes('Cash') ? formatCurrency(value) : value.toLocaleString()) :
                                  value.toString()
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Review Date: {new Date(risk.reviewDate).toLocaleDateString('de-DE')}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mitigation">
          <div className="space-y-4">
            {risks.filter(r => r.mitigation).map((risk) => {
              const IconComponent = RISK_TYPE_ICONS[risk.type];
              return (
                <Card key={risk.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" />
                      <CardTitle className="text-lg">{risk.type.replace('_', ' ')}</CardTitle>
                      <Badge variant={
                        risk.severity === 'CRITICAL' ? 'destructive' :
                        risk.severity === 'HIGH' ? 'secondary' : 'outline'
                      }>
                        {risk.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Risk Description</label>
                        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Recommended Mitigation</label>
                        <p className="text-sm mt-1">{risk.mitigation}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Implement
                        </Button>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <XCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
