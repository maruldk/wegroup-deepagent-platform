
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

export interface AIServiceMetrics {
  serviceName: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  cpuUsage: number;
  memoryUsage: number;
  modelAccuracy?: number;
  requestsPerSecond: number;
  activeConnections: number;
}

export interface SystemHealthMetrics {
  overall: PerformanceMetric;
  api: PerformanceMetric;
  database: PerformanceMetric;
  ai: PerformanceMetric;
  frontend: PerformanceMetric;
  realtime: PerformanceMetric;
}

export class AIPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private serviceMetrics: Map<string, AIServiceMetrics> = new Map();
  private alertThresholds: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeThresholds();
    this.startMonitoring();
  }

  private initializeThresholds(): void {
    // Set performance thresholds
    this.alertThresholds.set('response_time', 500); // ms
    this.alertThresholds.set('error_rate', 5); // %
    this.alertThresholds.set('cpu_usage', 80); // %
    this.alertThresholds.set('memory_usage', 85); // %
    this.alertThresholds.set('throughput', 100); // requests/sec
    this.alertThresholds.set('availability', 99); // %
  }

  private startMonitoring(): void {
    // Real-time performance monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Every 5 seconds

    // Health check every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect AI service metrics
      await this.collectAIServiceMetrics();
      
      // Collect system metrics
      await this.collectSystemMetrics();
      
      // Collect frontend metrics
      await this.collectFrontendMetrics();
      
      // Analyze trends
      this.analyzeTrends();
      
      // Check for alerts
      this.checkAlerts();
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  private async collectAIServiceMetrics(): Promise<void> {
    // Simulate AI service metrics collection
    const services = [
      'lead_scoring_service',
      'churn_prediction_service',
      'recommendation_engine',
      'sentiment_analyzer',
      'anomaly_detector'
    ];

    for (const service of services) {
      const metrics: AIServiceMetrics = {
        serviceName: service,
        responseTime: Math.random() * 200 + 50, // 50-250ms
        throughput: Math.random() * 500 + 100, // 100-600 req/sec
        errorRate: Math.random() * 2, // 0-2%
        availability: 98 + Math.random() * 2, // 98-100%
        cpuUsage: Math.random() * 40 + 20, // 20-60%
        memoryUsage: Math.random() * 30 + 40, // 40-70%
        modelAccuracy: 0.85 + Math.random() * 0.1, // 85-95%
        requestsPerSecond: Math.random() * 50 + 25, // 25-75 req/sec
        activeConnections: Math.floor(Math.random() * 100) + 10 // 10-110
      };

      this.serviceMetrics.set(service, metrics);
      this.addMetric('ai_service_response_time', metrics.responseTime, 'ms');
      this.addMetric('ai_service_throughput', metrics.throughput, 'req/sec');
      this.addMetric('ai_service_error_rate', metrics.errorRate, '%');
    }
  }

  private async collectSystemMetrics(): Promise<void> {
    // Database metrics
    const dbMetrics = {
      responseTime: Math.random() * 50 + 10, // 10-60ms
      connections: Math.floor(Math.random() * 50) + 10, // 10-60
      queryTime: Math.random() * 100 + 20, // 20-120ms
      diskUsage: Math.random() * 20 + 60 // 60-80%
    };

    this.addMetric('database_response_time', dbMetrics.responseTime, 'ms');
    this.addMetric('database_connections', dbMetrics.connections, 'count');

    // API metrics
    const apiMetrics = {
      responseTime: Math.random() * 100 + 50, // 50-150ms
      requestsPerSecond: Math.random() * 200 + 100, // 100-300 req/sec
      errorRate: Math.random() * 1, // 0-1%
      p95ResponseTime: Math.random() * 200 + 100 // 100-300ms
    };

    this.addMetric('api_response_time', apiMetrics.responseTime, 'ms');
    this.addMetric('api_throughput', apiMetrics.requestsPerSecond, 'req/sec');
    this.addMetric('api_error_rate', apiMetrics.errorRate, '%');
  }

  private async collectFrontendMetrics(): Promise<void> {
    // Frontend performance metrics (simulated)
    const frontendMetrics = {
      loadTime: Math.random() * 1000 + 500, // 0.5-1.5s
      firstContentfulPaint: Math.random() * 800 + 200, // 0.2-1.0s
      largestContentfulPaint: Math.random() * 1500 + 1000, // 1.0-2.5s
      cumulativeLayoutShift: Math.random() * 0.1, // 0-0.1
      firstInputDelay: Math.random() * 50 + 10, // 10-60ms
      bundleSize: Math.random() * 500 + 1000 // 1.0-1.5MB
    };

    this.addMetric('frontend_load_time', frontendMetrics.loadTime, 'ms');
    this.addMetric('frontend_fcp', frontendMetrics.firstContentfulPaint, 'ms');
    this.addMetric('frontend_lcp', frontendMetrics.largestContentfulPaint, 'ms');
    this.addMetric('frontend_cls', frontendMetrics.cumulativeLayoutShift, 'score');
    this.addMetric('frontend_fid', frontendMetrics.firstInputDelay, 'ms');
  }

  private addMetric(name: string, value: number, unit: string): void {
    const threshold = this.alertThresholds.get(name) || 100;
    let status: PerformanceMetric['status'] = 'excellent';
    
    if (value >= threshold * 0.9) status = 'critical';
    else if (value >= threshold * 0.7) status = 'warning';
    else if (value >= threshold * 0.5) status = 'good';

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      threshold,
      status,
      trend: 'stable', // Will be calculated in analyzeTrends
      timestamp: new Date().toISOString()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 100 metrics
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    this.metrics.set(name, metricHistory);
  }

  private analyzeTrends(): void {
    for (const [name, metricHistory] of this.metrics) {
      if (metricHistory.length < 5) continue;

      const recent = metricHistory.slice(-5);
      const older = metricHistory.slice(-10, -5);

      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

      let trend: PerformanceMetric['trend'] = 'stable';
      const change = (recentAvg - olderAvg) / olderAvg;

      if (Math.abs(change) > 0.1) {
        trend = change > 0 ? 'degrading' : 'improving';
      }

      // Update latest metric with trend
      const latestMetric = metricHistory[metricHistory.length - 1];
      latestMetric.trend = trend;
    }
  }

  private checkAlerts(): void {
    const criticalMetrics = [];
    
    for (const [name, metricHistory] of this.metrics) {
      const latest = metricHistory[metricHistory.length - 1];
      if (latest?.status === 'critical') {
        criticalMetrics.push(latest);
      }
    }

    if (criticalMetrics.length > 0) {
      this.triggerAlert(criticalMetrics);
    }
  }

  private triggerAlert(metrics: PerformanceMetric[]): void {
    console.warn('🚨 Performance Alert:', metrics.map(m => 
      `${m.name}: ${m.value}${m.unit} (threshold: ${m.threshold}${m.unit})`
    ));

    // In production, this would send alerts to monitoring systems
  }

  private async performHealthCheck(): Promise<void> {
    const healthMetrics = this.getSystemHealthMetrics();
    
    console.log('🔍 System Health Check:', {
      overall: healthMetrics.overall.status,
      ai: healthMetrics.ai.status,
      api: healthMetrics.api.status,
      database: healthMetrics.database.status,
      frontend: healthMetrics.frontend.status
    });
  }

  public getSystemHealthMetrics(): SystemHealthMetrics {
    const calculateOverallMetric = (category: string): PerformanceMetric => {
      const categoryMetrics = Array.from(this.metrics.entries())
        .filter(([name]) => name.includes(category))
        .map(([, history]) => history[history.length - 1])
        .filter(Boolean);

      if (categoryMetrics.length === 0) {
        return {
          name: category,
          value: 100,
          unit: 'score',
          threshold: 100,
          status: 'excellent',
          trend: 'stable',
          timestamp: new Date().toISOString()
        };
      }

      const avgValue = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
      const criticalCount = categoryMetrics.filter(m => m.status === 'critical').length;
      const warningCount = categoryMetrics.filter(m => m.status === 'warning').length;

      let status: PerformanceMetric['status'] = 'excellent';
      if (criticalCount > 0) status = 'critical';
      else if (warningCount > categoryMetrics.length / 2) status = 'warning';
      else if (warningCount > 0) status = 'good';

      return {
        name: category,
        value: avgValue,
        unit: 'score',
        threshold: 100,
        status,
        trend: 'stable',
        timestamp: new Date().toISOString()
      };
    };

    return {
      overall: calculateOverallMetric('overall'),
      api: calculateOverallMetric('api'),
      database: calculateOverallMetric('database'),
      ai: calculateOverallMetric('ai_service'),
      frontend: calculateOverallMetric('frontend'),
      realtime: calculateOverallMetric('realtime')
    };
  }

  public getPerformanceReport(): {
    summary: any;
    trends: any;
    services: AIServiceMetrics[];
    recommendations: string[];
  } {
    const healthMetrics = this.getSystemHealthMetrics();
    const services = Array.from(this.serviceMetrics.values());
    
    // Generate performance summary
    const summary = {
      overallHealth: healthMetrics.overall.status,
      criticalIssues: Array.from(this.metrics.values())
        .flat()
        .filter(m => m.status === 'critical').length,
      avgResponseTime: services.reduce((sum, s) => sum + s.responseTime, 0) / services.length,
      totalThroughput: services.reduce((sum, s) => sum + s.throughput, 0),
      systemAvailability: services.reduce((sum, s) => sum + s.availability, 0) / services.length
    };

    // Analyze trends
    const trends = {
      responseTime: this.getTrend('ai_service_response_time'),
      throughput: this.getTrend('ai_service_throughput'),
      errorRate: this.getTrend('ai_service_error_rate')
    };

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations();

    return {
      summary,
      trends,
      services,
      recommendations
    };
  }

  private getTrend(metricName: string): string {
    const history = this.metrics.get(metricName);
    if (!history || history.length === 0) return 'stable';
    return history[history.length - 1].trend;
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const healthMetrics = this.getSystemHealthMetrics();

    if (healthMetrics.ai.status === 'warning' || healthMetrics.ai.status === 'critical') {
      recommendations.push('AI Services: Implementiere Model Caching und Batch Processing');
      recommendations.push('AI Services: Skaliere AI-Inference horizontally');
    }

    if (healthMetrics.database.status === 'warning') {
      recommendations.push('Database: Optimiere Queries und füge Indizes hinzu');
      recommendations.push('Database: Implementiere Connection Pooling');
    }

    if (healthMetrics.frontend.status === 'warning') {
      recommendations.push('Frontend: Implementiere Code Splitting und Lazy Loading');
      recommendations.push('Frontend: Optimiere Bundle Size und Assets');
    }

    if (healthMetrics.api.status === 'warning') {
      recommendations.push('API: Implementiere Response Caching');
      recommendations.push('API: Optimiere API Gateway Configuration');
    }

    if (recommendations.length === 0) {
      recommendations.push('System läuft optimal - Monitoring fortsetzen');
      recommendations.push('Proaktive Kapazitätsplanung für Skalierung');
    }

    return recommendations;
  }

  public getMetricHistory(metricName: string, limit: number = 50): PerformanceMetric[] {
    const history = this.metrics.get(metricName);
    return history ? history.slice(-limit) : [];
  }

  public getServiceMetrics(serviceName?: string): AIServiceMetrics[] {
    if (serviceName) {
      const metrics = this.serviceMetrics.get(serviceName);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.serviceMetrics.values());
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const aiPerformanceMonitor = new AIPerformanceMonitor();
