
/**
 * Feature Engineering Service - Data preprocessing and feature extraction
 * Handles data cleaning, transformation, normalization, and feature creation
 */

import { Matrix } from 'ml-matrix';
import { mean, standardDeviation, median, max, min } from 'simple-statistics';
import { 
  MLFeatureType,
  MLFeatureConfig,
  MLTrainingData,
  DataQualityMetrics
} from '@/lib/types';
import { prisma } from '@/lib/db';

export class FeatureEngineeringService {
  private tenantId: string;
  private userId?: string;

  constructor(tenantId: string, userId?: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // ==================== DATA EXTRACTION ====================

  /**
   * Extract features for sales forecasting
   */
  async extractSalesFeatures(startDate?: Date, endDate?: Date): Promise<MLTrainingData> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year default

    // Get invoices data
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: this.tenantId,
        issueDate: {
          gte: start,
          lte: end
        },
        status: { in: ['PAID', 'SENT'] }
      },
      include: {
        items: true,
        customer: true
      },
      orderBy: { issueDate: 'asc' }
    });

    // Group by month and extract features
    const monthlyData = this.groupInvoicesByMonth(invoices);
    const features: number[][] = [];
    const targets: number[] = [];
    const featureNames = [
      'month_index',
      'month_of_year',
      'quarter',
      'is_holiday_season',
      'invoice_count',
      'avg_invoice_amount',
      'unique_customers',
      'revenue_growth_rate',
      'customer_retention_rate',
      'avg_items_per_invoice'
    ];

    monthlyData.forEach((monthData, index) => {
      const monthFeatures = [
        index, // Month index
        monthData.month, // Month of year (1-12)
        Math.ceil(monthData.month / 3), // Quarter
        this.isHolidaySeason(monthData.month) ? 1 : 0,
        monthData.invoiceCount,
        monthData.avgInvoiceAmount,
        monthData.uniqueCustomers,
        index > 0 ? (monthData.totalRevenue - monthlyData[index - 1].totalRevenue) / monthlyData[index - 1].totalRevenue : 0,
        monthData.customerRetentionRate,
        monthData.avgItemsPerInvoice
      ];

      features.push(monthFeatures);
      targets.push(monthData.totalRevenue);
    });

    return {
      features,
      target: targets,
      featureNames,
      targetName: 'total_revenue',
      sampleCount: features.length
    };
  }

  /**
   * Extract features for cash flow prediction
   */
  async extractCashFlowFeatures(startDate?: Date, endDate?: Date): Promise<MLTrainingData> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months default

    // Get transactions data
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: this.tenantId,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'asc' }
    });

    // Group by week and extract features
    const weeklyData = this.groupTransactionsByWeek(transactions);
    const features: number[][] = [];
    const targets: number[] = [];
    const featureNames = [
      'week_index',
      'week_of_year',
      'month',
      'is_month_end',
      'income_count',
      'expense_count',
      'avg_income',
      'avg_expense',
      'income_variance',
      'expense_variance',
      'net_flow_trend'
    ];

    weeklyData.forEach((weekData, index) => {
      const weekFeatures = [
        index, // Week index
        weekData.weekOfYear,
        weekData.month,
        weekData.isMonthEnd ? 1 : 0,
        weekData.incomeCount,
        weekData.expenseCount,
        weekData.avgIncome,
        weekData.avgExpense,
        weekData.incomeVariance,
        weekData.expenseVariance,
        index > 0 ? weekData.netFlow - weeklyData[index - 1].netFlow : 0
      ];

      features.push(weekFeatures);
      targets.push(weekData.netFlow);
    });

    return {
      features,
      target: targets,
      featureNames,
      targetName: 'net_cash_flow',
      sampleCount: features.length
    };
  }

  /**
   * Extract features for project timeline prediction
   */
  async extractProjectFeatures(projectId?: string): Promise<MLTrainingData> {
    const whereClause: any = {
      tenantId: this.tenantId,
      status: { in: ['COMPLETED', 'CANCELLED'] } // Only completed projects for training
    };

    if (projectId) {
      whereClause.id = projectId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: {
          include: {
            timesheets: true
          }
        },
        members: true
      }
    });

    const features: number[][] = [];
    const targets: number[] = [];
    const featureNames = [
      'total_tasks',
      'team_size',
      'avg_task_complexity',
      'high_priority_tasks_ratio',
      'estimated_hours_total',
      'budget_amount',
      'start_month',
      'start_quarter',
      'dependencies_count',
      'external_dependencies_ratio'
    ];

    projects.forEach(project => {
      if (!project.startDate || !project.endDate) return;

      const projectFeatures = this.extractSingleProjectFeatures(project);
      const actualDuration = (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);

      features.push(projectFeatures);
      targets.push(actualDuration);
    });

    return {
      features,
      target: targets,
      featureNames,
      targetName: 'project_duration_days',
      sampleCount: features.length
    };
  }

  /**
   * Extract features for customer behavior analysis
   */
  async extractCustomerFeatures(): Promise<MLTrainingData> {
    const customers = await prisma.customer.findMany({
      where: { tenantId: this.tenantId },
      include: {
        invoices: {
          orderBy: { issueDate: 'asc' }
        },
        contactHistories: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const features: number[][] = [];
    const targets: number[] = [];
    const featureNames = [
      'total_revenue',
      'invoice_count',
      'avg_invoice_amount',
      'days_since_first_purchase',
      'days_since_last_purchase',
      'purchase_frequency',
      'contact_frequency',
      'avg_days_between_purchases',
      'revenue_trend',
      'seasonal_buyer'
    ];

    customers.forEach(customer => {
      const customerFeatures = this.extractSingleCustomerFeatures(customer);
      if (customerFeatures.length === featureNames.length) {
        features.push(customerFeatures);
        
        // Target: customer value score (0-1)
        const valueScore = this.calculateCustomerValueScore(customer);
        targets.push(valueScore);
      }
    });

    return {
      features,
      target: targets,
      featureNames,
      targetName: 'customer_value_score',
      sampleCount: features.length
    };
  }

  // ==================== DATA PREPROCESSING ====================

  /**
   * Normalize numerical features using min-max scaling
   */
  normalizeFeatures(data: number[][], method: 'minmax' | 'zscore' = 'minmax'): {
    normalizedData: number[][];
    scalingParams: any;
  } {
    if (data.length === 0 || data[0].length === 0) {
      throw new Error('Empty data provided for normalization');
    }

    const numFeatures = data[0].length;
    const scalingParams: any = {};
    const normalizedData: number[][] = [];

    if (method === 'minmax') {
      // Calculate min and max for each feature
      for (let feature = 0; feature < numFeatures; feature++) {
        const values = data.map(row => row[feature]);
        const minVal = min(values);
        const maxVal = max(values);
        
        scalingParams[feature] = { min: minVal, max: maxVal, range: maxVal - minVal };
      }

      // Normalize data
      data.forEach((row, rowIndex) => {
        normalizedData[rowIndex] = [];
        row.forEach((value, colIndex) => {
          const params = scalingParams[colIndex];
          if (params.range === 0) {
            normalizedData[rowIndex][colIndex] = 0; // Handle case where all values are the same
          } else {
            normalizedData[rowIndex][colIndex] = (value - params.min) / params.range;
          }
        });
      });
    } else if (method === 'zscore') {
      // Calculate mean and standard deviation for each feature
      for (let feature = 0; feature < numFeatures; feature++) {
        const values = data.map(row => row[feature]);
        const meanVal = mean(values);
        const stdVal = standardDeviation(values);
        
        scalingParams[feature] = { mean: meanVal, std: stdVal };
      }

      // Normalize data
      data.forEach((row, rowIndex) => {
        normalizedData[rowIndex] = [];
        row.forEach((value, colIndex) => {
          const params = scalingParams[colIndex];
          if (params.std === 0) {
            normalizedData[rowIndex][colIndex] = 0; // Handle case where all values are the same
          } else {
            normalizedData[rowIndex][colIndex] = (value - params.mean) / params.std;
          }
        });
      });
    }

    return { normalizedData, scalingParams };
  }

  /**
   * Handle missing values in dataset
   */
  handleMissingValues(data: (number | null)[][], strategy: 'mean' | 'median' | 'mode' | 'drop' = 'mean'): number[][] {
    if (strategy === 'drop') {
      return data.filter(row => !row.some(value => value === null || value === undefined)) as number[][];
    }

    const numFeatures = data[0]?.length || 0;
    const fillValues: number[] = [];

    // Calculate fill values for each feature
    for (let feature = 0; feature < numFeatures; feature++) {
      const values = data.map(row => row[feature]).filter(val => val !== null && val !== undefined) as number[];
      
      if (values.length === 0) {
        fillValues[feature] = 0;
        continue;
      }

      switch (strategy) {
        case 'mean':
          fillValues[feature] = mean(values);
          break;
        case 'median':
          fillValues[feature] = median(values);
          break;
        case 'mode':
          fillValues[feature] = this.calculateMode(values);
          break;
        default:
          fillValues[feature] = mean(values);
      }
    }

    // Fill missing values
    return data.map(row => 
      row.map((value, index) => 
        value === null || value === undefined ? fillValues[index] : value
      )
    ) as number[][];
  }

  /**
   * Encode categorical features
   */
  encodeCategoricalFeatures(
    data: (string | number)[][], 
    categoricalIndices: number[],
    method: 'onehot' | 'label' = 'onehot'
  ): {
    encodedData: number[][];
    encodingMaps: Map<number, any>;
  } {
    const encodingMaps = new Map<number, any>();
    let encodedData: (string | number)[][] = [...data];

    if (method === 'onehot') {
      // One-hot encoding
      categoricalIndices.reverse().forEach(colIndex => {
        const uniqueValues = [...new Set(data.map(row => row[colIndex]))];
        encodingMaps.set(colIndex, { type: 'onehot', values: uniqueValues });

        // Create new columns for each unique value
        const newColumns: number[][] = [];
        data.forEach(row => {
          const oneHotVector = uniqueValues.map(val => row[colIndex] === val ? 1 : 0);
          newColumns.push(oneHotVector);
        });

        // Insert new columns and remove original
        encodedData = encodedData.map((row, rowIndex) => {
          const newRow = [...row];
          newRow.splice(colIndex, 1, ...newColumns[rowIndex]);
          return newRow;
        });
      });
    } else {
      // Label encoding
      categoricalIndices.forEach(colIndex => {
        const uniqueValues = [...new Set(data.map(row => row[colIndex]))];
        const labelMap = new Map(uniqueValues.map((val, index) => [val, index]));
        encodingMaps.set(colIndex, { type: 'label', map: labelMap });

        encodedData = encodedData.map(row => {
          const newRow = [...row];
          newRow[colIndex] = labelMap.get(row[colIndex]) || 0;
          return newRow;
        });
      });
    }

    return {
      encodedData: encodedData as number[][],
      encodingMaps
    };
  }

  /**
   * Create polynomial features
   */
  createPolynomialFeatures(data: number[][], degree: number = 2): number[][] {
    if (degree === 1) return data;

    return data.map(row => {
      const polyFeatures = [...row]; // Original features

      if (degree >= 2) {
        // Add squared features
        row.forEach(value => {
          polyFeatures.push(value * value);
        });

        // Add interaction features (cross products)
        for (let i = 0; i < row.length; i++) {
          for (let j = i + 1; j < row.length; j++) {
            polyFeatures.push(row[i] * row[j]);
          }
        }
      }

      if (degree >= 3) {
        // Add cubic features
        row.forEach(value => {
          polyFeatures.push(value * value * value);
        });
      }

      return polyFeatures;
    });
  }

  /**
   * Apply feature selection based on variance threshold
   */
  selectFeaturesByVariance(data: number[][], threshold: number = 0.01): {
    selectedData: number[][];
    selectedIndices: number[];
  } {
    const numFeatures = data[0]?.length || 0;
    const selectedIndices: number[] = [];

    // Calculate variance for each feature
    for (let feature = 0; feature < numFeatures; feature++) {
      const values = data.map(row => row[feature]);
      const variance = this.calculateVariance(values);
      
      if (variance >= threshold) {
        selectedIndices.push(feature);
      }
    }

    // Select features with sufficient variance
    const selectedData = data.map(row => 
      selectedIndices.map(index => row[index])
    );

    return { selectedData, selectedIndices };
  }

  // ==================== DATA QUALITY ASSESSMENT ====================

  /**
   * Assess data quality metrics
   */
  assessDataQuality(data: (number | string | null)[][], featureNames: string[]): DataQualityMetrics {
    const totalCells = data.length * (data[0]?.length || 0);
    let nullCount = 0;
    let duplicateRows = 0;
    const issues: { type: string; description: string; severity: string; count: number }[] = [];

    // Count missing values
    data.forEach(row => {
      row.forEach(cell => {
        if (cell === null || cell === undefined || cell === '') {
          nullCount++;
        }
      });
    });

    // Check for duplicate rows
    const seenRows = new Set();
    data.forEach(row => {
      const rowString = JSON.stringify(row);
      if (seenRows.has(rowString)) {
        duplicateRows++;
      } else {
        seenRows.add(rowString);
      }
    });

    // Check for outliers in numerical columns
    const outlierCounts = this.detectOutliers(data);

    // Calculate metrics
    const completeness = (totalCells - nullCount) / totalCells;
    const uniqueness = (data.length - duplicateRows) / data.length;

    // Add issues
    if (nullCount > 0) {
      issues.push({
        type: 'MISSING_VALUES',
        description: `${nullCount} missing values detected`,
        severity: nullCount > totalCells * 0.1 ? 'HIGH' : 'MEDIUM',
        count: nullCount
      });
    }

    if (duplicateRows > 0) {
      issues.push({
        type: 'DUPLICATE_ROWS',
        description: `${duplicateRows} duplicate rows detected`,
        severity: duplicateRows > data.length * 0.05 ? 'HIGH' : 'MEDIUM',
        count: duplicateRows
      });
    }

    Object.entries(outlierCounts).forEach(([feature, count]) => {
      if (count > 0) {
        issues.push({
          type: 'OUTLIERS',
          description: `${count} outliers detected in ${feature}`,
          severity: count > data.length * 0.1 ? 'HIGH' : 'LOW',
          count
        });
      }
    });

    return {
      completeness,
      accuracy: 0.9, // Placeholder - would require ground truth
      consistency: 0.95, // Placeholder - would require business rules
      timeliness: 0.9, // Placeholder - would require timestamp analysis
      validity: 0.9, // Placeholder - would require validation rules
      uniqueness,
      overall: (completeness + uniqueness + 0.9 + 0.95 + 0.9 + 0.9) / 6,
      issues
    };
  }

  // ==================== HELPER METHODS ====================

  private groupInvoicesByMonth(invoices: any[]) {
    const monthlyMap = new Map<string, any>();

    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          invoices: [],
          totalRevenue: 0,
          customers: new Set()
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.invoices.push(invoice);
      monthData.totalRevenue += invoice.totalAmount;
      monthData.customers.add(invoice.customerId);
    });

    return Array.from(monthlyMap.values()).map(monthData => ({
      ...monthData,
      invoiceCount: monthData.invoices.length,
      avgInvoiceAmount: monthData.totalRevenue / monthData.invoices.length,
      uniqueCustomers: monthData.customers.size,
      customerRetentionRate: 0.8, // Placeholder calculation
      avgItemsPerInvoice: monthData.invoices.reduce((sum: number, inv: any) => sum + (inv.items?.length || 1), 0) / monthData.invoices.length
    }));
  }

  private groupTransactionsByWeek(transactions: any[]) {
    const weeklyMap = new Map<string, any>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const weekKey = this.getWeekKey(date);
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          weekOfYear: this.getWeekOfYear(date),
          month: date.getMonth() + 1,
          isMonthEnd: this.isMonthEnd(date),
          incomes: [],
          expenses: [],
          transactions: []
        });
      }

      const weekData = weeklyMap.get(weekKey)!;
      weekData.transactions.push(transaction);
      
      if (transaction.type === 'INCOME') {
        weekData.incomes.push(transaction.amount);
      } else {
        weekData.expenses.push(Math.abs(transaction.amount));
      }
    });

    return Array.from(weeklyMap.values()).map(weekData => ({
      ...weekData,
      incomeCount: weekData.incomes.length,
      expenseCount: weekData.expenses.length,
      avgIncome: weekData.incomes.length > 0 ? mean(weekData.incomes) : 0,
      avgExpense: weekData.expenses.length > 0 ? mean(weekData.expenses) : 0,
      incomeVariance: weekData.incomes.length > 1 ? this.calculateVariance(weekData.incomes) : 0,
      expenseVariance: weekData.expenses.length > 1 ? this.calculateVariance(weekData.expenses) : 0,
      netFlow: weekData.incomes.reduce((sum: number, amount: number) => sum + amount, 0) - 
               weekData.expenses.reduce((sum: number, amount: number) => sum + amount, 0)
    }));
  }

  private extractSingleProjectFeatures(project: any): number[] {
    const tasks = project.tasks || [];
    const members = project.members || [];
    
    const totalTasks = tasks.length;
    const teamSize = members.length;
    const highPriorityTasks = tasks.filter((task: any) => task.priority === 'HIGH' || task.priority === 'URGENT').length;
    const estimatedHours = tasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0);
    const budget = project.budget || 0;
    
    const startDate = new Date(project.startDate);
    const startMonth = startDate.getMonth() + 1;
    const startQuarter = Math.ceil(startMonth / 3);
    
    // Calculate task complexity (placeholder)
    const avgTaskComplexity = tasks.length > 0 ? 
      tasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 8), 0) / tasks.length / 8 : 1;

    return [
      totalTasks,
      teamSize,
      avgTaskComplexity,
      totalTasks > 0 ? highPriorityTasks / totalTasks : 0,
      estimatedHours,
      budget,
      startMonth,
      startQuarter,
      0, // Dependencies count (placeholder)
      0  // External dependencies ratio (placeholder)
    ];
  }

  private extractSingleCustomerFeatures(customer: any): number[] {
    const invoices = customer.invoices || [];
    const contacts = customer.contactHistories || [];
    
    if (invoices.length === 0) return [];

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const invoiceCount = invoices.length;
    const avgInvoiceAmount = totalRevenue / invoiceCount;
    
    const firstPurchase = new Date(invoices[invoices.length - 1].issueDate);
    const lastPurchase = new Date(invoices[0].issueDate);
    const now = new Date();
    
    const daysSinceFirst = (now.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLast = (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
    
    const purchaseFrequency = daysSinceFirst > 0 ? invoiceCount / (daysSinceFirst / 30) : 0; // Purchases per month
    const contactFrequency = contacts.length;
    
    // Calculate average days between purchases
    let avgDaysBetween = 0;
    if (invoices.length > 1) {
      const intervals = [];
      for (let i = 0; i < invoices.length - 1; i++) {
        const days = (new Date(invoices[i].issueDate).getTime() - new Date(invoices[i + 1].issueDate).getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }
      avgDaysBetween = mean(intervals);
    }

    // Revenue trend (placeholder)
    const revenueAmounts = invoices.map((inv: any) => inv.totalAmount);
    const revenueGrowth = revenueAmounts.length > 1 ? 
      (revenueAmounts[0] - revenueAmounts[revenueAmounts.length - 1]) / revenueAmounts[revenueAmounts.length - 1] : 0;

    // Seasonal buyer indicator
    const monthCounts = new Array(12).fill(0);
    invoices.forEach((inv: any) => {
      const month = new Date(inv.issueDate).getMonth();
      monthCounts[month]++;
    });
    const seasonalVariance = this.calculateVariance(monthCounts);

    return [
      totalRevenue,
      invoiceCount,
      avgInvoiceAmount,
      daysSinceFirst,
      daysSinceLast,
      purchaseFrequency,
      contactFrequency,
      avgDaysBetween,
      revenueGrowth,
      seasonalVariance > 1 ? 1 : 0 // 1 if seasonal, 0 if not
    ];
  }

  private calculateCustomerValueScore(customer: any): number {
    const invoices = customer.invoices || [];
    if (invoices.length === 0) return 0;

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const recency = (Date.now() - new Date(invoices[0].issueDate).getTime()) / (1000 * 60 * 60 * 24);
    const frequency = invoices.length;

    // RFM-based scoring (0-1)
    const recencyScore = Math.max(0, 1 - recency / 365); // 1 if recent, 0 if >1 year ago
    const frequencyScore = Math.min(1, frequency / 10); // 1 if 10+ purchases
    const monetaryScore = Math.min(1, totalRevenue / 100000); // 1 if $100k+ revenue

    return (recencyScore + frequencyScore + monetaryScore) / 3;
  }

  private calculateMode(values: number[]): number {
    const frequency = new Map<number, number>();
    values.forEach(value => {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });

    let maxFreq = 0;
    let mode = values[0];
    frequency.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = value;
      }
    });

    return mode;
  }

  private calculateVariance(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const avg = mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    return mean(squaredDiffs);
  }

  private detectOutliers(data: (number | string | null)[][]): { [key: string]: number } {
    const outlierCounts: { [key: string]: number } = {};
    
    if (data.length === 0) return outlierCounts;

    const numFeatures = data[0]?.length || 0;
    
    for (let feature = 0; feature < numFeatures; feature++) {
      const values = data.map(row => row[feature])
        .filter(val => typeof val === 'number' && !isNaN(val)) as number[];
      
      if (values.length === 0) continue;

      const q1 = this.calculateQuartile(values, 0.25);
      const q3 = this.calculateQuartile(values, 0.75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const outliers = values.filter(val => val < lowerBound || val > upperBound);
      outlierCounts[`feature_${feature}`] = outliers.length;
    }

    return outlierCounts;
  }

  private calculateQuartile(values: number[], quartile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = quartile * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
  }

  private isHolidaySeason(month: number): boolean {
    return month === 11 || month === 12; // November and December
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekOfYear(date);
    return `${year}-W${week}`;
  }

  private getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private isMonthEnd(date: Date): boolean {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay.getDate() === 1;
  }
}
