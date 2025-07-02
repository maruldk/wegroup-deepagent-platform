
/**
 * Self-Optimization Service - Automated Hyperparameter Tuning and Model Optimization
 * Implements Bayesian Optimization, Genetic Algorithms, and AutoML capabilities
 */

import { prisma } from '@/lib/db';
import {
  HyperparameterTuningConfig,
  HyperparameterTuningResult,
  AutoMLExperimentConfig,
  AutoMLResult,
  TuningMethod,
  AutoMLType
} from '@/lib/types';

export class SelfOptimizationService {

  /**
   * Start hyperparameter tuning experiment
   */
  async startHyperparameterTuning(
    config: HyperparameterTuningConfig, 
    tenantId: string, 
    userId?: string
  ): Promise<string> {
    try {
      const tuning = await prisma.hyperparameterTuning.create({
        data: {
          modelId: config.modelId,
          agentId: config.agentId,
          tuningMethod: config.tuningMethod,
          searchSpace: config.searchSpace,
          objective: config.objective,
          currentParams: config.searchSpace, // Start with default parameters
          maxIterations: config.maxIterations,
          tenantId,
          userId
        }
      });

      // Start the optimization process
      this.runOptimizationProcess(tuning.id).catch(console.error);

      return tuning.id;
    } catch (error) {
      console.error('Error starting hyperparameter tuning:', error);
      throw new Error('Failed to start hyperparameter tuning');
    }
  }

  /**
   * Run optimization process
   */
  private async runOptimizationProcess(tuningId: string) {
    try {
      const tuning = await prisma.hyperparameterTuning.findUnique({
        where: { id: tuningId }
      });

      if (!tuning) {
        throw new Error('Tuning experiment not found');
      }

      let bestParams = tuning.currentParams;
      let bestScore = -Infinity;
      const searchHistory = [];

      for (let iteration = 0; iteration < tuning.maxIterations; iteration++) {
        // Generate next parameter set based on optimization method
        const nextParams = await this.generateNextParameters(
          tuning.tuningMethod as TuningMethod,
          tuning.searchSpace as Record<string, any>,
          searchHistory,
          iteration
        );

        // Evaluate parameters
        const score = await this.evaluateParameters(
          nextParams,
          tuning.objective,
          tuning.modelId || undefined,
          tuning.agentId || undefined
        );

        searchHistory.push({ params: nextParams, score });

        if (score > bestScore) {
          bestScore = score;
          bestParams = nextParams;
        }

        // Update tuning progress
        await prisma.hyperparameterTuning.update({
          where: { id: tuningId },
          data: {
            iterations: iteration + 1,
            currentParams: nextParams,
            bestParams: bestParams || {},
            bestScore,
            results: {
              searchHistory,
              convergenceHistory: searchHistory.map(h => h.score),
              bestIteration: searchHistory.findIndex(h => h.score === bestScore)
            }
          }
        });

        // Early stopping if convergence detected
        if (this.detectConvergence(searchHistory, iteration)) {
          break;
        }
      }

      // Mark as completed
      await prisma.hyperparameterTuning.update({
        where: { id: tuningId },
        data: {
          status: 'COMPLETED',
          endTime: new Date()
        }
      });

      // Apply best parameters if improvement is significant
      if (bestScore > this.getBaselineScore(tuning.objective)) {
        await this.applyOptimizedParameters(tuning, bestParams as Record<string, any> || {});
      }

    } catch (error) {
      console.error('Error in optimization process:', error);
      await prisma.hyperparameterTuning.update({
        where: { id: tuningId },
        data: {
          status: 'FAILED',
          endTime: new Date()
        }
      });
    }
  }

  /**
   * Generate next parameters based on optimization method
   */
  private async generateNextParameters(
    method: TuningMethod,
    searchSpace: Record<string, any>,
    history: any[],
    iteration: number
  ): Promise<Record<string, any>> {
    switch (method) {
      case TuningMethod.BAYESIAN_OPTIMIZATION:
        return this.bayesianOptimization(searchSpace, history);
      case TuningMethod.GENETIC_ALGORITHM:
        return this.geneticAlgorithmStep(searchSpace, history, iteration);
      case TuningMethod.RANDOM_SEARCH:
        return this.randomSearch(searchSpace);
      case TuningMethod.GRID_SEARCH:
        return this.gridSearch(searchSpace, iteration);
      default:
        return this.randomSearch(searchSpace);
    }
  }

  /**
   * Bayesian Optimization implementation
   */
  private bayesianOptimization(searchSpace: Record<string, any>, history: any[]): Record<string, any> {
    if (history.length < 2) {
      return this.randomSearch(searchSpace);
    }

    // Simplified Bayesian optimization using acquisition function
    const nextParams: Record<string, any> = {};
    
    for (const [param, space] of Object.entries(searchSpace)) {
      if (space.type === 'continuous') {
        nextParams[param] = this.acquisitionFunction(param, space, history);
      } else if (space.type === 'discrete') {
        nextParams[param] = this.discreteAcquisitionFunction(param, space, history);
      }
    }

    return nextParams;
  }

  /**
   * Acquisition function for Bayesian optimization
   */
  private acquisitionFunction(param: string, space: any, history: any[]): number {
    // Expected Improvement acquisition function
    const { min, max } = space;
    const historicalValues = history.map(h => h.params[param]).filter(v => v !== undefined);
    const historicalScores = history.map(h => h.score);

    if (historicalValues.length === 0) {
      return min + Math.random() * (max - min);
    }

    // Find best performing regions
    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const bestScore = Math.max(...historicalScores);
    
    // Explore around best performing values with some randomness
    const bestParams = history[historicalScores.indexOf(bestScore)].params;
    const bestValue = bestParams[param] || mean;
    
    const exploration = (max - min) * 0.1 * (Math.random() - 0.5);
    const candidate = bestValue + exploration;
    
    return Math.max(min, Math.min(max, candidate));
  }

  /**
   * Discrete acquisition function
   */
  private discreteAcquisitionFunction(param: string, space: any, history: any[]): any {
    const { values } = space;
    
    if (history.length < 2) {
      return values[Math.floor(Math.random() * values.length)];
    }

    // Count performance for each discrete value
    const valuePerformance = values.reduce((acc: Record<string, number[]>, value: any) => {
      acc[value] = [];
      return acc;
    }, {});

    history.forEach(h => {
      const value = h.params[param];
      if (value !== undefined && valuePerformance[value]) {
        valuePerformance[value].push(h.score);
      }
    });

    // Select value with highest average performance (with exploration)
    let bestValue = values[0];
    let bestAvg = -Infinity;

    for (const [value, scores] of Object.entries(valuePerformance)) {
      const scoreArray = scores as number[];
      if (scoreArray.length === 0) {
        // Unexplored values get high priority
        return value;
      }
      
      const avg = scoreArray.reduce((a: number, b: number) => a + b, 0) / scoreArray.length;
      const exploration = Math.random() * 0.1; // Small exploration bonus
      
      if (avg + exploration > bestAvg) {
        bestAvg = avg + exploration;
        bestValue = value;
      }
    }

    return bestValue;
  }

  /**
   * Genetic Algorithm step
   */
  private geneticAlgorithmStep(
    searchSpace: Record<string, any>, 
    history: any[], 
    iteration: number
  ): Record<string, any> {
    const populationSize = 10;
    const mutationRate = 0.1;
    const crossoverRate = 0.8;

    if (history.length < populationSize) {
      return this.randomSearch(searchSpace);
    }

    // Select best individuals from history
    const sortedHistory = history.sort((a, b) => b.score - a.score);
    const parents = sortedHistory.slice(0, populationSize / 2);

    // Crossover
    const parent1 = parents[Math.floor(Math.random() * parents.length)];
    const parent2 = parents[Math.floor(Math.random() * parents.length)];
    
    const offspring: Record<string, any> = {};
    
    for (const param of Object.keys(searchSpace)) {
      if (Math.random() < crossoverRate) {
        offspring[param] = Math.random() < 0.5 ? parent1.params[param] : parent2.params[param];
      } else {
        offspring[param] = parent1.params[param];
      }
    }

    // Mutation
    for (const [param, space] of Object.entries(searchSpace)) {
      if (Math.random() < mutationRate) {
        if (space.type === 'continuous') {
          const { min, max } = space;
          offspring[param] = min + Math.random() * (max - min);
        } else if (space.type === 'discrete') {
          const { values } = space;
          offspring[param] = values[Math.floor(Math.random() * values.length)];
        }
      }
    }

    return offspring;
  }

  /**
   * Random search
   */
  private randomSearch(searchSpace: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const [param, space] of Object.entries(searchSpace)) {
      if (space.type === 'continuous') {
        const { min, max } = space;
        params[param] = min + Math.random() * (max - min);
      } else if (space.type === 'discrete') {
        const { values } = space;
        params[param] = values[Math.floor(Math.random() * values.length)];
      } else if (space.type === 'categorical') {
        const { categories } = space;
        params[param] = categories[Math.floor(Math.random() * categories.length)];
      }
    }
    
    return params;
  }

  /**
   * Grid search
   */
  private gridSearch(searchSpace: Record<string, any>, iteration: number): Record<string, any> {
    // Simplified grid search - would need proper grid generation
    const params: Record<string, any> = {};
    const gridSize = 10;
    
    for (const [param, space] of Object.entries(searchSpace)) {
      if (space.type === 'continuous') {
        const { min, max } = space;
        const step = (max - min) / gridSize;
        const index = iteration % gridSize;
        params[param] = min + index * step;
      } else if (space.type === 'discrete') {
        const { values } = space;
        const index = iteration % values.length;
        params[param] = values[index];
      }
    }
    
    return params;
  }

  /**
   * Evaluate parameters
   */
  private async evaluateParameters(
    params: Record<string, any>,
    objective: string,
    modelId?: string,
    agentId?: string
  ): Promise<number> {
    try {
      if (modelId) {
        return await this.evaluateModelParameters(modelId, params, objective);
      } else if (agentId) {
        return await this.evaluateAgentParameters(agentId, params, objective);
      } else {
        throw new Error('Either modelId or agentId must be provided');
      }
    } catch (error) {
      console.error('Error evaluating parameters:', error);
      return -Infinity;
    }
  }

  /**
   * Evaluate model parameters
   */
  private async evaluateModelParameters(
    modelId: string,
    params: Record<string, any>,
    objective: string
  ): Promise<number> {
    // Simulate model evaluation with new parameters
    // In practice, this would retrain/test the model with new parameters
    
    const simulatedMetrics = {
      accuracy: 0.7 + Math.random() * 0.3 - this.parameterPenalty(params),
      f1_score: 0.65 + Math.random() * 0.35 - this.parameterPenalty(params),
      precision: 0.68 + Math.random() * 0.32 - this.parameterPenalty(params),
      recall: 0.72 + Math.random() * 0.28 - this.parameterPenalty(params)
    };

    return simulatedMetrics[objective as keyof typeof simulatedMetrics] || simulatedMetrics.accuracy;
  }

  /**
   * Evaluate agent parameters
   */
  private async evaluateAgentParameters(
    agentId: string,
    params: Record<string, any>,
    objective: string
  ): Promise<number> {
    // Simulate agent evaluation with new parameters
    // In practice, this would run episodes with new parameters
    
    const simulatedMetrics = {
      avg_reward: 0.5 + Math.random() * 0.5 - this.parameterPenalty(params),
      success_rate: 0.6 + Math.random() * 0.4 - this.parameterPenalty(params),
      convergence_speed: 0.7 + Math.random() * 0.3 - this.parameterPenalty(params)
    };

    return simulatedMetrics[objective as keyof typeof simulatedMetrics] || simulatedMetrics.avg_reward;
  }

  /**
   * Calculate penalty for extreme parameter values
   */
  private parameterPenalty(params: Record<string, any>): number {
    // Penalize extreme parameter values to encourage stable configurations
    let penalty = 0;
    
    if (params.learning_rate && (params.learning_rate > 0.1 || params.learning_rate < 0.001)) {
      penalty += 0.1;
    }
    
    if (params.batch_size && (params.batch_size > 512 || params.batch_size < 8)) {
      penalty += 0.05;
    }
    
    return Math.min(penalty, 0.3); // Cap penalty at 0.3
  }

  /**
   * Detect convergence
   */
  private detectConvergence(history: any[], iteration: number): boolean {
    if (iteration < 10) return false;
    
    const recentScores = history.slice(-10).map(h => h.score);
    const variance = this.calculateVariance(recentScores);
    
    // Converged if variance is very low
    return variance < 0.001;
  }

  /**
   * Get baseline score for comparison
   */
  private getBaselineScore(objective: string): number {
    const baselines = {
      accuracy: 0.7,
      f1_score: 0.65,
      precision: 0.68,
      recall: 0.72,
      avg_reward: 0.5,
      success_rate: 0.6,
      convergence_speed: 0.7
    };
    
    return baselines[objective as keyof typeof baselines] || 0.7;
  }

  /**
   * Apply optimized parameters
   */
  private async applyOptimizedParameters(tuning: any, bestParams: Record<string, any>) {
    try {
      if (tuning.modelId) {
        // Update model configuration
        await prisma.mLModel.update({
          where: { id: tuning.modelId },
          data: {
            configParams: {
              ...((await prisma.mLModel.findUnique({ where: { id: tuning.modelId } }))?.configParams as object || {}),
              optimized: true,
              optimizedAt: new Date().toISOString(),
              ...bestParams
            }
          }
        });
      } else if (tuning.agentId) {
        // Update agent hyperparameters
        await prisma.rLAgent.update({
          where: { id: tuning.agentId },
          data: {
            hyperparameters: {
              ...((await prisma.rLAgent.findUnique({ where: { id: tuning.agentId } }))?.hyperparameters as object || {}),
              optimized: true,
              optimizedAt: new Date().toISOString(),
              ...bestParams
            }
          }
        });
      }
    } catch (error) {
      console.error('Error applying optimized parameters:', error);
    }
  }

  /**
   * Start AutoML experiment
   */
  async startAutoMLExperiment(
    config: AutoMLExperimentConfig,
    tenantId: string,
    userId?: string
  ): Promise<string> {
    try {
      const experiment = await prisma.autoMLExperiment.create({
        data: {
          name: config.name,
          description: config.description,
          experimentType: config.experimentType,
          dataset: config.dataset,
          objective: config.objective,
          constraints: config.constraints,
          searchSpace: config.searchSpace,
          maxTrials: config.maxTrials,
          timeLimit: config.timeLimit,
          tenantId,
          userId
        }
      });

      // Start the AutoML process
      this.runAutoMLProcess(experiment.id).catch(console.error);

      return experiment.id;
    } catch (error) {
      console.error('Error starting AutoML experiment:', error);
      throw new Error('Failed to start AutoML experiment');
    }
  }

  /**
   * Run AutoML process
   */
  private async runAutoMLProcess(experimentId: string) {
    try {
      const experiment = await prisma.autoMLExperiment.findUnique({
        where: { id: experimentId }
      });

      if (!experiment) {
        throw new Error('AutoML experiment not found');
      }

      const leaderboard = [];
      let bestModel = null;
      let bestScore = -Infinity;

      for (let trial = 0; trial < experiment.maxTrials; trial++) {
        // Generate model configuration based on experiment type
        const modelConfig = await this.generateModelConfiguration(
          experiment.experimentType as AutoMLType,
          experiment.searchSpace as Record<string, any>,
          experiment.dataset as Record<string, any>,
          trial
        );

        // Evaluate model configuration
        const score = await this.evaluateModelConfiguration(
          modelConfig,
          experiment.objective,
          experiment.dataset as Record<string, any>
        );

        leaderboard.push({
          modelConfig,
          score,
          rank: trial + 1,
          trial
        });

        if (score > bestScore) {
          bestScore = score;
          bestModel = modelConfig;
        }

        // Update experiment progress
        await prisma.autoMLExperiment.update({
          where: { id: experimentId },
          data: {
            totalTrials: trial + 1,
            bestModel: bestModel as any,
            bestScore,
            leaderboard: leaderboard.sort((a, b) => b.score - a.score) as any
          }
        });

        // Check time limit
        if (experiment.timeLimit) {
          const elapsedTime = Date.now() - experiment.startTime.getTime();
          if (elapsedTime > experiment.timeLimit * 60 * 1000) {
            break;
          }
        }
      }

      // Generate insights
      const insights = this.generateAutoMLInsights(leaderboard, experiment);

      // Mark as completed
      await prisma.autoMLExperiment.update({
        where: { id: experimentId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
          results: {
            insights,
            searchTime: Date.now() - experiment.startTime.getTime(),
            totalTrials: leaderboard.length
          }
        }
      });

    } catch (error) {
      console.error('Error in AutoML process:', error);
      await prisma.autoMLExperiment.update({
        where: { id: experimentId },
        data: {
          status: 'FAILED',
          endTime: new Date()
        }
      });
    }
  }

  /**
   * Generate model configuration for AutoML
   */
  private async generateModelConfiguration(
    experimentType: AutoMLType,
    searchSpace: Record<string, any>,
    dataset: Record<string, any>,
    trial: number
  ): Promise<Record<string, any>> {
    switch (experimentType) {
      case AutoMLType.NEURAL_ARCHITECTURE_SEARCH:
        return this.generateNeuralArchitecture(searchSpace, trial);
      case AutoMLType.AUTOML_PIPELINE:
        return this.generateMLPipeline(searchSpace, dataset, trial);
      case AutoMLType.FEATURE_SELECTION:
        return this.generateFeatureSelection(searchSpace, dataset, trial);
      case AutoMLType.HYPERPARAMETER_OPTIMIZATION:
        return this.generateHyperparameterConfig(searchSpace, trial);
      default:
        return this.generateGenericConfig(searchSpace, trial);
    }
  }

  /**
   * Generate neural architecture
   */
  private generateNeuralArchitecture(searchSpace: Record<string, any>, trial: number): Record<string, any> {
    const architectures = ['linear', 'cnn', 'rnn', 'transformer'];
    const activations = ['relu', 'tanh', 'sigmoid', 'leaky_relu'];
    const optimizers = ['adam', 'sgd', 'rmsprop'];

    return {
      architecture: architectures[trial % architectures.length],
      layers: 2 + Math.floor(Math.random() * 6), // 2-8 layers
      units_per_layer: [64, 128, 256, 512][Math.floor(Math.random() * 4)],
      activation: activations[Math.floor(Math.random() * activations.length)],
      optimizer: optimizers[Math.floor(Math.random() * optimizers.length)],
      learning_rate: 0.001 + Math.random() * 0.01,
      dropout: 0.1 + Math.random() * 0.4,
      batch_size: [16, 32, 64, 128][Math.floor(Math.random() * 4)]
    };
  }

  /**
   * Generate ML pipeline
   */
  private generateMLPipeline(searchSpace: Record<string, any>, dataset: Record<string, any>, trial: number): Record<string, any> {
    const algorithms = ['random_forest', 'gradient_boosting', 'svm', 'logistic_regression'];
    const preprocessors = ['standard_scaler', 'min_max_scaler', 'robust_scaler'];
    const feature_selectors = ['chi2', 'mutual_info', 'rfe'];

    return {
      algorithm: algorithms[trial % algorithms.length],
      preprocessor: preprocessors[Math.floor(Math.random() * preprocessors.length)],
      feature_selector: feature_selectors[Math.floor(Math.random() * feature_selectors.length)],
      feature_threshold: 0.1 + Math.random() * 0.4,
      cross_validation_folds: 3 + Math.floor(Math.random() * 7), // 3-10 folds
      test_size: 0.1 + Math.random() * 0.3 // 10-40% test size
    };
  }

  /**
   * Generate feature selection configuration
   */
  private generateFeatureSelection(searchSpace: Record<string, any>, dataset: Record<string, any>, trial: number): Record<string, any> {
    const methods = ['correlation', 'mutual_info', 'chi2', 'rfe', 'lasso'];
    const thresholds = [0.05, 0.1, 0.15, 0.2];

    return {
      method: methods[trial % methods.length],
      threshold: thresholds[Math.floor(Math.random() * thresholds.length)],
      max_features: Math.floor(0.1 + Math.random() * 0.9), // 10-100% of features
      cross_validate: Math.random() > 0.5
    };
  }

  /**
   * Generate hyperparameter configuration
   */
  private generateHyperparameterConfig(searchSpace: Record<string, any>, trial: number): Record<string, any> {
    return this.randomSearch(searchSpace);
  }

  /**
   * Generate generic configuration
   */
  private generateGenericConfig(searchSpace: Record<string, any>, trial: number): Record<string, any> {
    return this.randomSearch(searchSpace);
  }

  /**
   * Evaluate model configuration
   */
  private async evaluateModelConfiguration(
    config: Record<string, any>,
    objective: string,
    dataset: Record<string, any>
  ): Promise<number> {
    // Simulate model evaluation
    // In practice, this would train and evaluate the actual model
    
    let baseScore = 0.7;
    
    // Adjust score based on configuration quality
    if (config.architecture === 'transformer') baseScore += 0.05;
    if (config.optimizer === 'adam') baseScore += 0.02;
    if (config.learning_rate && config.learning_rate >= 0.001 && config.learning_rate <= 0.01) baseScore += 0.03;
    if (config.dropout && config.dropout >= 0.2 && config.dropout <= 0.5) baseScore += 0.02;
    
    // Add some randomness to simulate real evaluation variance
    const noise = (Math.random() - 0.5) * 0.1;
    
    return Math.max(0, Math.min(1, baseScore + noise));
  }

  /**
   * Generate AutoML insights
   */
  private generateAutoMLInsights(leaderboard: any[], experiment: any): string[] {
    const insights = [];
    
    // Best performing architecture
    const topModels = leaderboard.slice(0, 3);
    const architectures = topModels.map(m => m.modelConfig.architecture).filter(a => a);
    if (architectures.length > 0) {
      const mostCommon = this.getMostCommon(architectures);
      insights.push(`Best performing architecture: ${mostCommon}`);
    }
    
    // Hyperparameter insights
    const topLearningRates = topModels.map(m => m.modelConfig.learning_rate).filter(lr => lr);
    if (topLearningRates.length > 0) {
      const avgLR = topLearningRates.reduce((a, b) => a + b, 0) / topLearningRates.length;
      insights.push(`Optimal learning rate range: ${(avgLR * 0.8).toFixed(4)} - ${(avgLR * 1.2).toFixed(4)}`);
    }
    
    // Performance insights
    const scores = leaderboard.map(m => m.score);
    const bestScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    insights.push(`Best score achieved: ${bestScore.toFixed(3)} (${((bestScore - avgScore) / avgScore * 100).toFixed(1)}% above average)`);
    
    return insights;
  }

  /**
   * Get optimization metrics
   */
  async getOptimizationMetrics(tenantId: string) {
    try {
      const hyperparameterTuning = await prisma.hyperparameterTuning.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const automlExperiments = await prisma.autoMLExperiment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const completedTuning = hyperparameterTuning.filter(t => t.status === 'COMPLETED');
      const completedExperiments = automlExperiments.filter(e => e.status === 'COMPLETED');

      return {
        totalOptimizations: hyperparameterTuning.length + automlExperiments.length,
        completedOptimizations: completedTuning.length + completedExperiments.length,
        avgImprovement: this.calculateAverageImprovement(completedTuning, completedExperiments),
        successRate: (completedTuning.length + completedExperiments.length) / Math.max(hyperparameterTuning.length + automlExperiments.length, 1),
        optimizationMethods: this.getOptimizationMethodDistribution(hyperparameterTuning),
        recentOptimizations: [...completedTuning, ...completedExperiments]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting optimization metrics:', error);
      throw new Error('Failed to get optimization metrics');
    }
  }

  /**
   * Helper Methods
   */

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private getMostCommon(array: string[]): string {
    const counts = array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  }

  private calculateAverageImprovement(tuning: any[], experiments: any[]): number {
    const improvements: number[] = [];
    
    tuning.forEach(t => {
      if (t.bestScore && t.bestScore > this.getBaselineScore(t.objective)) {
        improvements.push((t.bestScore - this.getBaselineScore(t.objective)) / this.getBaselineScore(t.objective));
      }
    });
    
    experiments.forEach(e => {
      if (e.bestScore && e.bestScore > this.getBaselineScore(e.objective)) {
        improvements.push((e.bestScore - this.getBaselineScore(e.objective)) / this.getBaselineScore(e.objective));
      }
    });
    
    return improvements.length > 0 ? improvements.reduce((a, b) => a + b, 0) / improvements.length : 0;
  }

  private getOptimizationMethodDistribution(tuning: any[]) {
    return tuning.reduce((acc, t) => {
      acc[t.tuningMethod] = (acc[t.tuningMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
