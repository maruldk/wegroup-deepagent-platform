
import { 
  UserRole, 
  CustomerStatus, 
  ContactType, 
  LeadStatus,
  InvoiceStatus,
  TransactionType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  WidgetType,
  ReportType,
  EventType,
  EventPriority,
  EventStatus,
  HandlerStatus,
  WorkflowExecStatus,
  StepType,
  StepStatus,
  NotificationType,
  NotificationSeverity,
  MLModelType,
  MLModelStatus,
  MLTrainingStatus,
  MLPredictionType,
  MLAnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  MLFeatureType,
  MLExperimentType,
  MLExperimentStatus,
  MLPipelineType,
  MLPipelineStatus,
  MLExecutionStatus,
  MLMetricType,
  // HYBRID SPRINT 2.1 Types
  SecurityAction,
  PerformanceMetricType,
  ImportExportType,
  DataFormat,
  ImportExportStatus,
  ETLExecutionStatus,
  ReportFormat,
  ReportExecutionStatus,
  WebhookEvent,
  WebhookDeliveryStatus,
  ConnectorType,
  ConnectorSyncStatus
} from '@prisma/client';

// Re-export ML types for easier imports
export {
  MLModelType,
  MLModelStatus,
  MLTrainingStatus,
  MLPredictionType,
  MLAnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  MLFeatureType,
  MLExperimentType,
  MLExperimentStatus,
  MLPipelineType,
  MLPipelineStatus,
  MLExecutionStatus,
  MLMetricType,
  // HYBRID SPRINT 2.1 Types
  SecurityAction,
  PerformanceMetricType,
  ImportExportType,
  DataFormat,
  ImportExportStatus,
  ETLExecutionStatus,
  ReportFormat,
  ReportExecutionStatus,
  WebhookEvent,
  WebhookDeliveryStatus,
  ConnectorType,
  ConnectorSyncStatus
};

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  tenantName?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status: CustomerStatus;
  notes?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  contactHistories?: ContactHistory[];
}

export interface ContactHistory {
  id: string;
  customerId: string;
  userId: string;
  type: ContactType;
  description: string;
  createdAt: Date;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  status: LeadStatus;
  source?: string | null;
  notes?: string | null;
  estimatedValue?: number | null;
  tenantId: string;
  assignedUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: {
    name?: string | null;
    email: string;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  totalLeads: number;
  totalUsers: number;
  activeCustomers: number;
  newLeadsThisMonth: number;
}

// ==================== weANALYTICS Types ====================

export interface Dashboard {
  id: string;
  name: string;
  description?: string | null;
  layout?: any;
  isDefault: boolean;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  widgets?: Widget[];
}

export interface Widget {
  id: string;
  dashboardId: string;
  name: string;
  type: WidgetType;
  config?: any;
  position?: any;
  size?: any;
  dataSource?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  name: string;
  description?: string | null;
  type: ReportType;
  config?: any;
  data?: any;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface Metric {
  id: string;
  name: string;
  description?: string | null;
  formula: string;
  target?: number | null;
  currentValue?: number | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== weFINANCE Types ====================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  terms?: string | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  user?: {
    name?: string | null;
    email: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  tenantId: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string | null;
  date: Date;
  reference?: string | null;
  invoiceId?: string | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  invoice?: Invoice;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface Budget {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  startDate: Date;
  endDate: Date;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface TaxCategory {
  id: string;
  name: string;
  rate: number;
  tenantId: string;
}

export interface DatevExport {
  id: string;
  filename: string;
  startDate: Date;
  endDate: Date;
  data?: any;
  tenantId: string;
  userId: string;
  createdAt: Date;
  user?: {
    name?: string | null;
    email: string;
  };
}

// ==================== wePROJECT Types ====================

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null;
  tenantId: string;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
  manager?: {
    name?: string | null;
    email: string;
  };
  tasks?: Task[];
  members?: ProjectMember[];
  milestones?: Milestone[];
  timesheets?: Timesheet[];
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  parentTaskId?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  assignee?: {
    name?: string | null;
    email: string;
  };
  parentTask?: Task;
  subtasks?: Task[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  dueDate: Date;
  isCompleted: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role?: string | null;
  joinedAt: Date;
  tenantId: string;
  project?: Project;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface Timesheet {
  id: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  date: Date;
  hours: number;
  description?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  task?: Task;
  user?: {
    name?: string | null;
    email: string;
  };
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      tenantId?: string | null;
      tenantName?: string | null;
    };
  }

  interface User {
    role: UserRole;
    tenantId?: string | null;
    tenantName?: string | null;
  }
}



// ==================== EVENT-DRIVEN ORCHESTRATION TYPES ====================

export interface EventBusItem {
  id: string;
  eventType: EventType;
  eventName: string;
  source: string;
  target?: string | null;
  payload: any;
  metadata?: any;
  priority: EventPriority;
  status: EventStatus;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: Date | null;
  processedAt?: Date | null;
  errorLog?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  handlers?: EventHandlerItem[];
  correlations?: EventCorrelationItem[];
}

export interface EventHandlerItem {
  id: string;
  eventBusId: string;
  handlerName: string;
  module: string;
  status: HandlerStatus;
  executedAt?: Date | null;
  executionTime?: number | null;
  errorMessage?: string | null;
  result?: any;
  tenantId: string;
  createdAt: Date;
}

export interface EventCorrelationItem {
  id: string;
  correlationId: string;
  eventBusId: string;
  parentEventId?: string | null;
  workflowId?: string | null;
  sequenceNumber: number;
  tenantId: string;
  createdAt: Date;
}

export interface EventSubscriptionItem {
  id: string;
  subscriberId: string;
  eventPattern: string;
  isActive: boolean;
  priority: number;
  filterConfig?: any;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDefinitionItem {
  id: string;
  name: string;
  description?: string | null;
  version: string;
  triggerEvent: string;
  steps: any;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  executions?: WorkflowExecutionItem[];
}

export interface WorkflowExecutionItem {
  id: string;
  workflowDefinitionId: string;
  correlationId: string;
  status: WorkflowExecStatus;
  currentStep: number;
  totalSteps: number;
  startTime: Date;
  endTime?: Date | null;
  inputData: any;
  outputData?: any;
  errorMessage?: string | null;
  retryCount: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  workflowDefinition?: WorkflowDefinitionItem;
  steps?: WorkflowStepItem[];
}

export interface WorkflowStepItem {
  id: string;
  workflowExecutionId: string;
  stepNumber: number;
  stepName: string;
  stepType: StepType;
  status: StepStatus;
  inputData?: any;
  outputData?: any;
  errorMessage?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  executionTime?: number | null;
  retryCount: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealTimeNotificationItem {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  data?: any;
  isRead: boolean;
  isPersistent: boolean;
  channel?: string | null;
  expiresAt?: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name?: string | null;
    email: string;
  };
}

export interface AIOrchestrationMetricsItem {
  id: string;
  eventProcessedCount: number;
  avgProcessingTime: number;
  successRate: number;
  errorRate: number;
  automationScore: number;
  workflowSuccessRate: number;
  aiDecisionAccuracy: number;
  userSatisfactionScore: number;
  date: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event System Interfaces
export interface EventPayload {
  [key: string]: any;
}

export interface EventMetadata {
  userId?: string;
  tenantId: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  traceId?: string;
}

export interface EventHandler {
  name: string;
  module: string;
  handler: (event: EventBusItem) => Promise<any>;
  priority: number;
  filter?: (event: EventBusItem) => boolean;
}

export interface WorkflowStep {
  name: string;
  type: StepType;
  config: any;
  condition?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  version: string;
  triggerEvent: string;
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface EventBusConfig {
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  deadLetterQueue: {
    enabled: boolean;
    maxRetentionDays: number;
  };
  metrics: {
    enabled: boolean;
    samplingRate: number;
  };
}

export interface RealtimeUpdate {
  type: 'EVENT' | 'NOTIFICATION' | 'WORKFLOW' | 'METRIC';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'FAIL';
  data: any;
  timestamp: Date;
  userId?: string;
  tenantId: string;
}

export interface WebSocketMessage {
  id: string;
  type: 'REALTIME_UPDATE' | 'NOTIFICATION' | 'HEARTBEAT' | 'ERROR';
  payload: any;
  timestamp: Date;
  channel?: string;
}

// Analytics & Performance Types
export interface EventProcessingMetrics {
  eventId: string;
  processingStartTime: Date;
  processingEndTime: Date;
  duration: number;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  errorMessage?: string;
  handlerResults: {
    handlerName: string;
    duration: number;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }[];
}

export interface OrchestrationStats {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  avgProcessingTime: number;
  automationScore: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
}

// Business Process Automation Types
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  priority: number;
  tenantId: string;
}

export interface BusinessProcessMetrics {
  processName: string;
  automationLevel: number; // 0-1 (0% - 100%)
  avgProcessingTime: number;
  errorRate: number;
  costSavings: number;
  humanInterventionRate: number;
}

// ==================== ML-PIPELINE & PREDICTIVE ANALYTICS TYPES ====================

export interface MLModelItem {
  id: string;
  name: string;
  version: string;
  type: MLModelType;
  framework: string;
  algorithm: string;
  description?: string | null;
  configParams: any;
  architecture?: any;
  featureColumns: string[];
  targetColumn?: string | null;
  status: MLModelStatus;
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1Score?: number | null;
  mse?: number | null;
  mae?: number | null;
  r2Score?: number | null;
  trainingDataSize?: number | null;
  validationDataSize?: number | null;
  modelPath?: string | null;
  modelData?: any;
  lastTrainingDate?: Date | null;
  lastUsedDate?: Date | null;
  usageCount: number;
  isActive: boolean;
  isProduction: boolean;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  trainingJobs?: MLTrainingJobItem[];
  predictions?: MLPredictionItem[];
  experiments?: MLExperimentItem[];
  features?: MLFeatureItem[];
  metrics?: MLModelMetricsItem[];
}

export interface MLTrainingJobItem {
  id: string;
  modelId: string;
  jobName: string;
  status: MLTrainingStatus;
  startTime?: Date | null;
  endTime?: Date | null;
  duration?: number | null;
  trainingConfig: any;
  datasetPath?: string | null;
  datasetSize?: number | null;
  validationSplit?: number | null;
  epochs?: number | null;
  batchSize?: number | null;
  learningRate?: number | null;
  lossFunctionData?: any;
  accuracyData?: any;
  validationLoss?: number | null;
  validationAccuracy?: number | null;
  modelCheckpoints?: any;
  logs?: string | null;
  errorMessage?: string | null;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  model?: MLModelItem;
}

export interface MLPredictionItem {
  id: string;
  modelId: string;
  predictionType: MLPredictionType;
  inputData: any;
  outputData: any;
  confidence?: number | null;
  probability?: any;
  predictionDate: Date;
  targetDate?: Date | null;
  actualValue?: any;
  accuracy?: number | null;
  isCorrect?: boolean | null;
  resourceType?: string | null;
  resourceId?: string | null;
  context?: any;
  batchId?: string | null;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  model?: MLModelItem;
}

export interface MLAnomalyDetectionItem {
  id: string;
  anomalyType: MLAnomalyType;
  dataSource: string;
  inputData: any;
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
  severity: AnomalySeverity;
  description: string;
  explanation?: string | null;
  recommendations?: any;
  detectionMethod: string;
  detectedAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  status: AnomalyStatus;
  falsePositive?: boolean | null;
  resourceType?: string | null;
  resourceId?: string | null;
  alertSent: boolean;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MLFeatureItem {
  id: string;
  modelId: string;
  name: string;
  type: MLFeatureType;
  description?: string | null;
  dataType: string;
  sourceColumn?: string | null;
  transformation?: string | null;
  importance?: number | null;
  isActive: boolean;
  statistics?: any;
  categories: string[];
  encoding?: any;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  model?: MLModelItem;
}

export interface MLExperimentItem {
  id: string;
  name: string;
  description?: string | null;
  modelId?: string | null;
  experimentType: MLExperimentType;
  status: MLExperimentStatus;
  startDate: Date;
  endDate?: Date | null;
  configuration: any;
  variants: any;
  metrics: any;
  winnerVariant?: string | null;
  confidence?: number | null;
  significanceLevel?: number | null;
  sampleSize?: number | null;
  results?: any;
  conclusions?: string | null;
  isActive: boolean;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  model?: MLModelItem;
}

export interface MLDataPipelineItem {
  id: string;
  name: string;
  description?: string | null;
  pipelineType: MLPipelineType;
  status: MLPipelineStatus;
  sourceConfig: any;
  steps: any;
  schedule?: string | null;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  successCount: number;
  failureCount: number;
  avgExecutionTime?: number | null;
  outputDataPath?: string | null;
  logs?: string | null;
  errorMessage?: string | null;
  isActive: boolean;
  tenantId: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  executions?: MLPipelineExecutionItem[];
}

export interface MLPipelineExecutionItem {
  id: string;
  pipelineId: string;
  executionId: string;
  status: MLExecutionStatus;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  inputData?: any;
  outputData?: any;
  processedRecords?: number | null;
  errorRecords?: number | null;
  stepResults?: any;
  logs?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  pipeline?: MLDataPipelineItem;
}

export interface MLModelMetricsItem {
  id: string;
  modelId: string;
  metricType: MLMetricType;
  value: number;
  datasetType: string;
  evaluationDate: Date;
  sampleSize?: number | null;
  metadata?: any;
  tenantId: string;
  createdAt: Date;
  model?: MLModelItem;
}

// ML Service Interfaces
export interface MLModelConfig {
  type: MLModelType;
  algorithm: string;
  hyperparameters: {
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    validationSplit?: number;
    [key: string]: any;
  };
  features: MLFeatureConfig[];
  target?: string;
}

export interface MLFeatureConfig {
  name: string;
  type: MLFeatureType;
  transformation?: string;
  encoding?: any;
  categories?: string[];
  statistics?: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    [key: string]: any;
  };
}

export interface MLTrainingData {
  features: number[][];
  target?: number[] | string[];
  featureNames: string[];
  targetName?: string;
  sampleCount: number;
}

export interface MLPredictionResult {
  prediction: any;
  confidence?: number;
  probability?: any;
  explanation?: any;
  modelUsed: string;
  timestamp: Date;
}

export interface MLAnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  threshold: number;
  severity: AnomalySeverity;
  explanation?: string;
  recommendations?: string[];
  timestamp: Date;
}

export interface MLExperimentConfig {
  name: string;
  type: MLExperimentType;
  variants: {
    id: string;
    name: string;
    config: any;
  }[];
  metrics: string[];
  duration?: number;
  sampleSize?: number;
  significanceLevel?: number;
}

export interface MLModelPerformance {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number;
  mae?: number;
  r2Score?: number;
  confusionMatrix?: number[][];
  rocAuc?: number;
  logLoss?: number;
}

export interface PredictiveAnalyticsConfig {
  forecastHorizon: number; // Days to forecast
  confidence: number; // Confidence level (0-1)
  includeSeasonality: boolean;
  includeHolidays: boolean;
  features: string[];
}

export interface SalesForecastResult {
  predictions: {
    date: Date;
    value: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }[];
  accuracy: number;
  modelMetrics: MLModelPerformance;
  factors: {
    feature: string;
    importance: number;
  }[];
}

export interface CashFlowPrediction {
  predictions: {
    date: Date;
    income: number;
    expenses: number;
    netFlow: number;
    cumulativeFlow: number;
    confidence: number;
  }[];
  riskAssessment: {
    cashoutRisk: number;
    riskDates: Date[];
    recommendations: string[];
  };
  accuracy: number;
}

export interface ProjectTimelinePrediction {
  predictedCompletionDate: Date;
  confidence: number;
  delayRisk: number;
  criticalTasks: {
    taskId: string;
    name: string;
    delayRisk: number;
    impact: number;
  }[];
  recommendations: string[];
  accuracy: number;
}

export interface CustomerBehaviorAnalysis {
  churnProbability: number;
  valueSegment: string;
  nextPurchasePrediction: {
    date: Date;
    amount: number;
    confidence: number;
  };
  recommendedActions: string[];
  factors: {
    feature: string;
    impact: number;
  }[];
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  uniqueness: number;
  overall: number;
  issues: {
    type: string;
    description: string;
    severity: string;
    count: number;
  }[];
}

export interface MLDashboardStats {
  totalModels: number;
  activeModels: number;
  trainingJobs: number;
  predictions: number;
  anomaliesDetected: number;
  avgAccuracy: number;
  pipelineRuns: number;
  experiments: number;
}

export interface MLInsight {
  id: string;
  type: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'RECOMMENDATION';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  data: any;
  actions: string[];
  timestamp: Date;
  module: string;
}

export interface AutoMLConfig {
  task: 'CLASSIFICATION' | 'REGRESSION' | 'TIME_SERIES' | 'CLUSTERING';
  targetColumn: string;
  features: string[];
  trainTestSplit: number;
  maxModels: number;
  timeLimit: number; // Minutes
  optimizationMetric: string;
}

// ==================== SELF-LEARNING SYSTEM TYPES (SPRINT 1.5) ====================

// Reinforcement Learning Types
export interface RLAgentConfig {
  agentType: RLAgentType;
  environment: string;
  hyperparameters: {
    learningRate: number;
    explorationRate: number;
    discountFactor: number;
    [key: string]: any;
  };
  policy?: Record<string, any>;
}

export interface RLState {
  data: Record<string, any>;
  hash: string;
  features: number[];
  isTerminal: boolean;
}

export interface RLAction {
  type: string;
  parameters: Record<string, any>;
  qValue?: number;
  probability?: number;
}

export interface RLReward {
  value: number;
  type: RLRewardType;
  source: string;
  context?: Record<string, any>;
}

export interface RLEpisodeResult {
  id: string;
  episodeNumber: number;
  totalSteps: number;
  totalReward: number;
  avgReward: number;
  success: boolean;
  duration: number;
}

export interface RLDecisionRequest {
  agentId: string;
  state: RLState;
  availableActions: RLAction[];
  context?: Record<string, any>;
}

export interface RLDecisionResponse {
  action: RLAction;
  confidence: number;
  reasoning?: string;
  expectedReward: number;
  explorationAction: boolean;
}

// User Feedback Types
export interface UserFeedbackData {
  userId: string;
  targetType: string;
  targetId: string;
  feedbackType: UserFeedbackType;
  rating?: number;
  sentiment?: FeedbackSentiment;
  comment?: string;
  context?: Record<string, any>;
  weight?: number;
}

export interface UserPreferenceData {
  userId: string;
  preferenceType: string;
  key: string;
  value: any;
  source: PreferenceSource;
  confidence: number;
}

export interface ImplicitFeedbackData {
  userId?: string;
  sessionId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  value?: number;
  context: Record<string, any>;
  timestamp: Date;
}

// Self-Optimization Types
export interface HyperparameterTuningConfig {
  modelId?: string;
  agentId?: string;
  tuningMethod: TuningMethod;
  searchSpace: Record<string, any>;
  objective: string;
  maxIterations: number;
  constraints?: Record<string, any>;
}

export interface HyperparameterTuningResult {
  bestParams: Record<string, any>;
  bestScore: number;
  iterations: number;
  convergenceHistory: number[];
  searchHistory: Array<{
    params: Record<string, any>;
    score: number;
  }>;
}

export interface ConceptDriftDetection {
  modelId?: string;
  agentId?: string;
  driftType: DriftType;
  severity: DriftSeverity;
  confidence: number;
  driftScore: number;
  baseline: Record<string, any>;
  current: Record<string, any>;
  recommendation: string;
  detectedAt: Date;
}

export interface ModelPerformanceMetric {
  modelId?: string;
  agentId?: string;
  metricName: string;
  metricValue: number;
  baseline?: number;
  improvement?: number;
  dataWindow: string;
  timestamp: Date;
  environment?: string;
}

// Continuous Learning Types
export interface OnlineLearningConfig {
  modelId?: string;
  agentId?: string;
  sessionType: OnlineLearningType;
  learningRate: number;
  adaptationRate: number;
  batchSize: number;
  updateFrequency: number;
  memorySize?: number;
}

export interface OnlineLearningUpdate {
  sessionId: string;
  newData: any[];
  labels?: any[];
  feedback?: UserFeedbackData[];
  performanceMetrics: Record<string, number>;
  adaptations: Record<string, any>;
}

export interface TransferLearningConfig {
  sourceModelId?: string;
  targetModelId?: string;
  sourceAgentId?: string;
  targetAgentId?: string;
  transferType: TransferType;
  transferMethod: string;
  similarity?: number;
  layersToTransfer?: string[];
  layersToFreeze?: string[];
}

export interface TransferLearningResult {
  transferredParams: Record<string, any>;
  performanceImprovement: number;
  transferEfficiency: number;
  adaptationTime: number;
  finalPerformance: Record<string, number>;
}

export interface AdaptiveLearningRule {
  modelId?: string;
  agentId?: string;
  adaptationType: AdaptationType;
  trigger: string;
  threshold: number;
  adaptationFunction: string;
  parameters: Record<string, any>;
}

// AutoML Types for Self-Learning
export interface AutoMLExperimentConfig {
  name: string;
  description?: string;
  experimentType: AutoMLType;
  dataset: Record<string, any>;
  objective: string;
  constraints?: Record<string, any>;
  searchSpace: Record<string, any>;
  maxTrials: number;
  timeLimit?: number;
}

export interface AutoMLResult {
  bestModel: Record<string, any>;
  bestScore: number;
  totalTrials: number;
  searchTime: number;
  leaderboard: Array<{
    modelConfig: Record<string, any>;
    score: number;
    rank: number;
  }>;
  insights: string[];
}

// Dashboard and Analytics Types
export interface SelfLearningMetrics {
  autonomyScore: number;
  learningEfficiency: number;
  adaptationRate: number;
  userSatisfaction: number;
  performanceImprovement: number;
  driftDetectionAccuracy: number;
  reinforcementLearningSuccess: number;
  onlineLearningMetrics: {
    sessionsActive: number;
    samplesProcessed: number;
    avgLoss: number;
    adaptationsPerformed: number;
  };
  feedbackMetrics: {
    totalFeedback: number;
    positiveRatio: number;
    feedbackProcessingRate: number;
    implicitFeedbackCapture: number;
  };
}

export interface SelfLearningDashboardData {
  metrics: SelfLearningMetrics;
  activeAgents: RLAgentSummary[];
  recentFeedback: UserFeedbackSummary[];
  performanceTrends: PerformanceTrend[];
  driftAlerts: ConceptDriftAlert[];
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface RLAgentSummary {
  id: string;
  name: string;
  agentType: RLAgentType;
  environment: string;
  totalEpisodes: number;
  avgReward: number;
  successRate: number;
  lastTraining?: Date;
  isActive: boolean;
}

export interface UserFeedbackSummary {
  id: string;
  userId: string;
  targetType: string;
  feedbackType: UserFeedbackType;
  rating?: number;
  sentiment?: FeedbackSentiment;
  processed: boolean;
  createdAt: Date;
}

export interface PerformanceTrend {
  metricName: string;
  timeline: Array<{
    timestamp: Date;
    value: number;
    baseline?: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
}

export interface ConceptDriftAlert {
  id: string;
  modelId?: string;
  agentId?: string;
  severity: DriftSeverity;
  driftType: DriftType;
  confidence: number;
  detectedAt: Date;
  status: DriftStatus;
  recommendation: string;
}

export interface OptimizationSuggestion {
  type: 'hyperparameter' | 'architecture' | 'data' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImprovement: number;
  estimatedEffort: string;
  confidence: number;
}

// Enums for TypeScript
export enum RLAgentType {
  Q_LEARNING = 'Q_LEARNING',
  DEEP_Q_NETWORK = 'DEEP_Q_NETWORK',
  POLICY_GRADIENT = 'POLICY_GRADIENT',
  ACTOR_CRITIC = 'ACTOR_CRITIC',
  MULTI_ARMED_BANDIT = 'MULTI_ARMED_BANDIT',
  THOMPSON_SAMPLING = 'THOMPSON_SAMPLING',
  UCB = 'UCB',
  SARSA = 'SARSA',
  TEMPORAL_DIFFERENCE = 'TEMPORAL_DIFFERENCE'
}

export enum RLRewardType {
  IMMEDIATE = 'IMMEDIATE',
  DELAYED = 'DELAYED',
  SPARSE = 'SPARSE',
  SHAPED = 'SHAPED',
  INTRINSIC = 'INTRINSIC',
  EXTRINSIC = 'EXTRINSIC'
}

export enum UserFeedbackType {
  EXPLICIT = 'EXPLICIT',
  IMPLICIT = 'IMPLICIT',
  RATING = 'RATING',
  PREFERENCE = 'PREFERENCE',
  CORRECTION = 'CORRECTION',
  APPROVAL = 'APPROVAL',
  DISAPPROVAL = 'DISAPPROVAL'
}

export enum FeedbackSentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
  MIXED = 'MIXED'
}

export enum PreferenceSource {
  EXPLICIT = 'EXPLICIT',
  IMPLICIT = 'IMPLICIT',
  LEARNED = 'LEARNED',
  INHERITED = 'INHERITED',
  DEFAULT = 'DEFAULT'
}

export enum TuningMethod {
  GRID_SEARCH = 'GRID_SEARCH',
  RANDOM_SEARCH = 'RANDOM_SEARCH',
  BAYESIAN_OPTIMIZATION = 'BAYESIAN_OPTIMIZATION',
  GENETIC_ALGORITHM = 'GENETIC_ALGORITHM',
  SIMULATED_ANNEALING = 'SIMULATED_ANNEALING',
  PARTICLE_SWARM = 'PARTICLE_SWARM',
  HYPERBAND = 'HYPERBAND',
  OPTUNA = 'OPTUNA'
}

export enum DriftType {
  SUDDEN = 'SUDDEN',
  GRADUAL = 'GRADUAL',
  RECURRING = 'RECURRING',
  INCREMENTAL = 'INCREMENTAL',
  CYCLICAL = 'CYCLICAL'
}

export enum DriftSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DriftStatus {
  DETECTED = 'DETECTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  ADAPTING = 'ADAPTING',
  ADAPTED = 'ADAPTED',
  IGNORED = 'IGNORED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export enum AutoMLType {
  NEURAL_ARCHITECTURE_SEARCH = 'NEURAL_ARCHITECTURE_SEARCH',
  AUTOML_PIPELINE = 'AUTOML_PIPELINE',
  FEATURE_SELECTION = 'FEATURE_SELECTION',
  HYPERPARAMETER_OPTIMIZATION = 'HYPERPARAMETER_OPTIMIZATION',
  MODEL_SELECTION = 'MODEL_SELECTION',
  ENSEMBLE_OPTIMIZATION = 'ENSEMBLE_OPTIMIZATION'
}

export enum OnlineLearningType {
  INCREMENTAL = 'INCREMENTAL',
  BATCH_INCREMENTAL = 'BATCH_INCREMENTAL',
  STREAMING = 'STREAMING',
  MINI_BATCH = 'MINI_BATCH',
  STOCHASTIC = 'STOCHASTIC'
}

export enum TransferType {
  WEIGHTS = 'WEIGHTS',
  FEATURES = 'FEATURES',
  KNOWLEDGE = 'KNOWLEDGE',
  POLICY = 'POLICY',
  ARCHITECTURE = 'ARCHITECTURE',
  PARAMETERS = 'PARAMETERS'
}

export enum AdaptationType {
  LEARNING_RATE = 'LEARNING_RATE',
  ARCHITECTURE = 'ARCHITECTURE',
  THRESHOLD = 'THRESHOLD',
  STRATEGY = 'STRATEGY',
  HYPERPARAMETER = 'HYPERPARAMETER',
  POLICY = 'POLICY'
}

// ==================== HYBRID SPRINT 2.1: ADVANCED SECURITY & ANALYTICS TYPES ====================

// Advanced Security Types
export interface OAuthProviderConfig {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  isActive: boolean;
  tenantId?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TwoFactorAuthConfig {
  id: string;
  userId: string;
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  lastUsed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditLogItem {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  action: SecurityAction;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: any;
  riskScore?: number | null;
  details?: any;
  tenantId?: string | null;
  createdAt: Date;
}

export interface ApiRateLimitConfig {
  id: string;
  userId?: string | null;
  ipAddress?: string | null;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
  isBlocked: boolean;
  tenantId?: string | null;
}

export interface PerformanceMetricItem {
  id: string;
  metricType: PerformanceMetricType;
  endpoint?: string | null;
  responseTime: number;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  dbQueryTime?: number | null;
  errorRate?: number | null;
  throughput?: number | null;
  timestamp: Date;
  tenantId?: string | null;
}

// Advanced Dashboard & Analytics Types
export interface DashboardTemplateItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  layout: any;
  widgets: any;
  isPublic: boolean;
  isOfficial: boolean;
  rating: number;
  downloads: number;
  tenantId?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomWidgetItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  component: string;
  config: any;
  dataSource: any;
  isPublic: boolean;
  rating: number;
  downloads: number;
  tenantId?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataImportExportItem {
  id: string;
  name: string;
  type: ImportExportType;
  format: DataFormat;
  source?: string | null;
  destination?: string | null;
  mapping?: any;
  filters?: any;
  status: ImportExportStatus;
  recordsTotal?: number | null;
  recordsSuccess?: number | null;
  recordsError?: number | null;
  errorLog?: string | null;
  schedule?: any;
  lastRun?: Date | null;
  nextRun?: Date | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EtlPipelineItem {
  id: string;
  name: string;
  description?: string | null;
  sourceConfig: any;
  transformConfig: any;
  targetConfig: any;
  schedule?: any;
  isActive: boolean;
  lastRun?: Date | null;
  nextRun?: Date | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  executions?: EtlExecutionItem[];
}

export interface EtlExecutionItem {
  id: string;
  pipelineId: string;
  status: ETLExecutionStatus;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  recordsProcessed?: number | null;
  recordsSuccess?: number | null;
  recordsError?: number | null;
  errorLog?: string | null;
  metrics?: any;
  tenantId: string;
}

export interface ScheduledReportItem {
  id: string;
  reportId: string;
  name: string;
  schedule: any;
  recipients: string[];
  format: ReportFormat;
  parameters?: any;
  isActive: boolean;
  lastRun?: Date | null;
  nextRun?: Date | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  executions?: ReportExecutionItem[];
}

export interface ReportExecutionItem {
  id: string;
  scheduledReportId: string;
  status: ReportExecutionStatus;
  startTime: Date;
  endTime?: Date | null;
  filePath?: string | null;
  fileSize?: number | null;
  errorMessage?: string | null;
  tenantId: string;
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  headers?: any;
  secret?: string | null;
  isActive: boolean;
  retryPolicy?: any;
  lastTriggered?: Date | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deliveries?: WebhookDeliveryItem[];
}

export interface WebhookDeliveryItem {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  httpStatus?: number | null;
  responseBody?: string | null;
  responseTime?: number | null;
  status: WebhookDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataConnectorItem {
  id: string;
  name: string;
  type: ConnectorType;
  config: any;
  credentials: any;
  isActive: boolean;
  lastSync?: Date | null;
  syncInterval?: number | null;
  tenantId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  syncs?: ConnectorSyncItem[];
}

export interface ConnectorSyncItem {
  id: string;
  connectorId: string;
  status: ConnectorSyncStatus;
  startTime: Date;
  endTime?: Date | null;
  recordsSync?: number | null;
  errorMessage?: string | null;
  tenantId: string;
}

// Advanced Analytics Configuration Types
export interface DashboardBuilderConfig {
  id: string;
  name: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  filters: FilterConfig[];
  permissions: PermissionConfig;
  refreshInterval?: number;
  theme?: string;
}

export interface DashboardLayout {
  rows: number;
  columns: number;
  gap: number;
  breakpoints: {
    mobile: GridBreakpoint;
    tablet: GridBreakpoint;
    desktop: GridBreakpoint;
  };
}

export interface GridBreakpoint {
  columns: number;
  containerWidth: number;
  margin: number[];
  padding: number[];
}

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  dataSource: DataSourceConfig;
  visualization: VisualizationConfig;
  filters?: FilterConfig[];
  refreshInterval?: number;
  permissions?: PermissionConfig;
}

export interface DataSourceConfig {
  type: 'API' | 'DATABASE' | 'FILE' | 'REALTIME' | 'CONNECTOR';
  endpoint?: string;
  query?: string;
  parameters?: Record<string, any>;
  mapping?: FieldMapping[];
  authentication?: AuthConfig;
  cache?: CacheConfig;
}

export interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'gauge' | 'table' | 'metric' | 'map';
  axes?: {
    x?: AxisConfig;
    y?: AxisConfig;
  };
  series?: SeriesConfig[];
  colors?: string[];
  style?: StyleConfig;
  interactions?: InteractionConfig;
}

export interface AxisConfig {
  field: string;
  type: 'category' | 'value' | 'time';
  title?: string;
  format?: string;
  scale?: 'linear' | 'log' | 'time';
  domain?: [number, number];
}

export interface SeriesConfig {
  name: string;
  field: string;
  type: string;
  color?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface StyleConfig {
  fontSize?: number;
  fontFamily?: string;
  colors?: string[];
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface InteractionConfig {
  zoom?: boolean;
  pan?: boolean;
  brush?: boolean;
  tooltip?: boolean;
  crossfilter?: boolean;
}

export interface FilterConfig {
  id: string;
  field: string;
  type: 'range' | 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  label: string;
  defaultValue?: any;
  options?: Array<{
    label: string;
    value: any;
  }>;
  dependencies?: string[];
}

export interface FieldMapping {
  source: string;
  target: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  transformation?: string;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth' | 'api-key';
  credentials?: Record<string, string>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  key?: string;
}

export interface PermissionConfig {
  roles: string[];
  users?: string[];
  inherit?: boolean;
}

// Natural Language Query Types
export interface NLQueryRequest {
  query: string;
  context?: {
    userId?: string;
    tenantId?: string;
    filters?: Record<string, any>;
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface NLQueryResponse {
  sql?: string;
  visualization: VisualizationConfig;
  data: any[];
  insights?: string[];
  confidence: number;
  suggestions?: string[];
  error?: string;
}

// AI-Powered Analytics Types
export interface SmartInsight {
  id: string;
  type: 'TREND' | 'ANOMALY' | 'CORRELATION' | 'FORECAST' | 'OPPORTUNITY' | 'RISK';
  title: string;
  description: string;
  data: any;
  visualization?: VisualizationConfig;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actions?: RecommendedAction[];
  timestamp: Date;
  category: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  type: 'INVESTIGATE' | 'OPTIMIZE' | 'ALERT' | 'AUTOMATE' | 'DELEGATE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedImpact: number;
  estimatedEffort: string;
  resources?: string[];
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'SALES_FORECAST' | 'CHURN_PREDICTION' | 'DEMAND_FORECAST' | 'ANOMALY_DETECTION';
  algorithm: string;
  features: string[];
  target: string;
  accuracy: number;
  lastTrained: Date;
  nextTraining?: Date;
  config: Record<string, any>;
}

// Data Quality and Governance Types
export interface DataQualityReport {
  datasetId: string;
  datasetName: string;
  totalRecords: number;
  qualityScore: number;
  completeness: DataQualityDimension;
  accuracy: DataQualityDimension;
  consistency: DataQualityDimension;
  timeliness: DataQualityDimension;
  validity: DataQualityDimension;
  uniqueness: DataQualityDimension;
  issues: DataQualityIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface DataQualityDimension {
  score: number;
  passCount: number;
  failCount: number;
  rules: DataQualityRule[];
}

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity' | 'uniqueness';
  condition: string;
  threshold?: number;
  passed: boolean;
  score: number;
}

export interface DataQualityIssue {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  field?: string;
  records: number;
  examples?: any[];
  suggestion?: string;
}

export interface DataLineageItem {
  id: string;
  name: string;
  type: 'TABLE' | 'VIEW' | 'FILE' | 'API' | 'TRANSFORMATION';
  source?: string;
  targets: string[];
  transformations?: string[];
  lastUpdated: Date;
  metadata: Record<string, any>;
}

// Advanced Security & Compliance Types
export interface SecurityDashboardMetrics {
  overallSecurityScore: number;
  activeThreats: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  failedLoginAttempts: number;
  suspiciousActivities: number;
  complianceScore: number;
  vulnerabilities: SecurityVulnerability[];
  recentIncidents: SecurityIncident[];
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedResources: string[];
  recommendation: string;
  detectedAt: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  riskScore: number;
  status: 'DETECTED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedAt: Date;
  resolvedAt?: Date;
}

export interface ComplianceReport {
  framework: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO_27001';
  overallScore: number;
  controlsTotal: number;
  controlsPassed: number;
  controlsFailed: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface ComplianceFinding {
  id: string;
  control: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
  evidence?: string[];
  remediation?: string;
  dueDate?: Date;
}

// Mobile & PWA Types
export interface PWAConfig {
  enabled: boolean;
  manifest: {
    name: string;
    shortName: string;
    description: string;
    startUrl: string;
    display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
    orientation: 'portrait' | 'landscape' | 'any';
    themeColor: string;
    backgroundColor: string;
    icons: PWAIcon[];
  };
  serviceWorker: {
    enabled: boolean;
    scope: string;
    cachingStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    offlinePages: string[];
  };
  pushNotifications: {
    enabled: boolean;
    vapidKeys: {
      publicKey: string;
      privateKey: string;
    };
  };
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface MobileLayoutConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  navigation: {
    type: 'bottom-tabs' | 'hamburger' | 'drawer';
    items: MobileNavItem[];
  };
  layout: {
    sidebar: boolean;
    header: boolean;
    footer: boolean;
    compact: boolean;
  };
}

export interface MobileNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  hidden?: boolean;
}

// Performance & Monitoring Types
export interface PerformanceDashboard {
  overallScore: number;
  metrics: {
    responseTime: PerformanceMetric;
    throughput: PerformanceMetric;
    errorRate: PerformanceMetric;
    cpuUsage: PerformanceMetric;
    memoryUsage: PerformanceMetric;
    databaseTime: PerformanceMetric;
  };
  alerts: PerformanceAlert[];
  trends: PerformanceTrend[];
  bottlenecks: PerformanceBottleneck[];
}

export interface PerformanceMetric {
  current: number;
  target: number;
  trend: 'improving' | 'degrading' | 'stable';
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  threshold: number;
  currentValue: number;
  endpoint?: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
}

export interface PerformanceBottleneck {
  id: string;
  type: 'DATABASE' | 'API' | 'FRONTEND' | 'NETWORK' | 'MEMORY' | 'CPU';
  location: string;
  impact: number;
  description: string;
  recommendations: string[];
  detectedAt: Date;
}

// API Documentation Types
export interface APIDocumentation {
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: APIServer[];
  paths: Record<string, APIPath>;
  components: {
    schemas: Record<string, APISchema>;
    securitySchemes: Record<string, APISecurityScheme>;
  };
  tags: APITag[];
}

export interface APIServer {
  url: string;
  description: string;
  variables?: Record<string, APIServerVariable>;
}

export interface APIServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface APIPath {
  summary?: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: Record<string, APIResponse>;
  security?: APISecurityRequirement[];
  tags?: string[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema: APISchema;
  example?: any;
}

export interface APIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, APIMediaType>;
}

export interface APIResponse {
  description: string;
  content?: Record<string, APIMediaType>;
  headers?: Record<string, APIHeader>;
}

export interface APIMediaType {
  schema: APISchema;
  example?: any;
  examples?: Record<string, APIExample>;
}

export interface APISchema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, APISchema>;
  required?: string[];
  items?: APISchema;
  enum?: any[];
  example?: any;
}

export interface APIHeader {
  description?: string;
  required?: boolean;
  schema: APISchema;
}

export interface APIExample {
  summary?: string;
  description?: string;
  value: any;
}

export interface APISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: any;
  openIdConnectUrl?: string;
}

export interface APISecurityRequirement {
  [name: string]: string[];
}

export interface APITag {
  name: string;
  description?: string;
  externalDocs?: {
    description: string;
    url: string;
  };
}
