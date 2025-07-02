
import React from 'react';
import { Metadata } from 'next';
import EventOrchestrationDashboard from '../../components/ai/event-orchestration-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Zap, 
  Brain, 
  Activity, 
  Workflow,
  Target,
  TrendingUp
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Event Orchestration | weGROUP DeepAgent Plattform',
  description: 'AI-powered event-driven orchestration and automation platform for intelligent business process management.',
};

export default function EventOrchestrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Event Orchestration
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Intelligent, AI-driven event orchestration that automatically manages business processes, 
            detects anomalies, and optimizes workflows in real-time.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">AI-Powered Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Advanced AI algorithms analyze events, detect patterns, and make intelligent decisions 
                to optimize your business processes automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Real-time Processing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Events are processed in real-time with sub-second response times, ensuring immediate 
                reactions to critical business situations and opportunities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Smart Automation</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Intelligent workflows automatically handle routine tasks, escalate issues, 
                and coordinate complex business processes without human intervention.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Capabilities */}
        <div className="mb-12">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center mb-8">
                <Target className="w-8 h-8 inline-block mr-3 text-blue-600" />
                Event Orchestration Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Financial Intelligence
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Automated invoice processing and categorization</li>
                    <li>• Real-time fraud detection and risk assessment</li>
                    <li>• Budget monitoring with predictive alerts</li>
                    <li>• Overdue payment automation and escalation</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Workflow className="w-5 h-5 mr-2 text-green-600" />
                    Project Optimization
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Intelligent resource allocation and optimization</li>
                    <li>• Proactive deadline monitoring and risk assessment</li>
                    <li>• Automated task assignment and prioritization</li>
                    <li>• Milestone tracking with celebration automation</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    Analytics Automation
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Advanced anomaly detection and investigation</li>
                    <li>• Automated report generation with insights</li>
                    <li>• Continuous KPI monitoring and alerting</li>
                    <li>• Predictive analytics and trend forecasting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <EventOrchestrationDashboard />

        {/* Benefits Section */}
        <div className="mt-12">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Transform Your Business with Event Orchestration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">65%</div>
                  <div className="text-blue-100">AI Autonomy Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">&lt;100ms</div>
                  <div className="text-blue-100">Event Processing Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">99.9%</div>
                  <div className="text-blue-100">Event Delivery Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-blue-100">Automated Monitoring</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <div className="mt-12 text-center">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Powered by Advanced AI Technology
              </h3>
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Real-time Event Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Machine Learning Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Intelligent Workflow Engine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Predictive Automation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
