
// SPRINT 2.8 - Self-Healing System Service
import { prisma } from '@/lib/db'
import { SystemStatus, IncidentSeverity, IncidentStatus } from '@prisma/client'

export interface HealthCheck {
  component: string
  status: SystemStatus
  metrics: any
  issues?: string[]
  lastCheck: Date
}

export interface HealingAction {
  action: string
  component: string
  description: string
  severity: IncidentSeverity
  automated: boolean
  estimatedTime: number // minutes
}

export interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  database: {
    connections: number
    responseTime: number
    errorRate: number
  }
  api: {
    responseTime: number
    errorRate: number
    throughput: number
  }
}

export class SelfHealingService {
  private static instance: SelfHealingService
  private healthChecks: Map<string, HealthCheck> = new Map()
  private healingActions: Map<string, HealingAction[]> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertThresholds: any = {
    cpu: 80,
    memory: 85,
    disk: 90,
    responseTime: 5000,
    errorRate: 0.05
  }

  static getInstance(): SelfHealingService {
    if (!SelfHealingService.instance) {
      SelfHealingService.instance = new SelfHealingService()
    }
    return SelfHealingService.instance
  }

  constructor() {
    this.initializeHealingActions()
  }

  private initializeHealingActions(): void {
    // Database healing actions
    this.healingActions.set('DATABASE', [
      {
        action: 'restart_connection_pool',
        component: 'DATABASE',
        description: 'Restart database connection pool',
        severity: IncidentSeverity.MEDIUM,
        automated: true,
        estimatedTime: 1
      },
      {
        action: 'optimize_queries',
        component: 'DATABASE',
        description: 'Run query optimization',
        severity: IncidentSeverity.HIGH,
        automated: true,
        estimatedTime: 5
      },
      {
        action: 'clear_cache',
        component: 'DATABASE',
        description: 'Clear database cache',
        severity: IncidentSeverity.LOW,
        automated: true,
        estimatedTime: 1
      }
    ])

    // API healing actions
    this.healingActions.set('API', [
      {
        action: 'restart_service',
        component: 'API',
        description: 'Restart API service',
        severity: IncidentSeverity.HIGH,
        automated: true,
        estimatedTime: 2
      },
      {
        action: 'scale_up',
        component: 'API',
        description: 'Scale up API instances',
        severity: IncidentSeverity.MEDIUM,
        automated: true,
        estimatedTime: 3
      },
      {
        action: 'enable_circuit_breaker',
        component: 'API',
        description: 'Enable circuit breaker pattern',
        severity: IncidentSeverity.LOW,
        automated: true,
        estimatedTime: 1
      }
    ])

    // Cache healing actions
    this.healingActions.set('CACHE', [
      {
        action: 'clear_cache',
        component: 'CACHE',
        description: 'Clear application cache',
        severity: IncidentSeverity.LOW,
        automated: true,
        estimatedTime: 1
      },
      {
        action: 'restart_redis',
        component: 'CACHE',
        description: 'Restart Redis service',
        severity: IncidentSeverity.MEDIUM,
        automated: true,
        estimatedTime: 2
      }
    ])

    // ML Pipeline healing actions
    this.healingActions.set('ML_PIPELINE', [
      {
        action: 'restart_ml_service',
        component: 'ML_PIPELINE',
        description: 'Restart ML processing service',
        severity: IncidentSeverity.MEDIUM,
        automated: true,
        estimatedTime: 3
      },
      {
        action: 'reload_models',
        component: 'ML_PIPELINE',
        description: 'Reload ML models',
        severity: IncidentSeverity.LOW,
        automated: true,
        estimatedTime: 2
      }
    ])
  }

  async startMonitoring(tenantId: string): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    console.log(`Starting self-healing monitoring for tenant ${tenantId}`)

    // Run health checks every 60 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks(tenantId)
    }, 60000)

    // Perform initial health check
    await this.performHealthChecks(tenantId)
  }

  async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    console.log('Self-healing monitoring stopped')
  }

  private async performHealthChecks(tenantId: string): Promise<void> {
    try {
      const components = ['DATABASE', 'API', 'CACHE', 'ML_PIPELINE', 'STORAGE']
      
      for (const component of components) {
        await this.checkComponentHealth(component, tenantId)
      }
    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  private async checkComponentHealth(component: string, tenantId: string): Promise<void> {
    try {
      const metrics = await this.gatherComponentMetrics(component)
      const healthScore = this.calculateHealthScore(metrics, component)
      const status = this.determineHealthStatus(healthScore, metrics)
      const issues = this.identifyIssues(metrics, component)

      const healthCheck: HealthCheck = {
        component,
        status,
        metrics,
        issues,
        lastCheck: new Date()
      }

      // Store health check
      this.healthChecks.set(component, healthCheck)

      // Save to database
      const existingRecord = await prisma.systemHealth.findFirst({
        where: {
          tenantId,
          component
        }
      })

      if (existingRecord) {
        await prisma.systemHealth.update({
          where: { id: existingRecord.id },
          data: {
            healthScore,
            status,
            metrics,
            issues,
            updatedAt: new Date()
          }
        })
      } else {
        await prisma.systemHealth.create({
          data: {
            component,
            healthScore,
            status,
            metrics,
            issues,
            tenantId
          }
        })
      }

      // Trigger healing if needed
      if (status !== SystemStatus.HEALTHY && issues.length > 0) {
        await this.triggerHealing(component, status, issues, tenantId)
      }

    } catch (error) {
      console.error(`Health check failed for ${component}:`, error)
      
      // Mark component as unhealthy
      await this.markComponentUnhealthy(component, tenantId, error instanceof Error ? error.message : String(error))
    }
  }

  private async gatherComponentMetrics(component: string): Promise<any> {
    switch (component) {
      case 'DATABASE':
        return await this.getDatabaseMetrics()
      
      case 'API':
        return await this.getAPIMetrics()
      
      case 'CACHE':
        return await this.getCacheMetrics()
      
      case 'ML_PIPELINE':
        return await this.getMLPipelineMetrics()
      
      case 'STORAGE':
        return await this.getStorageMetrics()
      
      default:
        return {}
    }
  }

  private async getDatabaseMetrics(): Promise<any> {
    try {
      // Simulate database metrics gathering
      const startTime = Date.now()
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`
      
      const responseTime = Date.now() - startTime

      // Get connection count (simulated)
      const connections = Math.floor(Math.random() * 50) + 10

      return {
        responseTime,
        connections,
        errorRate: Math.random() * 0.02, // 0-2% error rate
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100
      }
    } catch (error) {
      return {
        responseTime: 10000,
        connections: 0,
        errorRate: 1.0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async getAPIMetrics(): Promise<any> {
    // Simulate API metrics
    return {
      responseTime: Math.random() * 3000 + 100,
      errorRate: Math.random() * 0.05,
      throughput: Math.random() * 1000 + 100,
      cpu: Math.random() * 100,
      memory: Math.random() * 100
    }
  }

  private async getCacheMetrics(): Promise<any> {
    // Simulate cache metrics
    return {
      hitRate: Math.random() * 0.3 + 0.7, // 70-100% hit rate
      memory: Math.random() * 100,
      connections: Math.floor(Math.random() * 20) + 5,
      errorRate: Math.random() * 0.01
    }
  }

  private async getMLPipelineMetrics(): Promise<any> {
    // Simulate ML pipeline metrics
    return {
      modelsLoaded: Math.floor(Math.random() * 10) + 5,
      avgPredictionTime: Math.random() * 500 + 50,
      errorRate: Math.random() * 0.03,
      cpu: Math.random() * 100,
      memory: Math.random() * 100
    }
  }

  private async getStorageMetrics(): Promise<any> {
    // Simulate storage metrics
    return {
      diskUsage: Math.random() * 100,
      iops: Math.random() * 1000 + 100,
      throughput: Math.random() * 500 + 50,
      errorRate: Math.random() * 0.01
    }
  }

  private calculateHealthScore(metrics: any, component: string): number {
    let score = 100

    // Apply component-specific scoring
    switch (component) {
      case 'DATABASE':
        if (metrics.responseTime > this.alertThresholds.responseTime) score -= 30
        if (metrics.errorRate > this.alertThresholds.errorRate) score -= 40
        if (metrics.cpu > this.alertThresholds.cpu) score -= 20
        if (metrics.memory > this.alertThresholds.memory) score -= 10
        break

      case 'API':
        if (metrics.responseTime > this.alertThresholds.responseTime) score -= 25
        if (metrics.errorRate > this.alertThresholds.errorRate) score -= 35
        if (metrics.cpu > this.alertThresholds.cpu) score -= 20
        if (metrics.memory > this.alertThresholds.memory) score -= 20
        break

      case 'CACHE':
        if (metrics.hitRate < 0.7) score -= 30
        if (metrics.memory > this.alertThresholds.memory) score -= 25
        if (metrics.errorRate > this.alertThresholds.errorRate) score -= 45
        break
    }

    return Math.max(0, Math.min(100, score))
  }

  private determineHealthStatus(healthScore: number, metrics: any): SystemStatus {
    if (metrics.error) return SystemStatus.DOWN
    if (healthScore >= 90) return SystemStatus.HEALTHY
    if (healthScore >= 70) return SystemStatus.WARNING
    if (healthScore >= 40) return SystemStatus.CRITICAL
    return SystemStatus.DOWN
  }

  private identifyIssues(metrics: any, component: string): string[] {
    const issues: string[] = []

    if (metrics.error) {
      issues.push(`Component error: ${metrics.error}`)
    }

    if (metrics.responseTime > this.alertThresholds.responseTime) {
      issues.push(`High response time: ${metrics.responseTime}ms`)
    }

    if (metrics.errorRate > this.alertThresholds.errorRate) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`)
    }

    if (metrics.cpu > this.alertThresholds.cpu) {
      issues.push(`High CPU usage: ${metrics.cpu.toFixed(1)}%`)
    }

    if (metrics.memory > this.alertThresholds.memory) {
      issues.push(`High memory usage: ${metrics.memory.toFixed(1)}%`)
    }

    if (component === 'CACHE' && metrics.hitRate < 0.7) {
      issues.push(`Low cache hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`)
    }

    return issues
  }

  private async triggerHealing(
    component: string,
    status: SystemStatus,
    issues: string[],
    tenantId: string
  ): Promise<void> {
    try {
      const severity = this.determineSeverity(status, issues)
      
      // Create incident
      const incident = await prisma.systemIncident.create({
        data: {
          healthId: await this.getHealthId(component, tenantId),
          severity,
          title: `${component} Health Issue`,
          description: `Issues detected: ${issues.join(', ')}`,
          detectedAt: new Date(),
          tenantId
        }
      })

      // Get appropriate healing actions
      const actions = this.healingActions.get(component) || []
      const applicableActions = actions.filter(action => 
        this.isActionApplicable(action, severity, issues)
      )

      if (applicableActions.length > 0) {
        await this.executeHealingActions(applicableActions, incident.id, tenantId)
      } else {
        console.warn(`No applicable healing actions for ${component}`)
      }

    } catch (error) {
      console.error('Failed to trigger healing:', error)
    }
  }

  private async getHealthId(component: string, tenantId: string): Promise<string> {
    const health = await prisma.systemHealth.findFirst({
      where: { component, tenantId }
    })
    return health?.id || ''
  }

  private determineSeverity(status: SystemStatus, issues: string[]): IncidentSeverity {
    if (status === SystemStatus.DOWN) return IncidentSeverity.CRITICAL
    if (status === SystemStatus.CRITICAL) return IncidentSeverity.HIGH
    if (issues.length > 2) return IncidentSeverity.MEDIUM
    return IncidentSeverity.LOW
  }

  private isActionApplicable(
    action: HealingAction,
    severity: IncidentSeverity,
    issues: string[]
  ): boolean {
    // Check if action severity matches incident severity
    const severityLevels = {
      [IncidentSeverity.LOW]: 1,
      [IncidentSeverity.MEDIUM]: 2,
      [IncidentSeverity.HIGH]: 3,
      [IncidentSeverity.CRITICAL]: 4
    }

    const actionLevel = severityLevels[action.severity]
    const incidentLevel = severityLevels[severity]

    // Action can be applied if its severity is <= incident severity
    if (actionLevel > incidentLevel) return false

    // Check for specific issue patterns
    const issueText = issues.join(' ').toLowerCase()
    
    if (action.action.includes('cache') && !issueText.includes('cache')) return false
    if (action.action.includes('connection') && !issueText.includes('connection')) return false
    if (action.action.includes('memory') && !issueText.includes('memory')) return false

    return true
  }

  private async executeHealingActions(
    actions: HealingAction[],
    incidentId: string,
    tenantId: string
  ): Promise<void> {
    const executedActions: string[] = []

    for (const action of actions) {
      try {
        console.log(`Executing healing action: ${action.action} for ${action.component}`)
        
        const success = await this.executeAction(action)
        
        if (success) {
          executedActions.push(action.description)
        }

        // Wait between actions
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Healing action ${action.action} failed:`, error)
      }
    }

    // Update incident with resolution actions
    await prisma.systemIncident.update({
      where: { id: incidentId },
      data: {
        resolutionActions: executedActions,
        autoResolved: executedActions.length > 0,
        resolvedAt: executedActions.length > 0 ? new Date() : undefined,
        status: executedActions.length > 0 ? IncidentStatus.RESOLVED : IncidentStatus.OPEN
      }
    })

    // Update system health
    if (executedActions.length > 0) {
      const component = actions[0].component
      await this.updateSystemHealthAfterHealing(component, tenantId, executedActions)
    }
  }

  private async executeAction(action: HealingAction): Promise<boolean> {
    try {
      switch (action.action) {
        case 'restart_connection_pool':
          return await this.restartConnectionPool()
        
        case 'optimize_queries':
          return await this.optimizeQueries()
        
        case 'clear_cache':
          return await this.clearCache()
        
        case 'restart_service':
          return await this.restartService(action.component)
        
        case 'scale_up':
          return await this.scaleUp(action.component)
        
        case 'enable_circuit_breaker':
          return await this.enableCircuitBreaker()
        
        case 'restart_redis':
          return await this.restartRedis()
        
        case 'restart_ml_service':
          return await this.restartMLService()
        
        case 'reload_models':
          return await this.reloadMLModels()
        
        default:
          console.warn(`Unknown healing action: ${action.action}`)
          return false
      }
    } catch (error) {
      console.error(`Action ${action.action} execution failed:`, error)
      return false
    }
  }

  // Healing action implementations
  private async restartConnectionPool(): Promise<boolean> {
    console.log('Restarting database connection pool...')
    // Simulate connection pool restart
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
  }

  private async optimizeQueries(): Promise<boolean> {
    console.log('Running query optimization...')
    // Simulate query optimization
    await new Promise(resolve => setTimeout(resolve, 3000))
    return true
  }

  private async clearCache(): Promise<boolean> {
    console.log('Clearing application cache...')
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 500))
    return true
  }

  private async restartService(component: string): Promise<boolean> {
    console.log(`Restarting ${component} service...`)
    // Simulate service restart
    await new Promise(resolve => setTimeout(resolve, 2000))
    return true
  }

  private async scaleUp(component: string): Promise<boolean> {
    console.log(`Scaling up ${component}...`)
    // Simulate scaling
    await new Promise(resolve => setTimeout(resolve, 3000))
    return true
  }

  private async enableCircuitBreaker(): Promise<boolean> {
    console.log('Enabling circuit breaker...')
    // Simulate circuit breaker activation
    await new Promise(resolve => setTimeout(resolve, 500))
    return true
  }

  private async restartRedis(): Promise<boolean> {
    console.log('Restarting Redis...')
    // Simulate Redis restart
    await new Promise(resolve => setTimeout(resolve, 2000))
    return true
  }

  private async restartMLService(): Promise<boolean> {
    console.log('Restarting ML service...')
    // Simulate ML service restart
    await new Promise(resolve => setTimeout(resolve, 3000))
    return true
  }

  private async reloadMLModels(): Promise<boolean> {
    console.log('Reloading ML models...')
    // Simulate model reloading
    await new Promise(resolve => setTimeout(resolve, 2000))
    return true
  }

  private async updateSystemHealthAfterHealing(
    component: string,
    tenantId: string,
    actions: string[]
  ): Promise<void> {
    try {
      await prisma.systemHealth.updateMany({
        where: { component, tenantId },
        data: {
          lastHealed: new Date(),
          healingActions: actions
        }
      })
    } catch (error) {
      console.error('Failed to update system health after healing:', error)
    }
  }

  private async markComponentUnhealthy(
    component: string,
    tenantId: string,
    error: string
  ): Promise<void> {
    try {
      const existingRecord = await prisma.systemHealth.findFirst({
        where: {
          tenantId,
          component
        }
      })

      if (existingRecord) {
        await prisma.systemHealth.update({
          where: { id: existingRecord.id },
          data: {
            healthScore: 0,
            status: SystemStatus.DOWN,
            issues: [error],
            updatedAt: new Date()
          }
        })
      } else {
        await prisma.systemHealth.create({
          data: {
            component,
            healthScore: 0,
            status: SystemStatus.DOWN,
            metrics: { error },
            issues: [error],
            tenantId
          }
        })
      }
    } catch (dbError) {
      console.error('Failed to mark component unhealthy:', dbError)
    }
  }

  async getSystemHealthOverview(tenantId: string): Promise<any> {
    try {
      const healthChecks = await prisma.systemHealth.findMany({
        where: { tenantId },
        include: {
          incidents: {
            where: { status: { not: IncidentStatus.CLOSED } },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      const overview = {
        overallHealth: this.calculateOverallHealth(healthChecks),
        componentHealth: healthChecks.map(hc => ({
          component: hc.component,
          status: hc.status,
          healthScore: hc.healthScore,
          lastCheck: hc.updatedAt,
          openIncidents: hc.incidents.length
        })),
        activeIncidents: healthChecks.flatMap(hc => hc.incidents).length,
        autoHealingEnabled: true,
        lastHealingAction: this.getLastHealingAction(healthChecks)
      }

      return overview
    } catch (error) {
      console.error('Failed to get system health overview:', error)
      return { error: 'Failed to get health overview' }
    }
  }

  private calculateOverallHealth(healthChecks: any[]): string {
    if (healthChecks.length === 0) return 'unknown'

    const avgScore = healthChecks.reduce((sum, hc) => sum + hc.healthScore, 0) / healthChecks.length
    
    if (avgScore >= 90) return 'healthy'
    if (avgScore >= 70) return 'warning'
    if (avgScore >= 40) return 'critical'
    return 'down'
  }

  private getLastHealingAction(healthChecks: any[]): Date | null {
    const lastHealed = healthChecks
      .map(hc => hc.lastHealed)
      .filter(date => date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return lastHealed[0] || null
  }
}

export const selfHealing = SelfHealingService.getInstance()
