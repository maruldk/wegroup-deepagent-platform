
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  Play,
  Download,
  Settings,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, addDays } from 'date-fns';

interface PredictiveAnalyticsPanelProps {
  tenantId: string;
  userId?: string;
  dashboardData?: any;
}

export function PredictiveAnalyticsPanel({ tenantId, userId, dashboardData }: PredictiveAnalyticsPanelProps) {
  const [activeAnalysis, setActiveAnalysis] = useState('sales');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState('30');

  const runPredictiveAnalysis = async (type: string) => {
    setLoading(true);
    try {
      const config = {
        forecastHorizon: parseInt(timeHorizon),
        confidence: 0.8,
        includeSeasonality: true,
        includeHolidays: true,
      };

      const response = await fetch('/api/ml/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      });

      if (response.ok) {
        const result = await response.json();
        setForecastData(result.data);
      }
    } catch (error) {
      console.error('Failed to run predictive analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run sales forecast on mount
    runPredictiveAnalysis('sales_forecast');
  }, [timeHorizon]);

  // Mock data for demonstration
  const salesTrendData = [
    { date: '2024-01-01', actual: 125000, predicted: 120000 },
    { date: '2024-02-01', actual: 135000, predicted: 138000 },
    { date: '2024-03-01', actual: 145000, predicted: 142000 },
    { date: '2024-04-01', actual: 155000, predicted: 158000 },
    { date: '2024-05-01', actual: 165000, predicted: 162000 },
    { date: '2024-06-01', actual: null, predicted: 175000 },
    { date: '2024-07-01', actual: null, predicted: 182000 },
    { date: '2024-08-01', actual: null, predicted: 188000 },
  ];

  const cashFlowData = [
    { week: 'Week 1', income: 45000, expenses: 32000, netFlow: 13000 },
    { week: 'Week 2', income: 52000, expenses: 35000, netFlow: 17000 },
    { week: 'Week 3', income: 48000, expenses: 38000, netFlow: 10000 },
    { week: 'Week 4', income: 55000, expenses: 34000, netFlow: 21000 },
    { week: 'Week 5', income: 58000, expenses: 36000, netFlow: 22000 },
    { week: 'Week 6', income: 51000, expenses: 40000, netFlow: 11000 },
  ];

  const customerSegmentData = [
    { name: 'Champions', value: 25, color: '#10B981' },
    { name: 'Loyal Customers', value: 35, color: '#3B82F6' },
    { name: 'Potential Loyalists', value: 20, color: '#8B5CF6' },
    { name: 'New Customers', value: 15, color: '#F59E0B' },
    { name: 'At Risk', value: 5, color: '#EF4444' },
  ];

  const analysisTypes = [
    { id: 'sales', name: 'Sales Forecasting', icon: TrendingUp },
    { id: 'cashflow', name: 'Cash Flow Prediction', icon: DollarSign },
    { id: 'project', name: 'Project Timeline', icon: Calendar },
    { id: 'customer', name: 'Customer Behavior', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Analysis Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <Select value={timeHorizon} onValueChange={setTimeHorizon}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </motion.div>

      {/* Analysis Types Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {analysisTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeAnalysis === type.id ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setActiveAnalysis(type.id);
                runPredictiveAnalysis(type.id);
              }}
            >
              <CardContent className="p-4 text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm">{type.name}</h3>
                {loading && activeAnalysis === type.id && (
                  <div className="mt-2">
                    <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        animate={{ x: [-100, 100] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Main Analysis Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Forecasting */}
        {activeAnalysis === 'sales' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Sales Revenue Forecast
                  </CardTitle>
                  <CardDescription>
                    Predicted sales revenue for the next {timeHorizon} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">$182K</div>
                        <div className="text-sm text-green-600">Predicted Revenue</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <ArrowUp className="h-3 w-3" />
                          <span className="text-xs">+12%</span>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">87%</div>
                        <div className="text-sm text-blue-600">Confidence</div>
                        <Progress value={87} className="mt-2 h-1" />
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={salesTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), 'MMM')}
                        />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `$${(value / 1000).toFixed(0)}K`, 
                            name === 'actual' ? 'Actual' : 'Predicted'
                          ]}
                          labelFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Key Factors & Insights</CardTitle>
                  <CardDescription>
                    Factors influencing sales predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Seasonality Impact</span>
                      <Badge>35%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Historical Trend</span>
                      <Badge>25%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Customer Count</span>
                      <Badge>20%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Market Conditions</span>
                      <Badge>20%</Badge>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 text-primary" />
                          Focus marketing efforts in Q2 for seasonal boost
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 text-primary" />
                          Prepare inventory for 15% increase in demand
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 text-primary" />
                          Consider launching new products in peak months
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Cash Flow Analysis */}
        {activeAnalysis === 'cashflow' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cash Flow Prediction
                  </CardTitle>
                  <CardDescription>
                    Weekly cash flow analysis and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
                      <Bar dataKey="income" fill="#10B981" />
                      <Bar dataKey="expenses" fill="#EF4444" />
                      <Bar dataKey="netFlow" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Risk Assessment</CardTitle>
                  <CardDescription>
                    Potential cash flow risks and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-700">Low Risk</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Positive cash flow projected for the next 90 days
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-lg font-bold">+$84K</div>
                          <div className="text-sm text-muted-foreground">Net Flow (90d)</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">15 days</div>
                          <div className="text-sm text-muted-foreground">Cash Runway</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Maintain current expense levels</li>
                        <li>• Consider investment opportunities</li>
                        <li>• Optimize payment collection timing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Customer Behavior Analysis */}
        {activeAnalysis === 'customer' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Segmentation
                  </CardTitle>
                  <CardDescription>
                    Customer behavior analysis and value segmentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={customerSegmentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {customerSegmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">12%</div>
                      <div className="text-sm text-blue-600">Churn Risk</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">$45K</div>
                      <div className="text-sm text-green-600">Avg LTV</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                  <CardDescription>
                    AI-powered customer behavior insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">High-Value Customers</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        25% of customers drive 65% of revenue
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Send Rewards
                        </Button>
                        <Button size="sm" variant="outline">
                          Upsell Campaign
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">At-Risk Customers</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        8 customers showing churn signals
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Retention Campaign
                        </Button>
                        <Button size="sm" variant="outline">
                          Personal Outreach
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Growth Opportunities</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        15 customers ready for upgrade
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Upgrade Offer
                        </Button>
                        <Button size="sm" variant="outline">
                          Feature Demo
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
