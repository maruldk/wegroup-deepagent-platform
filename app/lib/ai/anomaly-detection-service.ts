
/**
 * Anomaly Detection Service - Real-time anomaly detection for weGROUP DeepAgent Platform
 * Detects anomalies in financial data, project metrics, customer behavior, and performance data
 */

import { Matrix } from 'ml-matrix';
import { median, standardDeviation, mean, quantile } from 'simple-statistics';

// Simple euclidean distance implementation
const euclidean = (a: number[], b: number[]): number => {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};
import {
  MLAnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  MLAnomalyResult,
  MLAnomalyDetectionItem
} from '@/lib/types';
import { prisma } from '@/lib/db';

export class AnomalyDetectionService {
  private tenantId: string;
  private userId?: string;

  constructor(tenantId: string, userId?: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // ==================== FINANCIAL ANOMALY DETECTION ====================

  /**
   * Detect anomalies in financial transactions
   */
  async detectFinancialAnomalies(): Promise<MLAnomalyDetectionItem[]> {
    try {
      const recentTransactions = await this.getRecentTransactions();
      const anomalies: MLAnomalyDetectionItem[] = [];

      // Detect unusual transaction amounts
      const amountAnomalies = await this.detectTransactionAmountAnomalies(recentTransactions);
      anomalies.push(...amountAnomalies);

      // Detect unusual transaction patterns
      const patternAnomalies = await this.detectTransactionPatternAnomalies(recentTransactions);
      anomalies.push(...patternAnomalies);

      // Detect budget overruns
      const budgetAnomalies = await this.detectBudgetAnomalies();
      anomalies.push(...budgetAnomalies);

      return anomalies;

    } catch (error) {
      console.error('Financial anomaly detection error:', error);
      throw new Error(`Failed to detect financial anomalies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getRecentTransactions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await prisma.transaction.findMany({
      where: {
        tenantId: this.tenantId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'desc' }
    });
  }

  private async detectTransactionAmountAnomalies(transactions: any[]): Promise<MLAnomalyDetectionItem[]> {
    if (transactions.length < 10) return [];

    const amounts = transactions.map(t => Math.abs(t.amount));
    const anomalies: MLAnomalyDetectionItem[] = [];

    // Use Interquartile Range (IQR) method for outlier detection
    const q1 = quantile(amounts, 0.25);
    const q3 = quantile(amounts, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Also use Z-score method
    const meanAmount = mean(amounts);
    const stdDev = standardDeviation(amounts);
    const zScoreThreshold = 2.5;

    for (const transaction of transactions) {
      const amount = Math.abs(transaction.amount);
      const zScore = Math.abs((amount - meanAmount) / stdDev);
      
      let isAnomaly = false;
      let severity: AnomalySeverity = 'LOW';
      let anomalyScore = 0;

      // IQR-based detection
      if (amount < lowerBound || amount > upperBound) {
        isAnomaly = true;
        anomalyScore += 0.4;
      }

      // Z-score based detection
      if (zScore > zScoreThreshold) {
        isAnomaly = true;
        anomalyScore += 0.6;
        
        if (zScore > 4) severity = 'CRITICAL';
        else if (zScore > 3) severity = 'HIGH';
        else severity = 'MEDIUM';
      }

      if (isAnomaly) {
        const explanation = `Transaction amount ${amount.toFixed(2)} is unusual (Z-score: ${zScore.toFixed(2)})`;
        const recommendations = this.generateFinancialRecommendations(transaction, 'amount');

        const anomaly = await this.createAnomalyRecord({
          anomalyType: 'FINANCIAL',
          dataSource: 'transactions',
          inputData: transaction,
          anomalyScore: Math.min(1, anomalyScore),
          threshold: zScoreThreshold,
          isAnomaly: true,
          severity,
          description: `Unusual transaction amount detected: ${transaction.description}`,
          explanation,
          recommendations,
          detectionMethod: 'IQR_ZSCORE',
          resourceType: 'TRANSACTION',
          resourceId: transaction.id
        });

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  private async detectTransactionPatternAnomalies(transactions: any[]): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];

    // Group transactions by category
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    for (const [category, categoryTransactions] of categoryGroups.entries()) {
      if (categoryTransactions.length < 5) continue;

      // Detect frequency anomalies
      const frequencyAnomaly = await this.detectFrequencyAnomaly(category, categoryTransactions);
      if (frequencyAnomaly) anomalies.push(frequencyAnomaly);

      // Detect timing anomalies
      const timingAnomalies = await this.detectTimingAnomalies(category, categoryTransactions);
      anomalies.push(...timingAnomalies);
    }

    return anomalies;
  }

  private groupTransactionsByCategory(transactions: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Unknown';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(transaction);
    });

    return groups;
  }

  private async detectFrequencyAnomaly(category: string, transactions: any[]): Promise<MLAnomalyDetectionItem | null> {
    // Get historical frequency for this category
    const historicalFrequency = await this.getHistoricalCategoryFrequency(category);
    const currentFrequency = transactions.length;

    if (historicalFrequency === 0) return null;

    const frequencyRatio = currentFrequency / historicalFrequency;
    
    // Detect significant increases or decreases
    if (frequencyRatio > 2.0 || frequencyRatio < 0.5) {
      const severity: AnomalySeverity = frequencyRatio > 3.0 || frequencyRatio < 0.3 ? 'HIGH' : 'MEDIUM';
      const isIncrease = frequencyRatio > 1;
      
      return await this.createAnomalyRecord({
        anomalyType: 'FINANCIAL',
        dataSource: 'transaction_patterns',
        inputData: { category, currentFrequency, historicalFrequency, ratio: frequencyRatio },
        anomalyScore: Math.min(1, Math.abs(Math.log(frequencyRatio)) / 2),
        threshold: 2.0,
        isAnomaly: true,
        severity,
        description: `Unusual transaction frequency in category: ${category}`,
        explanation: `${isIncrease ? 'Increase' : 'Decrease'} of ${Math.abs(frequencyRatio - 1) * 100}% in transaction frequency`,
        recommendations: this.generateFrequencyRecommendations(category, isIncrease),
        detectionMethod: 'FREQUENCY_ANALYSIS',
        resourceType: 'TRANSACTION_CATEGORY',
        resourceId: category
      });
    }

    return null;
  }

  private async detectTimingAnomalies(category: string, transactions: any[]): Promise<MLAnomalyDetectionItem[]> {
    const anomalyPromises: Promise<MLAnomalyDetectionItem>[] = [];

    // Detect transactions at unusual times
    const hourCounts = new Array(24).fill(0);
    transactions.forEach(transaction => {
      const hour = new Date(transaction.date).getHours();
      hourCounts[hour]++;
    });

    // Find hours with unusual activity
    const avgHourlyCount = mean(hourCounts.filter(count => count > 0));
    const stdDevHourly = standardDeviation(hourCounts.filter(count => count > 0));

    hourCounts.forEach((count, hour) => {
      if (count === 0) return;
      
      const zScore = Math.abs((count - avgHourlyCount) / stdDevHourly);
      
      if (zScore > 2 && (hour < 6 || hour > 22)) { // Unusual activity during off hours
        anomalyPromises.push(this.createAnomalyRecord({
          anomalyType: 'FINANCIAL',
          dataSource: 'transaction_timing',
          inputData: { category, hour, count, avgCount: avgHourlyCount },
          anomalyScore: Math.min(1, zScore / 3),
          threshold: 2.0,
          isAnomaly: true,
          severity: 'MEDIUM',
          description: `Unusual transaction timing detected in category: ${category}`,
          explanation: `${count} transactions at ${hour}:00, significantly above normal`,
          recommendations: ['Review transaction authenticity', 'Check for automated processes'],
          detectionMethod: 'TIMING_ANALYSIS',
          resourceType: 'TRANSACTION_TIMING',
          resourceId: `${category}_${hour}`
        }));
      }
    });

    return Promise.all(anomalyPromises);
  }

  private async detectBudgetAnomalies(): Promise<MLAnomalyDetectionItem[]> {
    const budgets = await prisma.budget.findMany({
      where: { 
        tenantId: this.tenantId,
        endDate: { gte: new Date() }
      }
    });

    const anomalies: MLAnomalyDetectionItem[] = [];

    for (const budget of budgets) {
      const spentRatio = budget.spentAmount / budget.budgetAmount;
      
      if (spentRatio > 0.9) { // 90% or more of budget spent
        const daysRemaining = Math.ceil((budget.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedSpentRatio = 1 - (daysRemaining / totalDays);
        
        if (spentRatio > expectedSpentRatio + 0.2) { // Spending ahead of schedule
          const severity: AnomalySeverity = spentRatio > 1 ? 'CRITICAL' : 'HIGH';
          
          anomalies.push(await this.createAnomalyRecord({
            anomalyType: 'FINANCIAL',
            dataSource: 'budget_tracking',
            inputData: budget,
            anomalyScore: Math.min(1, spentRatio),
            threshold: 0.9,
            isAnomaly: true,
            severity,
            description: `Budget overrun detected: ${budget.name}`,
            explanation: `${(spentRatio * 100).toFixed(1)}% of budget spent with ${daysRemaining} days remaining`,
            recommendations: [
              'Review and approve remaining expenditures',
              'Consider budget reallocation',
              'Implement spending controls'
            ],
            detectionMethod: 'BUDGET_ANALYSIS',
            resourceType: 'BUDGET',
            resourceId: budget.id
          }));
        }
      }
    }

    return anomalies;
  }

  // ==================== PROJECT ANOMALY DETECTION ====================

  /**
   * Detect anomalies in project performance
   */
  async detectProjectAnomalies(): Promise<MLAnomalyDetectionItem[]> {
    try {
      const activeProjects = await this.getActiveProjects();
      const anomalies: MLAnomalyDetectionItem[] = [];

      for (const project of activeProjects) {
        // Detect timeline anomalies
        const timelineAnomalies = await this.detectProjectTimelineAnomalies(project);
        anomalies.push(...timelineAnomalies);

        // Detect resource utilization anomalies
        const resourceAnomalies = await this.detectResourceUtilizationAnomalies(project);
        anomalies.push(...resourceAnomalies);

        // Detect task completion anomalies
        const taskAnomalies = await this.detectTaskCompletionAnomalies(project);
        anomalies.push(...taskAnomalies);
      }

      return anomalies;

    } catch (error) {
      console.error('Project anomaly detection error:', error);
      throw new Error(`Failed to detect project anomalies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getActiveProjects() {
    return await prisma.project.findMany({
      where: {
        tenantId: this.tenantId,
        status: { in: ['PLANNING', 'ACTIVE'] }
      },
      include: {
        tasks: {
          include: {
            timesheets: true
          }
        },
        timesheets: true
      }
    });
  }

  private async detectProjectTimelineAnomalies(project: any): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];

    if (!project.endDate) return anomalies;

    const now = new Date();
    const endDate = new Date(project.endDate);
    const startDate = new Date(project.startDate || project.createdAt);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progressRatio = elapsed / totalDuration;

    // Calculate task completion ratio
    const completedTasks = project.tasks.filter((task: any) => task.status === 'DONE').length;
    const totalTasks = project.tasks.length;
    const taskCompletionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Detect if project is behind schedule
    if (progressRatio > 0.5 && taskCompletionRatio < progressRatio - 0.3) {
      const delayScore = (progressRatio - taskCompletionRatio) / progressRatio;
      
      anomalies.push(await this.createAnomalyRecord({
        anomalyType: 'PROJECT',
        dataSource: 'project_timeline',
        inputData: { 
          projectId: project.id, 
          progressRatio, 
          taskCompletionRatio, 
          delayScore 
        },
        anomalyScore: Math.min(1, delayScore),
        threshold: 0.3,
        isAnomaly: true,
        severity: delayScore > 0.5 ? 'HIGH' : 'MEDIUM',
        description: `Project timeline delay detected: ${project.name}`,
        explanation: `Project is ${(delayScore * 100).toFixed(1)}% behind expected progress`,
        recommendations: [
          'Review critical path and dependencies',
          'Reallocate resources to delayed tasks',
          'Consider timeline adjustment'
        ],
        detectionMethod: 'TIMELINE_ANALYSIS',
        resourceType: 'PROJECT',
        resourceId: project.id
      }));
    }

    return anomalies;
  }

  private async detectResourceUtilizationAnomalies(project: any): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];
    
    // Analyze timesheet data for unusual patterns
    const recentTimesheets = project.timesheets.filter((ts: any) => {
      const tsDate = new Date(ts.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return tsDate >= weekAgo;
    });

    if (recentTimesheets.length === 0) return anomalies;

    // Group by user
    const userHours = new Map<string, number>();
    recentTimesheets.forEach((ts: any) => {
      const existing = userHours.get(ts.userId) || 0;
      userHours.set(ts.userId, existing + ts.hours);
    });

    // Detect overutilization
    for (const [userId, hours] of userHours.entries()) {
      if (hours > 60) { // More than 60 hours per week
        anomalies.push(await this.createAnomalyRecord({
          anomalyType: 'PROJECT',
          dataSource: 'resource_utilization',
          inputData: { projectId: project.id, userId, weeklyHours: hours },
          anomalyScore: Math.min(1, hours / 80),
          threshold: 60,
          isAnomaly: true,
          severity: hours > 80 ? 'CRITICAL' : 'HIGH',
          description: `Resource overutilization detected in project: ${project.name}`,
          explanation: `Team member logged ${hours} hours in the past week`,
          recommendations: [
            'Review workload distribution',
            'Consider additional resources',
            'Monitor for burnout risk'
          ],
          detectionMethod: 'RESOURCE_ANALYSIS',
          resourceType: 'USER_PROJECT',
          resourceId: `${userId}_${project.id}`
        }));
      }
    }

    return anomalies;
  }

  private async detectTaskCompletionAnomalies(project: any): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];
    
    // Detect tasks that are taking much longer than estimated
    for (const task of project.tasks) {
      if (task.status !== 'DONE' || !task.estimatedHours || !task.actualHours) continue;
      
      const overrunRatio = task.actualHours / task.estimatedHours;
      
      if (overrunRatio > 2.0) { // Task took more than double the estimated time
        anomalies.push(await this.createAnomalyRecord({
          anomalyType: 'PROJECT',
          dataSource: 'task_completion',
          inputData: { 
            taskId: task.id, 
            estimatedHours: task.estimatedHours, 
            actualHours: task.actualHours,
            overrunRatio 
          },
          anomalyScore: Math.min(1, overrunRatio / 3),
          threshold: 2.0,
          isAnomaly: true,
          severity: overrunRatio > 3 ? 'HIGH' : 'MEDIUM',
          description: `Task completion anomaly detected: ${task.name}`,
          explanation: `Task took ${overrunRatio.toFixed(1)}x longer than estimated`,
          recommendations: [
            'Review task estimation accuracy',
            'Analyze completion blockers',
            'Update estimation guidelines'
          ],
          detectionMethod: 'TASK_ANALYSIS',
          resourceType: 'TASK',
          resourceId: task.id
        }));
      }
    }

    return anomalies;
  }

  // ==================== CUSTOMER BEHAVIOR ANOMALY DETECTION ====================

  /**
   * Detect anomalies in customer behavior patterns
   */
  async detectCustomerBehaviorAnomalies(): Promise<MLAnomalyDetectionItem[]> {
    try {
      const customers = await this.getCustomersWithRecentActivity();
      const anomalies: MLAnomalyDetectionItem[] = [];

      for (const customer of customers) {
        // Detect purchase pattern anomalies
        const purchaseAnomalies = await this.detectPurchasePatternAnomalies(customer);
        anomalies.push(...purchaseAnomalies);

        // Detect engagement anomalies
        const engagementAnomalies = await this.detectEngagementAnomalies(customer);
        anomalies.push(...engagementAnomalies);
      }

      return anomalies;

    } catch (error) {
      console.error('Customer behavior anomaly detection error:', error);
      throw new Error(`Failed to detect customer behavior anomalies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getCustomersWithRecentActivity() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return await prisma.customer.findMany({
      where: {
        tenantId: this.tenantId,
        OR: [
          {
            invoices: {
              some: {
                issueDate: { gte: threeMonthsAgo }
              }
            }
          },
          {
            contactHistories: {
              some: {
                createdAt: { gte: threeMonthsAgo }
              }
            }
          }
        ]
      },
      include: {
        invoices: {
          orderBy: { issueDate: 'desc' }
        },
        contactHistories: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  private async detectPurchasePatternAnomalies(customer: any): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];
    const invoices = customer.invoices;

    if (invoices.length < 3) return anomalies;

    // Calculate purchase intervals
    const intervals = [];
    for (let i = 0; i < invoices.length - 1; i++) {
      const days = (new Date(invoices[i].issueDate).getTime() - new Date(invoices[i + 1].issueDate).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = mean(intervals);
    const stdInterval = standardDeviation(intervals);
    const lastInterval = intervals[0];

    // Detect significant deviation in purchase timing
    if (Math.abs(lastInterval - avgInterval) > 2 * stdInterval && lastInterval > avgInterval * 2) {
      anomalies.push(await this.createAnomalyRecord({
        anomalyType: 'CUSTOMER_BEHAVIOR',
        dataSource: 'purchase_patterns',
        inputData: { 
          customerId: customer.id, 
          lastInterval, 
          avgInterval, 
          deviation: Math.abs(lastInterval - avgInterval) 
        },
        anomalyScore: Math.min(1, Math.abs(lastInterval - avgInterval) / (3 * stdInterval)),
        threshold: 2 * stdInterval,
        isAnomaly: true,
        severity: lastInterval > avgInterval * 3 ? 'HIGH' : 'MEDIUM',
        description: `Unusual purchase timing detected for customer: ${customer.companyName}`,
        explanation: `${lastInterval.toFixed(0)} days since last purchase, ${(lastInterval / avgInterval).toFixed(1)}x longer than usual`,
        recommendations: [
          'Reach out to customer for feedback',
          'Offer re-engagement promotion',
          'Check for service issues'
        ],
        detectionMethod: 'PURCHASE_TIMING_ANALYSIS',
        resourceType: 'CUSTOMER',
        resourceId: customer.id
      }));
    }

    return anomalies;
  }

  private async detectEngagementAnomalies(customer: any): Promise<MLAnomalyDetectionItem[]> {
    const anomalies: MLAnomalyDetectionItem[] = [];
    const contacts = customer.contactHistories;

    // Calculate historical contact frequency
    const recentContacts = contacts.filter((contact: any) => {
      const contactDate = new Date(contact.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return contactDate >= thirtyDaysAgo;
    });

    const historicalMonthlyContacts = Math.max(1, contacts.length / 12); // Assume 12 months of history
    const currentMonthlyContacts = recentContacts.length;

    // Detect significant drop in engagement
    if (currentMonthlyContacts < historicalMonthlyContacts * 0.3) {
      anomalies.push(await this.createAnomalyRecord({
        anomalyType: 'CUSTOMER_BEHAVIOR',
        dataSource: 'customer_engagement',
        inputData: { 
          customerId: customer.id, 
          currentContacts: currentMonthlyContacts, 
          historicalContacts: historicalMonthlyContacts 
        },
        anomalyScore: 1 - (currentMonthlyContacts / historicalMonthlyContacts),
        threshold: 0.3,
        isAnomaly: true,
        severity: currentMonthlyContacts === 0 ? 'HIGH' : 'MEDIUM',
        description: `Decreased customer engagement detected: ${customer.companyName}`,
        explanation: `Contact frequency dropped by ${((1 - currentMonthlyContacts / historicalMonthlyContacts) * 100).toFixed(0)}%`,
        recommendations: [
          'Schedule check-in call',
          'Send satisfaction survey',
          'Review account health'
        ],
        detectionMethod: 'ENGAGEMENT_ANALYSIS',
        resourceType: 'CUSTOMER',
        resourceId: customer.id
      }));
    }

    return anomalies;
  }

  // ==================== UTILITY METHODS ====================

  private async createAnomalyRecord(data: {
    anomalyType: MLAnomalyType;
    dataSource: string;
    inputData: any;
    anomalyScore: number;
    threshold: number;
    isAnomaly: boolean;
    severity: AnomalySeverity;
    description: string;
    explanation?: string;
    recommendations?: string[];
    detectionMethod: string;
    resourceType?: string;
    resourceId?: string;
  }): Promise<MLAnomalyDetectionItem> {
    const anomaly = await prisma.mLAnomalyDetection.create({
      data: {
        ...data,
        recommendations: data.recommendations || [],
        status: 'OPEN',
        tenantId: this.tenantId,
        userId: this.userId,
      }
    });

    return anomaly as MLAnomalyDetectionItem;
  }

  private async getHistoricalCategoryFrequency(category: string): Promise<number> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        tenantId: this.tenantId,
        category,
        date: {
          gte: sixMonthsAgo,
          lt: threeMonthsAgo
        }
      }
    });

    return historicalTransactions.length / 3; // Average per month
  }

  private generateFinancialRecommendations(transaction: any, type: 'amount' | 'timing'): string[] {
    const recommendations = [];

    if (type === 'amount') {
      if (transaction.type === 'EXPENSE' && transaction.amount > 10000) {
        recommendations.push('Verify large expense authorization');
        recommendations.push('Review supporting documentation');
      } else if (transaction.type === 'INCOME' && transaction.amount > 50000) {
        recommendations.push('Confirm large payment receipt');
        recommendations.push('Update cash flow projections');
      }
    }

    recommendations.push('Monitor for similar unusual transactions');
    return recommendations;
  }

  private generateFrequencyRecommendations(category: string, isIncrease: boolean): string[] {
    if (isIncrease) {
      return [
        `Investigate cause of increased ${category} transactions`,
        'Review budget allocations for this category',
        'Monitor for unauthorized activities'
      ];
    } else {
      return [
        `Investigate cause of decreased ${category} transactions`,
        'Check for process changes or issues',
        'Verify business operations continuity'
      ];
    }
  }

  /**
   * Get all anomalies for tenant
   */
  async getAllAnomalies(filters?: {
    anomalyType?: MLAnomalyType;
    severity?: AnomalySeverity;
    status?: AnomalyStatus;
    limit?: number;
  }): Promise<MLAnomalyDetectionItem[]> {
    const anomalies = await prisma.mLAnomalyDetection.findMany({
      where: {
        tenantId: this.tenantId,
        ...filters,
      },
      orderBy: { detectedAt: 'desc' },
      take: filters?.limit || 50
    });

    return anomalies as MLAnomalyDetectionItem[];
  }

  /**
   * Acknowledge an anomaly
   */
  async acknowledgeAnomaly(anomalyId: string, userId: string): Promise<MLAnomalyDetectionItem> {
    const anomaly = await prisma.mLAnomalyDetection.update({
      where: { id: anomalyId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        userId
      }
    });

    return anomaly as MLAnomalyDetectionItem;
  }

  /**
   * Mark anomaly as resolved
   */
  async resolveAnomaly(anomalyId: string, userId: string): Promise<MLAnomalyDetectionItem> {
    const anomaly = await prisma.mLAnomalyDetection.update({
      where: { id: anomalyId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        userId
      }
    });

    return anomaly as MLAnomalyDetectionItem;
  }

  /**
   * Mark anomaly as false positive
   */
  async markAsFalsePositive(anomalyId: string, userId: string): Promise<MLAnomalyDetectionItem> {
    const anomaly = await prisma.mLAnomalyDetection.update({
      where: { id: anomalyId },
      data: {
        status: 'FALSE_POSITIVE',
        falsePositive: true,
        userId
      }
    });

    return anomaly as MLAnomalyDetectionItem;
  }

  /**
   * Run comprehensive anomaly detection across all systems
   */
  async runComprehensiveDetection(): Promise<{
    financial: MLAnomalyDetectionItem[];
    project: MLAnomalyDetectionItem[];
    customer: MLAnomalyDetectionItem[];
    total: number;
  }> {
    const [financial, project, customer] = await Promise.all([
      this.detectFinancialAnomalies(),
      this.detectProjectAnomalies(),
      this.detectCustomerBehaviorAnomalies()
    ]);

    return {
      financial,
      project,
      customer,
      total: financial.length + project.length + customer.length
    };
  }
}
