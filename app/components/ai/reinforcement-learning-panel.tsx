
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Play, 
  Pause, 
  BarChart3, 
  TrendingUp, 
  Target,
  Activity,
  Award,
  Zap,
  Plus
} from 'lucide-react';
import { RLAgentSummary } from '@/lib/types';

export function ReinforcementLearningPanel() {
  const [agents, setAgents] = useState<RLAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/rl/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching RL agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    try {
      const response = await fetch('/api/rl/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Q_LEARNING',
          environment: 'PROJECT_OPTIMIZATION',
          hyperparameters: {
            learningRate: 0.01,
            explorationRate: 0.1,
            discountFactor: 0.95
          }
        })
      });

      if (response.ok) {
        await fetchAgents();
      }
    } catch (error) {
      console.error('Error creating RL agent:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            Reinforcement Learning Agents
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and monitor autonomous learning agents
          </p>
        </div>
        <Button onClick={createAgent} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No RL agents found. Create your first autonomous learning agent.
                </p>
                <Button onClick={createAgent} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedAgent === agent.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
                    <Badge 
                      variant={agent.isActive ? "default" : "secondary"}
                      className={agent.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {agent.agentType} • {agent.environment}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {agent.totalEpisodes}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Episodes</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {agent.avgReward.toFixed(2)}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Avg Reward</div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                      <span className="font-medium">{(agent.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.successRate * 100} className="h-2" />
                  </div>

                  {/* Last Training */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Last Training:</span>
                    <span>
                      {agent.lastTraining 
                        ? new Date(agent.lastTraining).toLocaleDateString() 
                        : 'Never'
                      }
                    </span>
                  </div>

                  {/* Actions */}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Start episode logic
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Train
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // View metrics logic
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Detailed Agent View */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Agent Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Learning Progress</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Exploration Rate</span>
                      <Badge variant="outline">10%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Learning Rate</span>
                      <Badge variant="outline">0.01</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Convergence</span>
                      <Badge variant="outline" className="text-green-600">Stable</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Recent Performance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">+15% reward improvement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">87% decision accuracy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Top performer this week</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Actions</h4>
                  <div className="space-y-2">
                    <Button className="w-full" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Training Episode
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Metrics
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Learning
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
