
/**
 * Seed Self-Learning System Data
 * Creates comprehensive test data for reinforcement learning, user feedback, and optimization
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧠 Seeding self-learning system data...');

  // Get the first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('No tenant found. Please run basic seed first.');
  }

  // Get the admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'john@doe.com' }
  });
  if (!adminUser) {
    throw new Error('Admin user not found. Please run basic seed first.');
  }

  // Clean existing self-learning data
  console.log('🧹 Cleaning existing self-learning data...');
  await prisma.rLReward.deleteMany();
  await prisma.rLAction.deleteMany();
  await prisma.rLState.deleteMany();
  await prisma.rLEpisode.deleteMany();
  await prisma.rLAgent.deleteMany();
  await prisma.userFeedback.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.implicitFeedback.deleteMany();
  await prisma.hyperparameterTuning.deleteMany();
  await prisma.modelPerformance.deleteMany();
  await prisma.conceptDrift.deleteMany();
  await prisma.autoMLExperiment.deleteMany();
  await prisma.onlineLearningSession.deleteMany();
  await prisma.transferLearning.deleteMany();
  await prisma.adaptiveLearning.deleteMany();

  // Create RL Agents
  console.log('🤖 Creating RL agents...');
  const rlAgents = await Promise.all([
    prisma.rLAgent.create({
      data: {
        name: 'Project Optimization Agent',
        description: 'Optimizes project resource allocation and task scheduling',
        agentType: 'Q_LEARNING',
        environment: 'PROJECT_OPTIMIZATION',
        state: { 
          currentProjects: 5, 
          availableResources: 12, 
          avgTaskCompletion: 0.85 
        },
        policy: { 
          qTable: {
            'project_assign': { 'high_priority': 0.8, 'normal_priority': 0.6 },
            'resource_allocate': { 'experienced_dev': 0.9, 'junior_dev': 0.5 }
          }
        },
        hyperparameters: {
          learningRate: 0.01,
          explorationRate: 0.1,
          discountFactor: 0.95
        },
        performance: {
          totalReward: 245.7,
          avgReward: 0.73,
          successRate: 0.89,
          episodeCount: 337
        },
        totalEpisodes: 337,
        totalReward: 245.7,
        avgReward: 0.73,
        explorationRate: 0.08,
        learningRate: 0.01,
        discountFactor: 0.95,
        lastTraining: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        tenantId: tenant.id,
        userId: adminUser.id
      }
    }),

    prisma.rLAgent.create({
      data: {
        name: 'Customer Behavior Agent',
        description: 'Predicts customer behavior and optimizes engagement strategies',
        agentType: 'MULTI_ARMED_BANDIT',
        environment: 'CUSTOMER_ENGAGEMENT',
        state: { 
          activeCustomers: 89, 
          engagementRate: 0.72, 
          churnProbability: 0.15 
        },
        policy: { 
          banditStats: {
            'email_campaign': { alpha: 45, beta: 12, count: 57 },
            'phone_call': { alpha: 23, beta: 8, count: 31 },
            'in_person_visit': { alpha: 67, beta: 5, count: 72 }
          }
        },
        hyperparameters: {
          learningRate: 0.02,
          explorationRate: 0.15,
          discountFactor: 0.9
        },
        performance: {
          totalReward: 189.3,
          avgReward: 0.68,
          successRate: 0.83,
          episodeCount: 278
        },
        totalEpisodes: 278,
        totalReward: 189.3,
        avgReward: 0.68,
        explorationRate: 0.12,
        learningRate: 0.02,
        discountFactor: 0.9,
        lastTraining: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        tenantId: tenant.id,
        userId: adminUser.id
      }
    }),

    prisma.rLAgent.create({
      data: {
        name: 'Financial Forecasting Agent',
        description: 'Optimizes financial predictions and budget allocations',
        agentType: 'ACTOR_CRITIC',
        environment: 'FINANCIAL_OPTIMIZATION',
        state: { 
          currentBudget: 125000, 
          forecastAccuracy: 0.92, 
          riskLevel: 0.23 
        },
        policy: { 
          actorWeights: [0.8, -0.3, 0.6, 0.9],
          criticWeights: [0.7, 0.5, -0.2, 0.8]
        },
        hyperparameters: {
          learningRate: 0.005,
          explorationRate: 0.05,
          discountFactor: 0.98
        },
        performance: {
          totalReward: 312.1,
          avgReward: 0.81,
          successRate: 0.94,
          episodeCount: 385
        },
        totalEpisodes: 385,
        totalReward: 312.1,
        avgReward: 0.81,
        explorationRate: 0.03,
        learningRate: 0.005,
        discountFactor: 0.98,
        lastTraining: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        tenantId: tenant.id,
        userId: adminUser.id
      }
    }),

    prisma.rLAgent.create({
      data: {
        name: 'System Performance Agent',
        description: 'Monitors and optimizes overall system performance',
        agentType: 'UCB',
        environment: 'SYSTEM_OPTIMIZATION',
        state: { 
          cpuUsage: 0.45, 
          memoryUsage: 0.62, 
          responseTime: 120 
        },
        policy: { 
          ucbStats: {
            'scale_up': { totalReward: 45.7, count: 23 },
            'optimize_queries': { totalReward: 67.2, count: 31 },
            'cache_refresh': { totalReward: 34.5, count: 18 }
          },
          totalPlays: 72
        },
        hyperparameters: {
          learningRate: 0.015,
          explorationRate: 0.08,
          discountFactor: 0.92
        },
        performance: {
          totalReward: 156.8,
          avgReward: 0.65,
          successRate: 0.87,
          episodeCount: 241
        },
        totalEpisodes: 241,
        totalReward: 156.8,
        avgReward: 0.65,
        explorationRate: 0.06,
        learningRate: 0.015,
        discountFactor: 0.92,
        lastTraining: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        tenantId: tenant.id,
        userId: adminUser.id
      }
    }),

    prisma.rLAgent.create({
      data: {
        name: 'Workflow Automation Agent',
        description: 'Learns and optimizes business workflow patterns',
        agentType: 'SARSA',
        environment: 'WORKFLOW_OPTIMIZATION',
        state: { 
          activeWorkflows: 15, 
          automationRate: 0.78, 
          errorRate: 0.05 
        },
        policy: { 
          qTable: {
            'automate_approval': { 'low_risk': 0.9, 'medium_risk': 0.6, 'high_risk': 0.2 },
            'schedule_task': { 'immediate': 0.7, 'delayed': 0.8, 'batched': 0.9 }
          }
        },
        hyperparameters: {
          learningRate: 0.008,
          explorationRate: 0.12,
          discountFactor: 0.95
        },
        performance: {
          totalReward: 203.4,
          avgReward: 0.71,
          successRate: 0.91,
          episodeCount: 287
        },
        totalEpisodes: 287,
        totalReward: 203.4,
        avgReward: 0.71,
        explorationRate: 0.09,
        learningRate: 0.008,
        discountFactor: 0.95,
        lastTraining: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isActive: true,
        tenantId: tenant.id,
        userId: adminUser.id
      }
    })
  ]);

  // Create Episodes for each agent
  console.log('📚 Creating training episodes...');
  for (const agent of rlAgents) {
    // Create recent episodes for each agent
    for (let i = 0; i < 5; i++) {
      const episode = await prisma.rLEpisode.create({
        data: {
          agentId: agent.id,
          episodeNumber: agent.totalEpisodes - i,
          startTime: new Date(Date.now() - i * 60 * 60 * 1000),
          endTime: new Date(Date.now() - i * 60 * 60 * 1000 + 30 * 60 * 1000),
          totalSteps: Math.floor(Math.random() * 50) + 20,
          totalReward: Math.random() * 2 - 0.5, // -0.5 to 1.5
          avgReward: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
          finalState: { 
            performance: Math.random() * 0.3 + 0.7,
            completion: Math.random() > 0.3 
          },
          isCompleted: true,
          success: Math.random() > 0.2,
          metadata: {
            duration: 30 * 60 * 1000,
            environment: agent.environment
          },
          tenantId: tenant.id
        }
      });

      // Create actions for this episode
      const actionCount = Math.floor(Math.random() * 10) + 5;
      for (let j = 0; j < actionCount; j++) {
        await prisma.rLAction.create({
          data: {
            agentId: agent.id,
            episodeId: episode.id,
            actionType: ['optimize', 'allocate', 'schedule', 'predict', 'adjust'][j % 5],
            actionData: {
              parameter: Math.random() * 100,
              confidence: Math.random()
            },
            state: {
              step: j,
              context: 'training'
            },
            qValue: Math.random() * 2 - 1,
            probability: Math.random(),
            reward: Math.random() * 0.4 - 0.2,
            nextState: {
              step: j + 1,
              updated: true
            },
            step: j,
            tenantId: tenant.id
          }
        });
      }

      // Create rewards for this episode
      const rewardCount = Math.floor(Math.random() * 5) + 2;
      for (let k = 0; k < rewardCount; k++) {
        await prisma.rLReward.create({
          data: {
            agentId: agent.id,
            episodeId: episode.id,
            rewardType: ['IMMEDIATE', 'DELAYED', 'SHAPED'][k % 3] as any,
            value: Math.random() * 2 - 1,
            source: ['USER_FEEDBACK', 'SYSTEM_METRIC', 'PERFORMANCE_GAIN'][k % 3],
            context: {
              source: 'episode_training',
              step: k
            },
            processed: Math.random() > 0.2,
            tenantId: tenant.id
          }
        });
      }
    }
  }

  // Create User Feedback Data
  console.log('💬 Creating user feedback data...');
  const feedbackTypes = ['EXPLICIT', 'RATING', 'PREFERENCE', 'CORRECTION'];
  const targetTypes = ['AI_DECISION', 'MODEL_PREDICTION', 'RECOMMENDATION', 'WORKFLOW'];
  const sentiments = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'];

  for (let i = 0; i < 50; i++) {
    await prisma.userFeedback.create({
      data: {
        userId: adminUser.id,
        feedbackType: feedbackTypes[i % feedbackTypes.length] as any,
        targetType: targetTypes[i % targetTypes.length],
        targetId: `target_${i + 1}`,
        rating: Math.floor(Math.random() * 5) + 1,
        sentiment: sentiments[i % sentiments.length] as any,
        comment: i % 3 === 0 ? `Feedback comment ${i + 1}: This feature works well and helps improve productivity.` : undefined,
        context: {
          page: '/dashboard',
          sessionId: `session_${Math.floor(i / 10) + 1}`,
          userAgent: 'Test Browser'
        },
        processed: Math.random() > 0.3,
        weight: Math.random() * 0.5 + 0.5,
        tenantId: tenant.id
      }
    });
  }

  // Create User Preferences
  console.log('⚙️ Creating user preferences...');
  const preferenceTypes = ['UI_LAYOUT', 'NOTIFICATION_FREQUENCY', 'AI_AGGRESSIVENESS', 'WORKFLOW_AUTOMATION'];
  const sources = ['EXPLICIT', 'IMPLICIT', 'LEARNED'];

  for (let i = 0; i < 20; i++) {
    await prisma.userPreference.create({
      data: {
        userId: adminUser.id,
        preferenceType: preferenceTypes[i % preferenceTypes.length],
        key: `preference_${i + 1}`,
        value: {
          setting: Math.random() > 0.5 ? 'enabled' : 'disabled',
          value: Math.random() * 100
        },
        source: sources[i % sources.length] as any,
        confidence: Math.random() * 0.4 + 0.6,
        updateCount: Math.floor(Math.random() * 10) + 1,
        tenantId: tenant.id
      }
    });
  }

  // Create Implicit Feedback
  console.log('👁️ Creating implicit feedback data...');
  const actions = ['CLICK', 'HOVER', 'SCROLL', 'TIME_SPENT', 'PAGE_VIEW'];

  for (let i = 0; i < 100; i++) {
    await prisma.implicitFeedback.create({
      data: {
        userId: adminUser.id,
        sessionId: `session_${Math.floor(i / 20) + 1}`,
        action: actions[i % actions.length],
        targetType: targetTypes[i % targetTypes.length],
        targetId: `element_${i + 1}`,
        value: Math.random() * 300 + 50, // 50-350 (time spent, click count, etc.)
        context: {
          page: ['/dashboard', '/projects', '/customers', '/analytics'][i % 4],
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          device: 'desktop'
        },
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        processed: Math.random() > 0.4,
        tenantId: tenant.id
      }
    });
  }

  // Create Hyperparameter Tuning Experiments
  console.log('🔧 Creating hyperparameter tuning experiments...');
  const tuningMethods = ['BAYESIAN_OPTIMIZATION', 'GENETIC_ALGORITHM', 'RANDOM_SEARCH', 'GRID_SEARCH'];
  const objectives = ['accuracy', 'f1_score', 'precision', 'recall'];

  for (let i = 0; i < 8; i++) {
    await prisma.hyperparameterTuning.create({
      data: {
        agentId: rlAgents[i % rlAgents.length].id,
        tuningMethod: tuningMethods[i % tuningMethods.length] as any,
        searchSpace: {
          learning_rate: { type: 'continuous', min: 0.001, max: 0.1 },
          batch_size: { type: 'discrete', values: [16, 32, 64, 128] },
          dropout: { type: 'continuous', min: 0.1, max: 0.5 }
        },
        objective: objectives[i % objectives.length],
        currentParams: {
          learning_rate: 0.01,
          batch_size: 32,
          dropout: 0.3
        },
        bestParams: i > 2 ? {
          learning_rate: Math.random() * 0.01 + 0.005,
          batch_size: [16, 32, 64][Math.floor(Math.random() * 3)],
          dropout: Math.random() * 0.3 + 0.2
        } : undefined,
        bestScore: i > 2 ? Math.random() * 0.2 + 0.8 : undefined,
        iterations: Math.floor(Math.random() * 50) + 10,
        maxIterations: 100,
        status: ['RUNNING', 'COMPLETED', 'FAILED'][Math.min(i % 3, i > 5 ? 1 : 2)] as any,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        endTime: i > 2 ? new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000) : undefined,
        results: i > 2 ? {
          searchHistory: Array.from({ length: 20 }, (_, j) => ({
            params: {
              learning_rate: Math.random() * 0.01 + 0.005,
              batch_size: [16, 32, 64][Math.floor(Math.random() * 3)],
              dropout: Math.random() * 0.3 + 0.2
            },
            score: Math.random() * 0.3 + 0.7
          })),
          convergenceHistory: Array.from({ length: 20 }, () => Math.random() * 0.3 + 0.7)
        } : undefined,
        tenantId: tenant.id,
        userId: adminUser.id
      }
    });
  }

  // Create AutoML Experiments
  console.log('🚀 Creating AutoML experiments...');
  const experimentTypes = ['NEURAL_ARCHITECTURE_SEARCH', 'HYPERPARAMETER_OPTIMIZATION', 'FEATURE_SELECTION'];

  for (let i = 0; i < 5; i++) {
    await prisma.autoMLExperiment.create({
      data: {
        name: `AutoML Experiment ${i + 1}`,
        description: `Automated optimization experiment for ${experimentTypes[i % experimentTypes.length]}`,
        experimentType: experimentTypes[i % experimentTypes.length] as any,
        dataset: {
          features: Math.floor(Math.random() * 200) + 50,
          samples: Math.floor(Math.random() * 50000) + 10000,
          target: 'classification'
        },
        objective: 'accuracy',
        constraints: {
          max_time: 60,
          max_memory: 8192
        },
        searchSpace: {
          architectures: ['cnn', 'rnn', 'transformer'],
          optimizers: ['adam', 'sgd', 'rmsprop']
        },
        bestModel: i > 1 ? {
          architecture: 'transformer',
          optimizer: 'adam',
          learning_rate: 0.001,
          layers: 6
        } : undefined,
        bestScore: i > 1 ? Math.random() * 0.2 + 0.8 : undefined,
        totalTrials: Math.floor(Math.random() * 30) + 10,
        maxTrials: 50,
        timeLimit: 60,
        status: ['RUNNING', 'COMPLETED'][Math.min(i % 2, i > 2 ? 1 : 0)] as any,
        startTime: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        endTime: i > 1 ? new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000) : undefined,
        results: i > 1 ? {
          insights: [
            'Best performing architecture: Transformer',
            'Optimal learning rate: 0.001-0.005',
            'Adam optimizer consistently outperformed others'
          ],
          searchTime: Math.floor(Math.random() * 3600000) + 1800000,
          totalTrials: Math.floor(Math.random() * 30) + 10
        } : undefined,
        leaderboard: i > 1 ? Array.from({ length: 5 }, (_, j) => ({
          modelConfig: {
            architecture: ['transformer', 'cnn', 'rnn'][j % 3],
            optimizer: 'adam',
            learning_rate: Math.random() * 0.01 + 0.001
          },
          score: Math.random() * 0.15 + 0.8,
          rank: j + 1
        })) : undefined,
        tenantId: tenant.id,
        userId: adminUser.id
      }
    });
  }

  // Create Online Learning Sessions
  console.log('📖 Creating online learning sessions...');
  const sessionTypes = ['INCREMENTAL', 'BATCH_INCREMENTAL', 'STREAMING'];

  for (let i = 0; i < 6; i++) {
    await prisma.onlineLearningSession.create({
      data: {
        agentId: rlAgents[i % rlAgents.length].id,
        sessionType: sessionTypes[i % sessionTypes.length] as any,
        learningRate: Math.random() * 0.02 + 0.005,
        adaptationRate: Math.random() * 0.2 + 0.05,
        memorySize: Math.floor(Math.random() * 1000) + 500,
        batchSize: [16, 32, 64, 128][i % 4],
        updateFrequency: Math.floor(Math.random() * 200) + 50,
        samplesProcessed: Math.floor(Math.random() * 10000) + 1000,
        totalUpdates: Math.floor(Math.random() * 100) + 20,
        currentLoss: Math.random() * 0.5 + 0.1,
        avgLoss: Math.random() * 0.3 + 0.15,
        status: ['ACTIVE', 'PAUSED', 'COMPLETED'][i % 3] as any,
        startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        endTime: i % 3 === 2 ? new Date(Date.now() - Math.random() * 60 * 60 * 1000) : undefined,
        metadata: {
          startTime: new Date().toISOString(),
          config: {
            sessionType: sessionTypes[i % sessionTypes.length],
            learningRate: Math.random() * 0.02 + 0.005
          }
        },
        tenantId: tenant.id
      }
    });
  }

  // Create Concept Drift Detection Records
  console.log('📊 Creating concept drift records...');
  const driftTypes = ['SUDDEN', 'GRADUAL', 'RECURRING', 'INCREMENTAL'];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const driftStatuses = ['DETECTED', 'ACKNOWLEDGED', 'ADAPTING', 'ADAPTED'];

  for (let i = 0; i < 8; i++) {
    await prisma.conceptDrift.create({
      data: {
        agentId: rlAgents[i % rlAgents.length].id,
        driftType: driftTypes[i % driftTypes.length] as any,
        detectionMethod: 'PERFORMANCE_DECAY',
        severity: severities[i % severities.length] as any,
        confidence: Math.random() * 0.3 + 0.7,
        driftScore: Math.random() * 0.5 + 0.3,
        baseline: {
          accuracy: 0.85,
          loss: 0.12,
          performance: 0.88
        },
        current: {
          accuracy: 0.85 - Math.random() * 0.2,
          loss: 0.12 + Math.random() * 0.1,
          performance: 0.88 - Math.random() * 0.15
        },
        detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        acknowledgedAt: i > 2 ? new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000) : undefined,
        adaptedAt: i > 4 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined,
        status: driftStatuses[Math.min(i % driftStatuses.length, i > 2 ? 1 : 0)] as any,
        recommendation: `Recommended action for ${driftTypes[i % driftTypes.length]} drift: Increase learning rate and monitor closely.`,
        metadata: {
          detectionMethod: 'PERFORMANCE_DECAY',
          threshold: 0.15,
          environment: rlAgents[i % rlAgents.length].environment
        },
        tenantId: tenant.id
      }
    });
  }

  // Create Model Performance Records
  console.log('📈 Creating model performance records...');
  const metricNames = ['ACCURACY', 'LOSS', 'REWARD', 'F1_SCORE', 'PRECISION'];
  const dataWindows = ['HOUR', 'DAY', 'WEEK', 'MONTH'];

  for (let i = 0; i < 30; i++) {
    await prisma.modelPerformance.create({
      data: {
        agentId: rlAgents[i % rlAgents.length].id,
        metricName: metricNames[i % metricNames.length],
        metricValue: Math.random() * 0.4 + 0.6,
        baseline: Math.random() * 0.2 + 0.7,
        improvement: Math.random() * 0.2 - 0.1,
        dataWindow: dataWindows[i % dataWindows.length],
        sampleSize: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        version: '1.0',
        environment: rlAgents[i % rlAgents.length].environment,
        tenantId: tenant.id
      }
    });
  }

  console.log('✅ Self-learning system data seeded successfully!');
  console.log(`📊 Created:
  - 5 RL Agents with comprehensive training data
  - 25 Training Episodes with actions and rewards
  - 50 User Feedback entries
  - 20 User Preferences
  - 100 Implicit Feedback entries
  - 8 Hyperparameter Tuning experiments
  - 5 AutoML experiments
  - 6 Online Learning sessions
  - 8 Concept Drift detections
  - 30 Performance metric records`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding self-learning data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
