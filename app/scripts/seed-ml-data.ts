
/**
 * ML Data Seeding Script
 * Creates sample ML models, training jobs, predictions, and anomalies for testing
 */

import { PrismaClient, MLPredictionType, MLMetricType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMLData() {
  console.log('🤖 Starting ML data seeding...');

  // Get the first tenant for seeding
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ No tenant found. Please run main seed script first.');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id }
  });

  console.log(`📊 Seeding ML data for tenant: ${tenant.name}`);

  // 1. Create ML Models
  console.log('🧠 Creating ML models...');
  
  const salesForecastModel = await prisma.mLModel.create({
    data: {
      name: 'Sales Forecasting Model',
      version: '1.2',
      type: 'TIME_SERIES',
      framework: 'TENSORFLOW_JS',
      algorithm: 'LSTM',
      description: 'Advanced LSTM model for sales revenue forecasting with seasonal patterns',
      configParams: {
        windowSize: 12,
        hiddenUnits: 64,
        dropout: 0.2,
        learningRate: 0.001,
        epochs: 200,
      },
      featureColumns: ['timeIndex', 'monthOfYear', 'seasonality', 'marketing_spend', 'customer_count'],
      targetColumn: 'revenue',
      status: 'DEPLOYED',
      accuracy: 0.89,
      precision: 0.87,
      recall: 0.85,
      f1Score: 0.86,
      mse: 0.02,
      mae: 0.015,
      r2Score: 0.92,
      trainingDataSize: 365,
      validationDataSize: 73,
      lastTrainingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      lastUsedDate: new Date(),
      usageCount: 156,
      isActive: true,
      isProduction: true,
      tenantId: tenant.id,
      userId: user?.id,
    },
  });

  const customerChurnModel = await prisma.mLModel.create({
    data: {
      name: 'Customer Churn Prediction',
      version: '2.0',
      type: 'CLASSIFICATION',
      framework: 'TENSORFLOW_JS',
      algorithm: 'RANDOM_FOREST',
      description: 'Predicts customer churn probability based on behavioral patterns',
      configParams: {
        nEstimators: 100,
        maxDepth: 10,
        minSamplesSplit: 5,
        randomState: 42,
      },
      featureColumns: ['recency', 'frequency', 'monetary', 'engagement_score', 'support_tickets'],
      targetColumn: 'churn_label',
      status: 'DEPLOYED',
      accuracy: 0.82,
      precision: 0.79,
      recall: 0.85,
      f1Score: 0.82,
      trainingDataSize: 1250,
      validationDataSize: 250,
      lastTrainingDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      lastUsedDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      usageCount: 89,
      isActive: true,
      isProduction: true,
      tenantId: tenant.id,
      userId: user?.id,
    },
  });

  const anomalyDetectionModel = await prisma.mLModel.create({
    data: {
      name: 'Financial Anomaly Detector',
      version: '1.0',
      type: 'CLUSTERING',
      framework: 'TENSORFLOW_JS',
      algorithm: 'ISOLATION_FOREST',
      description: 'Detects unusual patterns in financial transactions and cash flows',
      configParams: {
        nEstimators: 100,
        contamination: 0.05,
        randomState: 42,
      },
      featureColumns: ['amount', 'frequency', 'time_of_day', 'category_encoded', 'user_behavior'],
      status: 'DEPLOYED',
      accuracy: 0.94,
      trainingDataSize: 5000,
      validationDataSize: 1000,
      lastTrainingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastUsedDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      usageCount: 324,
      isActive: true,
      isProduction: true,
      tenantId: tenant.id,
      userId: user?.id,
    },
  });

  // 2. Create Training Jobs
  console.log('🏋️ Creating training jobs...');
  
  await prisma.mLTrainingJob.createMany({
    data: [
      {
        modelId: salesForecastModel.id,
        jobName: 'Sales Model Retraining - Weekly Update',
        status: 'COMPLETED',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        duration: 45 * 60 * 1000, // 45 minutes
        trainingConfig: {
          epochs: 200,
          batchSize: 32,
          learningRate: 0.001,
          validationSplit: 0.2,
        },
        datasetSize: 438,
        validationSplit: 0.2,
        epochs: 200,
        batchSize: 32,
        learningRate: 0.001,
        validationLoss: 0.0234,
        validationAccuracy: 0.89,
        tenantId: tenant.id,
        userId: user?.id,
      },
      {
        modelId: customerChurnModel.id,
        jobName: 'Customer Churn Model Training v2.0',
        status: 'COMPLETED',
        startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 23 * 60 * 1000),
        duration: 23 * 60 * 1000, // 23 minutes
        trainingConfig: {
          nEstimators: 100,
          maxDepth: 10,
          validationSplit: 0.2,
        },
        datasetSize: 1500,
        validationSplit: 0.2,
        validationAccuracy: 0.82,
        tenantId: tenant.id,
        userId: user?.id,
      },
      {
        modelId: anomalyDetectionModel.id,
        jobName: 'Anomaly Detection Training - Initial',
        status: 'RUNNING',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        trainingConfig: {
          nEstimators: 100,
          contamination: 0.05,
        },
        datasetSize: 6000,
        tenantId: tenant.id,
        userId: user?.id,
      },
    ],
  });

  // 3. Create Predictions
  console.log('🔮 Creating prediction records...');
  
  const predictionDates = [];
  for (let i = 0; i < 30; i++) {
    predictionDates.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
  }

  const predictions = [];
  for (const date of predictionDates.slice(0, 15)) {
    predictions.push(
      {
        modelId: salesForecastModel.id,
        predictionType: MLPredictionType.SALES_FORECAST,
        inputData: [
          [
            Math.floor(Math.random() * 365), // timeIndex
            date.getMonth() + 1, // monthOfYear
            Math.random() * 0.5 + 0.75, // seasonality
            Math.random() * 10000 + 5000, // marketing_spend
            Math.floor(Math.random() * 50) + 30, // customer_count
          ],
        ],
        outputData: {
          prediction: Math.random() * 50000 + 100000,
          confidence: Math.random() * 0.3 + 0.7,
          factors: {
            seasonality: Math.random() * 0.4 + 0.2,
            trend: Math.random() * 0.4 + 0.2,
            marketing: Math.random() * 0.3 + 0.1,
          },
        },
        confidence: Math.random() * 0.3 + 0.7,
        predictionDate: date,
        targetDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
        tenantId: tenant.id,
        userId: user?.id,
      },
      {
        modelId: customerChurnModel.id,
        predictionType: MLPredictionType.CHURN_PREDICTION,
        inputData: [
          [
            Math.random() * 365, // recency
            Math.random() * 20, // frequency
            Math.random() * 50000, // monetary
            Math.random(), // engagement_score
            Math.floor(Math.random() * 10), // support_tickets
          ],
        ],
        outputData: {
          churnProbability: Math.random() * 0.6,
          riskLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
          factors: {
            recency: Math.random() * 0.4,
            frequency: Math.random() * 0.3,
            monetary: Math.random() * 0.3,
          },
        },
        confidence: Math.random() * 0.2 + 0.75,
        predictionDate: date,
        tenantId: tenant.id,
        userId: user?.id,
      }
    );
  }

  await prisma.mLPrediction.createMany({ data: predictions });

  // 4. Create Anomaly Detection Records
  console.log('🚨 Creating anomaly detection records...');
  
  await prisma.mLAnomalyDetection.createMany({
    data: [
      {
        anomalyType: 'FINANCIAL',
        dataSource: 'transactions',
        inputData: {
          transactionId: 'txn_12345',
          amount: 25000,
          category: 'office_supplies',
          timestamp: new Date().toISOString(),
          userId: user?.id,
        },
        anomalyScore: 0.92,
        threshold: 0.8,
        isAnomaly: true,
        severity: 'HIGH',
        description: 'Unusually large office supplies transaction detected',
        explanation: 'Transaction amount (€25,000) is 450% above the average for this category',
        recommendations: [
          'Verify transaction authorization',
          'Review supporting documentation',
          'Check for duplicate entries',
        ],
        detectionMethod: 'ISOLATION_FOREST',
        detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        status: 'OPEN',
        resourceType: 'TRANSACTION',
        resourceId: 'txn_12345',
        alertSent: true,
        tenantId: tenant.id,
      },
      {
        anomalyType: 'CUSTOMER_BEHAVIOR',
        dataSource: 'customer_interactions',
        inputData: {
          customerId: 'cust_67890',
          interactionFrequency: 0.1,
          lastContact: '2024-01-15',
          avgPurchaseAmount: 1200,
        },
        anomalyScore: 0.78,
        threshold: 0.7,
        isAnomaly: true,
        severity: 'MEDIUM',
        description: 'Significant drop in customer engagement detected',
        explanation: 'Customer interaction frequency dropped by 85% in the last 30 days',
        recommendations: [
          'Schedule customer check-in call',
          'Send satisfaction survey',
          'Offer loyalty incentive',
        ],
        detectionMethod: 'BEHAVIORAL_ANALYSIS',
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resourceType: 'CUSTOMER',
        resourceId: 'cust_67890',
        alertSent: true,
        tenantId: tenant.id,
        userId: user?.id,
      },
      {
        anomalyType: 'PROJECT',
        dataSource: 'project_timelines',
        inputData: {
          projectId: 'proj_abc123',
          expectedDuration: 60,
          actualDuration: 95,
          resourceUtilization: 1.4,
        },
        anomalyScore: 0.85,
        threshold: 0.75,
        isAnomaly: true,
        severity: 'HIGH',
        description: 'Project timeline significantly exceeded expectations',
        explanation: 'Project duration is 58% longer than estimated with high resource overutilization',
        recommendations: [
          'Review project scope and requirements',
          'Assess resource allocation efficiency',
          'Update estimation models',
        ],
        detectionMethod: 'TIMELINE_ANALYSIS',
        detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'RESOLVED',
        acknowledgedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resourceType: 'PROJECT',
        resourceId: 'proj_abc123',
        alertSent: true,
        tenantId: tenant.id,
        userId: user?.id,
      },
      {
        anomalyType: 'PERFORMANCE',
        dataSource: 'system_metrics',
        inputData: {
          metricType: 'response_time',
          value: 2.8,
          threshold: 1.5,
          endpoint: '/api/analytics/dashboard',
        },
        anomalyScore: 0.73,
        threshold: 0.7,
        isAnomaly: true,
        severity: 'MEDIUM',
        description: 'API response time anomaly detected',
        explanation: 'Dashboard endpoint response time is 87% above normal baseline',
        recommendations: [
          'Check database query performance',
          'Review server resource usage',
          'Consider query optimization',
        ],
        detectionMethod: 'STATISTICAL_THRESHOLD',
        detectedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'OPEN',
        resourceType: 'API_ENDPOINT',
        resourceId: '/api/analytics/dashboard',
        alertSent: false,
        tenantId: tenant.id,
      },
    ],
  });

  // 5. Create Model Features
  console.log('🔧 Creating model features...');
  
  const salesModelFeatures = [
    { name: 'timeIndex', type: 'NUMERICAL', importance: 0.25, description: 'Sequential time index' },
    { name: 'monthOfYear', type: 'CATEGORICAL', importance: 0.35, description: 'Month of the year (1-12)' },
    { name: 'seasonality', type: 'NUMERICAL', importance: 0.20, description: 'Seasonal adjustment factor' },
    { name: 'marketing_spend', type: 'NUMERICAL', importance: 0.15, description: 'Monthly marketing expenditure' },
    { name: 'customer_count', type: 'NUMERICAL', importance: 0.05, description: 'Active customer count' },
  ];

  for (const feature of salesModelFeatures) {
    await prisma.mLFeature.create({
      data: {
        modelId: salesForecastModel.id,
        name: feature.name,
        type: feature.type as any,
        description: feature.description,
        dataType: feature.type === 'NUMERICAL' ? 'FLOAT' : 'STRING',
        importance: feature.importance,
        isActive: true,
        statistics: {
          mean: feature.type === 'NUMERICAL' ? Math.random() * 100 : null,
          std: feature.type === 'NUMERICAL' ? Math.random() * 20 : null,
          min: feature.type === 'NUMERICAL' ? 0 : null,
          max: feature.type === 'NUMERICAL' ? Math.random() * 200 : null,
        },
        tenantId: tenant.id,
      },
    });
  }

  // 6. Create Model Metrics
  console.log('📊 Creating model metrics...');
  
  const metricsData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    metricsData.push(
      {
        modelId: salesForecastModel.id,
        metricType: MLMetricType.ACCURACY,
        value: 0.85 + Math.random() * 0.1,
        datasetType: 'PRODUCTION',
        evaluationDate: date,
        sampleSize: Math.floor(Math.random() * 100) + 50,
        tenantId: tenant.id,
      },
      {
        modelId: customerChurnModel.id,
        metricType: MLMetricType.F1_SCORE,
        value: 0.78 + Math.random() * 0.1,
        datasetType: 'PRODUCTION',
        evaluationDate: date,
        sampleSize: Math.floor(Math.random() * 50) + 25,
        tenantId: tenant.id,
      }
    );
  }

  await prisma.mLModelMetrics.createMany({ data: metricsData });

  // 7. Create Data Pipelines
  console.log('🔄 Creating data pipelines...');
  
  const salesDataPipeline = await prisma.mLDataPipeline.create({
    data: {
      name: 'Sales Data Processing Pipeline',
      description: 'Daily processing of sales data for ML model training and predictions',
      pipelineType: 'PREPROCESSING',
      status: 'ACTIVE',
      sourceConfig: {
        dataSource: 'sales_database',
        tables: ['invoices', 'customers', 'transactions'],
        updateFrequency: 'DAILY',
      },
      steps: {
        steps: [
          { name: 'extract', type: 'data_extraction', config: { source: 'postgres' } },
          { name: 'clean', type: 'data_cleaning', config: { removeNulls: true, handleOutliers: true } },
          { name: 'transform', type: 'feature_engineering', config: { normalize: true, createFeatures: true } },
          { name: 'load', type: 'data_loading', config: { destination: 'ml_store' } },
        ],
      },
      schedule: '0 2 * * *', // Daily at 2 AM
      lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRunAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      successCount: 45,
      failureCount: 2,
      avgExecutionTime: 12 * 60 * 1000, // 12 minutes
      isActive: true,
      tenantId: tenant.id,
      userId: user?.id,
    },
  });

  // 8. Create Pipeline Executions
  console.log('⚙️ Creating pipeline executions...');
  
  await prisma.mLPipelineExecution.createMany({
    data: [
      {
        pipelineId: salesDataPipeline.id,
        executionId: 'exec_001',
        status: 'COMPLETED',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 11 * 60 * 1000),
        duration: 11 * 60 * 1000,
        processedRecords: 1250,
        errorRecords: 3,
        stepResults: {
          extract: { status: 'success', records: 1253, duration: 2000 },
          clean: { status: 'success', records: 1250, removed: 3, duration: 3000 },
          transform: { status: 'success', features: 15, duration: 4000 },
          load: { status: 'success', loaded: 1250, duration: 2000 },
        },
        tenantId: tenant.id,
      },
      {
        pipelineId: salesDataPipeline.id,
        executionId: 'exec_002',
        status: 'RUNNING',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        processedRecords: 875,
        errorRecords: 1,
        tenantId: tenant.id,
      },
    ],
  });

  console.log('✅ ML data seeding completed successfully!');
  console.log(`📈 Created:
    - 3 ML Models (Sales Forecasting, Customer Churn, Anomaly Detection)
    - 3 Training Jobs
    - 30 Predictions
    - 4 Anomaly Detections
    - 5 Model Features
    - 60 Model Metrics
    - 1 Data Pipeline
    - 2 Pipeline Executions`);
}

// Execute seeding
seedMLData()
  .catch((e) => {
    console.error('❌ ML data seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
