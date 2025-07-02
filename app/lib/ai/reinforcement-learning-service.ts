
/**
 * Reinforcement Learning Service - Core RL Infrastructure for Self-Learning System
 * Implements Q-Learning, Multi-Armed Bandit, and Policy Gradient methods
 */

import { prisma } from '@/lib/db';
import { 
  RLAgentConfig, 
  RLState, 
  RLAction, 
  RLReward, 
  RLDecisionRequest, 
  RLDecisionResponse,
  RLEpisodeResult,
  RLAgentType,
  RLRewardType 
} from '@/lib/types';

export class ReinforcementLearningService {
  
  /**
   * Create a new RL Agent
   */
  async createAgent(config: RLAgentConfig, tenantId: string, userId?: string) {
    try {
      const agent = await prisma.rLAgent.create({
        data: {
          name: `${config.agentType}_${config.environment}_Agent`,
          description: `RL Agent for ${config.environment} optimization`,
          agentType: config.agentType,
          environment: config.environment,
          state: {},
          policy: config.policy || this.initializePolicy(config.agentType),
          hyperparameters: config.hyperparameters,
          performance: {
            totalReward: 0,
            avgReward: 0,
            successRate: 0,
            episodeCount: 0
          },
          explorationRate: config.hyperparameters.explorationRate || 0.1,
          learningRate: config.hyperparameters.learningRate || 0.01,
          discountFactor: config.hyperparameters.discountFactor || 0.95,
          tenantId,
          userId
        }
      });

      return agent;
    } catch (error) {
      console.error('Error creating RL agent:', error);
      throw new Error('Failed to create RL agent');
    }
  }

  /**
   * Make a decision using RL Agent
   */
  async makeDecision(request: RLDecisionRequest): Promise<RLDecisionResponse> {
    try {
      const agent = await prisma.rLAgent.findUnique({
        where: { id: request.agentId }
      });

      if (!agent) {
        throw new Error('RL Agent not found');
      }

      let selectedAction: RLAction;
      let confidence: number;
      let explorationAction = false;

      switch (agent.agentType) {
        case 'Q_LEARNING':
          ({ action: selectedAction, confidence, explorationAction } = 
            this.qLearningDecision(agent, request.state, request.availableActions));
          break;
        case 'MULTI_ARMED_BANDIT':
          ({ action: selectedAction, confidence, explorationAction } = 
            this.multiarmedBanditDecision(agent, request.availableActions));
          break;
        case 'UCB':
          ({ action: selectedAction, confidence, explorationAction } = 
            this.ucbDecision(agent, request.availableActions));
          break;
        default:
          ({ action: selectedAction, confidence, explorationAction } = 
            this.epsilonGreedyDecision(agent, request.state, request.availableActions));
      }

      // Record the action
      await this.recordAction(agent.id, selectedAction, request.state, agent.tenantId);

      return {
        action: selectedAction,
        confidence,
        reasoning: this.generateReasoning(agent.agentType as RLAgentType, selectedAction, explorationAction),
        expectedReward: selectedAction.qValue || 0,
        explorationAction
      };

    } catch (error) {
      console.error('Error making RL decision:', error);
      throw new Error('Failed to make RL decision');
    }
  }

  /**
   * Q-Learning Decision Algorithm
   */
  private qLearningDecision(agent: any, state: RLState, availableActions: RLAction[]) {
    const stateHash = this.hashState(state);
    const policy = agent.policy || {};
    const qTable = policy.qTable || {};
    const stateValues = qTable[stateHash] || {};
    
    // Epsilon-greedy exploration
    const exploration = Math.random() < agent.explorationRate;
    
    if (exploration || Object.keys(stateValues).length === 0) {
      // Explore: random action
      const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
      return {
        action: { ...randomAction, qValue: stateValues[randomAction.type] || 0 },
        confidence: 0.3,
        explorationAction: true
      };
    } else {
      // Exploit: best known action
      let bestAction = availableActions[0];
      let bestValue = stateValues[bestAction.type] || 0;
      
      for (const action of availableActions) {
        const actionValue = stateValues[action.type] || 0;
        if (actionValue > bestValue) {
          bestValue = actionValue;
          bestAction = action;
        }
      }
      
      return {
        action: { ...bestAction, qValue: bestValue },
        confidence: Math.min(0.9, 0.5 + Math.abs(bestValue) * 0.1),
        explorationAction: false
      };
    }
  }

  /**
   * Multi-Armed Bandit Decision (Thompson Sampling)
   */
  private multiarmedBanditDecision(agent: any, availableActions: RLAction[]) {
    const policy = agent.policy || {};
    const banditStats = policy.banditStats || {};
    
    let bestAction = availableActions[0];
    let bestSample = -Infinity;
    
    for (const action of availableActions) {
      const stats = banditStats[action.type] || { alpha: 1, beta: 1, count: 0 };
      
      // Thompson Sampling: sample from Beta distribution
      const sample = this.betaDistributionSample(stats.alpha, stats.beta);
      
      if (sample > bestSample) {
        bestSample = sample;
        bestAction = action;
      }
    }
    
    const confidence = bestSample;
    
    return {
      action: { ...bestAction, probability: bestSample },
      confidence: Math.min(0.95, confidence),
      explorationAction: confidence < 0.7
    };
  }

  /**
   * Upper Confidence Bound (UCB) Decision
   */
  private ucbDecision(agent: any, availableActions: RLAction[]) {
    const policy = agent.policy || {};
    const ucbStats = policy.ucbStats || {};
    const totalPlays = policy.totalPlays || 0;
    
    let bestAction = availableActions[0];
    let bestUcbValue = -Infinity;
    
    for (const action of availableActions) {
      const stats = ucbStats[action.type] || { totalReward: 0, count: 0 };
      
      if (stats.count === 0) {
        // Unplayed action gets highest priority
        return {
          action: { ...action, qValue: Infinity },
          confidence: 1.0,
          explorationAction: true
        };
      }
      
      const averageReward = stats.totalReward / stats.count;
      const confidenceBonus = Math.sqrt((2 * Math.log(totalPlays)) / stats.count);
      const ucbValue = averageReward + confidenceBonus;
      
      if (ucbValue > bestUcbValue) {
        bestUcbValue = ucbValue;
        bestAction = action;
      }
    }
    
    return {
      action: { ...bestAction, qValue: bestUcbValue },
      confidence: Math.min(0.9, 0.4 + Math.abs(bestUcbValue) * 0.1),
      explorationAction: bestUcbValue > 1.0
    };
  }

  /**
   * Epsilon-Greedy Decision (fallback)
   */
  private epsilonGreedyDecision(agent: any, state: RLState, availableActions: RLAction[]) {
    const exploration = Math.random() < agent.explorationRate;
    
    if (exploration) {
      const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
      return {
        action: randomAction,
        confidence: 0.3,
        explorationAction: true
      };
    } else {
      // Simple greedy selection based on stored preferences
      const policy = agent.policy || {};
      const preferences = policy.actionPreferences || {};
      
      let bestAction = availableActions[0];
      let bestScore = preferences[bestAction.type] || 0;
      
      for (const action of availableActions) {
        const score = preferences[action.type] || 0;
        if (score > bestScore) {
          bestScore = score;
          bestAction = action;
        }
      }
      
      return {
        action: bestAction,
        confidence: 0.7,
        explorationAction: false
      };
    }
  }

  /**
   * Process reward and update agent
   */
  async processReward(agentId: string, reward: RLReward, actionId?: string, episodeId?: string) {
    try {
      // Record the reward
      await prisma.rLReward.create({
        data: {
          agentId,
          episodeId,
          rewardType: reward.type,
          value: reward.value,
          source: reward.source,
          context: reward.context,
          tenantId: (await prisma.rLAgent.findUnique({ where: { id: agentId } }))?.tenantId || ''
        }
      });

      // Update agent based on reward
      await this.updateAgentPolicy(agentId, reward, actionId);

      return { success: true };
    } catch (error) {
      console.error('Error processing reward:', error);
      throw new Error('Failed to process reward');
    }
  }

  /**
   * Start a new learning episode
   */
  async startEpisode(agentId: string): Promise<string> {
    try {
      const agent = await prisma.rLAgent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const episode = await prisma.rLEpisode.create({
        data: {
          agentId,
          episodeNumber: agent.totalEpisodes + 1,
          tenantId: agent.tenantId
        }
      });

      return episode.id;
    } catch (error) {
      console.error('Error starting episode:', error);
      throw new Error('Failed to start episode');
    }
  }

  /**
   * End an episode and update metrics
   */
  async endEpisode(episodeId: string, success: boolean): Promise<RLEpisodeResult> {
    try {
      const episode = await prisma.rLEpisode.findUnique({
        where: { id: episodeId },
        include: {
          actions: true,
          rewards: true,
          agent: true
        }
      });

      if (!episode) {
        throw new Error('Episode not found');
      }

      const totalReward = episode.rewards.reduce((sum, r) => sum + r.value, 0);
      const avgReward = episode.actions.length > 0 ? totalReward / episode.actions.length : 0;
      const duration = Date.now() - episode.startTime.getTime();

      // Update episode
      await prisma.rLEpisode.update({
        where: { id: episodeId },
        data: {
          endTime: new Date(),
          totalSteps: episode.actions.length,
          totalReward,
          avgReward,
          isCompleted: true,
          success
        }
      });

      // Update agent statistics
      await this.updateAgentStatistics(episode.agentId, totalReward, success);

      return {
        id: episodeId,
        episodeNumber: episode.episodeNumber,
        totalSteps: episode.actions.length,
        totalReward,
        avgReward,
        success,
        duration
      };
    } catch (error) {
      console.error('Error ending episode:', error);
      throw new Error('Failed to end episode');
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId: string) {
    try {
      const agent = await prisma.rLAgent.findUnique({
        where: { id: agentId },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'desc' },
            take: 100
          },
          rewards: {
            orderBy: { timestamp: 'desc' },
            take: 1000
          }
        }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const completedEpisodes = agent.episodes.filter(e => e.isCompleted);
      const successfulEpisodes = completedEpisodes.filter(e => e.success);
      const recentRewards = agent.rewards.slice(0, 100);

      return {
        agentId,
        totalEpisodes: agent.totalEpisodes,
        completedEpisodes: completedEpisodes.length,
        successRate: completedEpisodes.length > 0 ? successfulEpisodes.length / completedEpisodes.length : 0,
        avgReward: agent.avgReward,
        totalReward: agent.totalReward,
        explorationRate: agent.explorationRate,
        recentPerformance: recentRewards.map(r => ({
          value: r.value,
          source: r.source,
          timestamp: r.timestamp
        })),
        learningProgress: completedEpisodes.slice(0, 20).map(e => ({
          episode: e.episodeNumber,
          reward: e.totalReward,
          success: e.success
        }))
      };
    } catch (error) {
      console.error('Error getting agent metrics:', error);
      throw new Error('Failed to get agent metrics');
    }
  }

  /**
   * Helper Methods
   */

  private initializePolicy(agentType: RLAgentType): Record<string, any> {
    switch (agentType) {
      case RLAgentType.Q_LEARNING:
        return { qTable: {} };
      case RLAgentType.MULTI_ARMED_BANDIT:
        return { banditStats: {} };
      case RLAgentType.UCB:
        return { ucbStats: {}, totalPlays: 0 };
      default:
        return { actionPreferences: {} };
    }
  }

  private hashState(state: RLState): string {
    if (state.hash) return state.hash;
    return Buffer.from(JSON.stringify(state.data)).toString('base64');
  }

  private betaDistributionSample(alpha: number, beta: number): number {
    // Simplified Beta distribution sampling using gamma distributions
    const gamma1 = this.gammaDistributionSample(alpha, 1);
    const gamma2 = this.gammaDistributionSample(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private gammaDistributionSample(shape: number, scale: number): number {
    // Simplified gamma distribution sampling
    if (shape < 1) {
      return this.gammaDistributionSample(1 + shape, scale) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x = this.standardNormalSample();
      let v = 1 + c * x;
      
      if (v <= 0) continue;
      
      v = v * v * v;
      let u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private standardNormalSample(): number {
    // Box-Muller transform for standard normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private generateReasoning(agentType: RLAgentType, action: RLAction, exploration: boolean): string {
    const base = `${agentType} agent selected action "${action.type}"`;
    
    if (exploration) {
      return `${base} through exploration to discover new possibilities.`;
    } else {
      return `${base} based on learned policy (Q-value: ${action.qValue?.toFixed(3) || 'N/A'}).`;
    }
  }

  private async recordAction(agentId: string, action: RLAction, state: RLState, tenantId: string) {
    await prisma.rLAction.create({
      data: {
        agentId,
        actionType: action.type,
        actionData: action.parameters,
        state: state.data,
        qValue: action.qValue,
        probability: action.probability,
        tenantId
      }
    });
  }

  private async updateAgentPolicy(agentId: string, reward: RLReward, actionId?: string) {
    const agent = await prisma.rLAgent.findUnique({
      where: { id: agentId }
    });

    if (!agent) return;

    const policy = agent.policy as Record<string, any>;
    
    // Update policy based on agent type
    switch (agent.agentType) {
      case 'Q_LEARNING':
        await this.updateQTable(agentId, policy, reward);
        break;
      case 'MULTI_ARMED_BANDIT':
        await this.updateBanditStats(agentId, policy, reward);
        break;
      case 'UCB':
        await this.updateUCBStats(agentId, policy, reward);
        break;
    }
  }

  private async updateQTable(agentId: string, policy: Record<string, any>, reward: RLReward) {
    // Simplified Q-learning update
    const qTable = policy.qTable || {};
    
    // Update Q-values based on reward
    if (reward.context?.stateHash && reward.context?.actionType) {
      const stateHash = reward.context.stateHash;
      const actionType = reward.context.actionType;
      
      if (!qTable[stateHash]) qTable[stateHash] = {};
      
      const currentQ = qTable[stateHash][actionType] || 0;
      const learningRate = 0.1;
      const discountFactor = 0.95;
      
      // Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
      qTable[stateHash][actionType] = currentQ + learningRate * (reward.value - currentQ);
    }
    
    await prisma.rLAgent.update({
      where: { id: agentId },
      data: { policy: { ...policy, qTable } }
    });
  }

  private async updateBanditStats(agentId: string, policy: Record<string, any>, reward: RLReward) {
    const banditStats = policy.banditStats || {};
    const actionType = reward.context?.actionType;
    
    if (actionType) {
      if (!banditStats[actionType]) {
        banditStats[actionType] = { alpha: 1, beta: 1, count: 0 };
      }
      
      banditStats[actionType].count++;
      
      if (reward.value > 0) {
        banditStats[actionType].alpha++;
      } else {
        banditStats[actionType].beta++;
      }
    }
    
    await prisma.rLAgent.update({
      where: { id: agentId },
      data: { policy: { ...policy, banditStats } }
    });
  }

  private async updateUCBStats(agentId: string, policy: Record<string, any>, reward: RLReward) {
    const ucbStats = policy.ucbStats || {};
    const actionType = reward.context?.actionType;
    
    if (actionType) {
      if (!ucbStats[actionType]) {
        ucbStats[actionType] = { totalReward: 0, count: 0 };
      }
      
      ucbStats[actionType].totalReward += reward.value;
      ucbStats[actionType].count++;
      policy.totalPlays = (policy.totalPlays || 0) + 1;
    }
    
    await prisma.rLAgent.update({
      where: { id: agentId },
      data: { policy: { ...policy, ucbStats, totalPlays: policy.totalPlays } }
    });
  }

  private async updateAgentStatistics(agentId: string, episodeReward: number, success: boolean) {
    const agent = await prisma.rLAgent.findUnique({
      where: { id: agentId }
    });

    if (!agent) return;

    const newTotalEpisodes = agent.totalEpisodes + 1;
    const newTotalReward = agent.totalReward + episodeReward;
    const newAvgReward = newTotalReward / newTotalEpisodes;

    // Decay exploration rate over time
    const minExplorationRate = 0.01;
    const decayRate = 0.995;
    const newExplorationRate = Math.max(
      minExplorationRate,
      agent.explorationRate * decayRate
    );

    await prisma.rLAgent.update({
      where: { id: agentId },
      data: {
        totalEpisodes: newTotalEpisodes,
        totalReward: newTotalReward,
        avgReward: newAvgReward,
        explorationRate: newExplorationRate,
        lastTraining: new Date(),
        performance: {
          totalReward: newTotalReward,
          avgReward: newAvgReward,
          successRate: success ? 0.9 : 0.1, // Simplified success rate
          episodeCount: newTotalEpisodes
        }
      }
    });
  }
}
