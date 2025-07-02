
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  metadata: AuditMetadata;
  severity: AuditSeverity;
  category: AuditCategory;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  riskScore?: number;
}

export enum AuditAction {
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  
  // Data Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  
  // Dashboard Operations
  DASHBOARD_CREATED = 'DASHBOARD_CREATED',
  DASHBOARD_UPDATED = 'DASHBOARD_UPDATED',
  DASHBOARD_DELETED = 'DASHBOARD_DELETED',
  DASHBOARD_SHARED = 'DASHBOARD_SHARED',
  DASHBOARD_EXPORTED = 'DASHBOARD_EXPORTED',
  
  // Widget Operations
  WIDGET_CREATED = 'WIDGET_CREATED',
  WIDGET_UPDATED = 'WIDGET_UPDATED',
  WIDGET_DELETED = 'WIDGET_DELETED',
  
  // Report Operations
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_SCHEDULED = 'REPORT_SCHEDULED',
  REPORT_EXPORTED = 'REPORT_EXPORTED',
  
  // AI/ML Operations
  MODEL_TRAINED = 'MODEL_TRAINED',
  MODEL_DEPLOYED = 'MODEL_DEPLOYED',
  PREDICTION_GENERATED = 'PREDICTION_GENERATED',
  INSIGHT_CREATED = 'INSIGHT_CREATED',
  
  // System Operations
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  WEBHOOK_CREATED = 'WEBHOOK_CREATED',
  
  // Security Events
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Business Events
  INVOICE_CREATED = 'INVOICE_CREATED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  SECURITY = 'SECURITY',
  BUSINESS = 'BUSINESS',
  COMPLIANCE = 'COMPLIANCE',
  PERFORMANCE = 'PERFORMANCE',
}

export interface AuditMetadata {
  correlationId?: string;
  requestId?: string;
  version: string;
  environment: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  device?: {
    type: string;
    os?: string;
    browser?: string;
  };
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  severity?: AuditSeverity;
  category?: AuditCategory;
  tenantId?: string;
  outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  riskScore?: { min?: number; max?: number };
}

export interface AuditSearchResult {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  aggregations?: {
    byAction: Record<AuditAction, number>;
    bySeverity: Record<AuditSeverity, number>;
    byCategory: Record<AuditCategory, number>;
    byOutcome: Record<string, number>;
  };
}

class AuditService {
  private static instance: AuditService | null = null;
  private eventQueue: AuditEvent[] = [];
  private isProcessing = false;
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds

  private constructor() {
    // Start background processing
    this.startBackgroundProcessing();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // Log audit event
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Calculate risk score
    auditEvent.riskScore = this.calculateRiskScore(auditEvent);

    // Add to queue for batch processing
    this.eventQueue.push(auditEvent);

    // Immediate processing for high-severity events
    if (auditEvent.severity === AuditSeverity.CRITICAL) {
      await this.flushEvents();
    }
  }

  // Quick logging methods
  async logLogin(userId: string, success: boolean, metadata: Partial<AuditMetadata> = {}): Promise<void> {
    await this.logEvent({
      userId,
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      resource: 'AUTH',
      details: { success },
      metadata: { ...this.getDefaultMetadata(), ...metadata },
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      category: AuditCategory.AUTHENTICATION,
      outcome: success ? 'SUCCESS' : 'FAILURE',
    });
  }

  async logLogout(userId: string, metadata: Partial<AuditMetadata> = {}): Promise<void> {
    await this.logEvent({
      userId,
      action: AuditAction.LOGOUT,
      resource: 'AUTH',
      details: {},
      metadata: { ...this.getDefaultMetadata(), ...metadata },
      severity: AuditSeverity.LOW,
      category: AuditCategory.AUTHENTICATION,
      outcome: 'SUCCESS',
    });
  }

  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    details: Record<string, any> = {},
    tenantId?: string
  ): Promise<void> {
    const actionMap = {
      read: AuditAction.READ,
      create: AuditAction.CREATE,
      update: AuditAction.UPDATE,
      delete: AuditAction.DELETE,
    };

    await this.logEvent({
      userId,
      action: actionMap[action],
      resource,
      resourceId,
      details,
      metadata: this.getDefaultMetadata(),
      severity: action === 'delete' ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      category: action === 'read' ? AuditCategory.DATA_ACCESS : AuditCategory.DATA_MODIFICATION,
      tenantId,
      outcome: 'SUCCESS',
    });
  }

  async logSecurityEvent(
    action: AuditAction,
    details: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.HIGH,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'SECURITY',
      details,
      metadata: this.getDefaultMetadata(),
      severity,
      category: AuditCategory.SECURITY,
      tenantId,
      outcome: 'SUCCESS',
    });
  }

  async logBusinessEvent(
    action: AuditAction,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      resourceId,
      details,
      metadata: this.getDefaultMetadata(),
      severity: AuditSeverity.LOW,
      category: AuditCategory.BUSINESS,
      tenantId,
      outcome: 'SUCCESS',
    });
  }

  // Search audit events
  async searchEvents(
    filter: AuditFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<AuditSearchResult> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll return mock data
      const mockEvents: AuditEvent[] = [];
      
      return {
        events: mockEvents,
        total: 0,
        page,
        limit,
        aggregations: {
          byAction: {} as Record<AuditAction, number>,
          bySeverity: {} as Record<AuditSeverity, number>,
          byCategory: {} as Record<AuditCategory, number>,
          byOutcome: {},
        },
      };
    } catch (error) {
      console.error('Error searching audit events:', error);
      throw error;
    }
  }

  // Get audit statistics
  async getAuditStatistics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number;
    eventsByDay: Array<{ date: string; count: number }>;
    topActions: Array<{ action: AuditAction; count: number }>;
    securityAlerts: number;
    highRiskEvents: number;
  }> {
    // Mock implementation
    return {
      totalEvents: 0,
      eventsByDay: [],
      topActions: [],
      securityAlerts: 0,
      highRiskEvents: 0,
    };
  }

  // Export audit events
  async exportEvents(
    filter: AuditFilter,
    format: 'csv' | 'json' | 'excel' = 'csv'
  ): Promise<Blob> {
    const events = await this.searchEvents(filter, 1, 10000);
    
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(events.events, null, 2)], {
          type: 'application/json',
        });
      
      case 'csv':
        const csv = this.convertToCSV(events.events);
        return new Blob([csv], { type: 'text/csv' });
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Compliance report generation
  async generateComplianceReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    standard: 'SOX' | 'GDPR' | 'ISO27001' | 'PCI-DSS'
  ): Promise<{
    period: { start: Date; end: Date };
    standard: string;
    compliance: {
      score: number;
      violations: Array<{
        requirement: string;
        severity: string;
        count: number;
        examples: AuditEvent[];
      }>;
    };
    recommendations: string[];
  }> {
    // Mock implementation for compliance reporting
    return {
      period: { start: startDate, end: endDate },
      standard,
      compliance: {
        score: 85,
        violations: [],
      },
      recommendations: [],
    };
  }

  // Private methods
  private calculateRiskScore(event: AuditEvent): number {
    let score = 0;

    // Base score by severity
    switch (event.severity) {
      case AuditSeverity.CRITICAL:
        score += 80;
        break;
      case AuditSeverity.HIGH:
        score += 60;
        break;
      case AuditSeverity.MEDIUM:
        score += 40;
        break;
      case AuditSeverity.LOW:
        score += 20;
        break;
    }

    // Action-specific scoring
    const highRiskActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.PERMISSION_GRANTED,
      AuditAction.ROLE_CHANGED,
      AuditAction.DELETE,
    ];

    if (highRiskActions.includes(event.action)) {
      score += 20;
    }

    // Outcome scoring
    if (event.outcome === 'FAILURE') {
      score += 30;
    }

    // Time-based scoring (off-hours activity)
    const hour = event.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private getDefaultMetadata(): AuditMetadata {
    return {
      version: '2.2.0',
      environment: process.env.NODE_ENV || 'development',
      correlationId: crypto.randomUUID(),
    };
  }

  private async flushEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const eventsToProcess = this.eventQueue.splice(0, this.batchSize);
      
      // In a real implementation, this would save to database
      await this.persistEvents(eventsToProcess);
      
      console.log(`Processed ${eventsToProcess.length} audit events`);
    } catch (error) {
      console.error('Error processing audit events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...this.eventQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private async persistEvents(events: AuditEvent[]): Promise<void> {
    // Mock persistence - in real implementation, save to database
    for (const event of events) {
      console.log('Audit Event:', {
        timestamp: event.timestamp.toISOString(),
        action: event.action,
        resource: event.resource,
        userId: event.userId,
        severity: event.severity,
        riskScore: event.riskScore,
      });
    }
  }

  private startBackgroundProcessing(): void {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = [
      'Timestamp',
      'User ID',
      'Action',
      'Resource',
      'Resource ID',
      'Severity',
      'Category',
      'Outcome',
      'Risk Score',
      'IP Address',
      'Details',
    ];

    const rows = events.map(event => [
      event.timestamp.toISOString(),
      event.userId || '',
      event.action,
      event.resource,
      event.resourceId || '',
      event.severity,
      event.category,
      event.outcome,
      event.riskScore?.toString() || '',
      event.ipAddress || '',
      JSON.stringify(event.details),
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }
}

export const auditService = AuditService.getInstance();

// Audit logging utilities
export const auditLogger = {
  async logAction(
    action: AuditAction,
    resource: string,
    details: Record<string, any> = {},
    resourceId?: string
  ) {
    try {
      await auditService.logEvent({
        action,
        resource,
        resourceId,
        details,
        metadata: {
          version: '2.2.0',
          environment: process.env.NODE_ENV || 'development',
          requestId: crypto.randomUUID(),
        },
        severity: AuditSeverity.LOW,
        category: AuditCategory.DATA_ACCESS,
        outcome: 'SUCCESS',
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  },

  async logError(
    action: AuditAction,
    resource: string,
    error: Error,
    resourceId?: string
  ) {
    try {
      await auditService.logEvent({
        action,
        resource,
        resourceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        metadata: {
          version: '2.2.0',
          environment: process.env.NODE_ENV || 'development',
          requestId: crypto.randomUUID(),
        },
        severity: AuditSeverity.HIGH,
        category: AuditCategory.SECURITY,
        outcome: 'FAILURE',
      });
    } catch (auditError) {
      console.error('Failed to log audit error:', auditError);
    }
  },
};
