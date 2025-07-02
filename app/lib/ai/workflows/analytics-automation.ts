
import { WorkflowDefinition, WorkflowStep } from '../../types';
import { StepType } from '@prisma/client';

export const analyticsWorkflows: WorkflowDefinition[] = [
  {
    name: 'anomaly-investigation',
    description: 'Automated anomaly investigation and response',
    version: '1.0',
    triggerEvent: 'analytics.anomaly.detected',
    isActive: true,
    steps: [
      {
        name: 'deep-analysis',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'anomaly-investigation',
          params: {
            anomalyId: '${payload.anomalyId}',
            dataPoints: '${payload.dataPoints}',
            timeframe: '${payload.timeframe}'
          }
        }
      },
      {
        name: 'impact-assessment',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'business-impact',
          params: {
            anomalyType: '${payload.anomalyType}',
            severity: '${payload.severity}',
            affectedMetrics: '${payload.affectedMetrics}'
          }
        }
      },
      {
        name: 'root-cause-analysis',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'root-cause',
          params: {
            anomaly: '${step1.result}',
            historicalData: '${payload.historicalData}',
            contextualEvents: '${payload.contextualEvents}'
          }
        }
      },
      {
        name: 'severity-based-notification',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${payload.severity} === "CRITICAL"',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: '🚨 Critical Anomaly Detected',
              message: 'Critical anomaly requires immediate attention: ${step3.result.summary}',
              type: 'ERROR',
              severity: 'CRITICAL',
              role: 'ADMIN'
            }
          },
          ifFalse: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Anomaly Investigation Complete',
              message: 'Anomaly analysis complete. Review recommended actions.',
              type: 'AI_INSIGHT',
              severity: 'MEDIUM'
            }
          }
        }
      },
      {
        name: 'auto-remediation',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step3.result.autoRemediationAvailable} === true',
          ifTrue: {
            type: StepType.DATABASE_UPDATE,
            config: {
              model: 'metric',
              operation: 'update',
              where: { id: '${payload.metricId}' },
              data: { 
                status: 'AUTO_CORRECTED',
                correctionApplied: '${step3.result.remediation}'
              }
            }
          }
        }
      }
    ]
  },
  {
    name: 'report-generation',
    description: 'Automated intelligent report generation',
    version: '1.0',
    triggerEvent: 'analytics.report.scheduled',
    isActive: true,
    steps: [
      {
        name: 'data-collection',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'data-aggregation',
          params: {
            reportType: '${payload.reportType}',
            timeframe: '${payload.timeframe}',
            metrics: '${payload.metrics}'
          }
        }
      },
      {
        name: 'trend-analysis',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'trend-identification',
          params: {
            data: '${step1.result.data}',
            historicalComparison: true,
            trendPeriod: '${payload.trendPeriod}'
          }
        }
      },
      {
        name: 'insight-generation',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'insight-extraction',
          params: {
            data: '${step1.result.data}',
            trends: '${step2.result.trends}',
            businessContext: '${payload.businessContext}'
          }
        }
      },
      {
        name: 'report-compilation',
        type: StepType.DATA_TRANSFORM,
        config: {
          transform: 'report-template',
          params: {
            template: '${payload.reportTemplate}',
            data: '${step1.result}',
            trends: '${step2.result}',
            insights: '${step3.result}'
          }
        }
      },
      {
        name: 'report-delivery',
        type: StepType.NOTIFICATION,
        config: {
          title: 'Automated Report Ready',
          message: '${payload.reportType} report has been generated and is ready for review',
          type: 'SUCCESS',
          severity: 'INFO',
          userId: '${payload.requestedBy}',
          data: {
            reportId: '${step4.result.reportId}',
            reportUrl: '${step4.result.reportUrl}'
          }
        }
      }
    ]
  },
  {
    name: 'kpi-monitoring',
    description: 'Continuous KPI monitoring and alerting',
    version: '1.0',
    triggerEvent: 'analytics.metric.updated',
    isActive: true,
    steps: [
      {
        name: 'threshold-check',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'threshold-evaluation',
          params: {
            metricId: '${payload.metricId}',
            currentValue: '${payload.currentValue}',
            thresholds: '${payload.thresholds}'
          }
        }
      },
      {
        name: 'trend-evaluation',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'trend-evaluation',
          params: {
            metricId: '${payload.metricId}',
            recentValues: '${payload.recentValues}',
            evaluationPeriod: '24h'
          }
        }
      },
      {
        name: 'predictive-forecasting',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'metric-forecasting',
          params: {
            metricId: '${payload.metricId}',
            historicalData: '${payload.historicalData}',
            forecastPeriod: '7d'
          }
        }
      },
      {
        name: 'threshold-alert',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step1.result.thresholdExceeded} === true',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'KPI Threshold Alert',
              message: '${payload.metricName} has exceeded threshold: ${payload.currentValue}',
              type: 'WARNING',
              severity: '${step1.result.alertSeverity}',
              data: {
                metricId: '${payload.metricId}',
                currentValue: '${payload.currentValue}',
                threshold: '${step1.result.exceededThreshold}',
                trend: '${step2.result.trend}',
                forecast: '${step3.result.forecast}'
              }
            }
          }
        }
      },
      {
        name: 'trend-notification',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step2.result.significantTrend} === true',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Significant Trend Detected',
              message: '${payload.metricName} shows ${step2.result.trendDirection} trend',
              type: 'AI_INSIGHT',
              severity: 'MEDIUM',
              data: {
                metricId: '${payload.metricId}',
                trendDirection: '${step2.result.trendDirection}',
                trendStrength: '${step2.result.trendStrength}',
                forecast: '${step3.result.forecast}'
              }
            }
          }
        }
      }
    ]
  }
];

export const analyticsAutomationRules = [
  {
    name: 'dashboard-refresh-optimization',
    description: 'Optimize dashboard refresh based on data change frequency',
    triggerEvent: 'analytics.dashboard.accessed',
    conditions: [
      {
        field: 'dataChangeFrequency',
        operator: 'greater_than',
        value: 0.7
      }
    ],
    actions: [
      {
        type: 'update_refresh_rate',
        config: {
          dashboardId: '${payload.dashboardId}',
          refreshRate: 'high'
        }
      },
      {
        type: 'create_notification',
        config: {
          title: 'Dashboard Optimization',
          message: 'Dashboard refresh rate optimized based on data activity',
          type: 'INFO',
          severity: 'LOW'
        }
      }
    ],
    isActive: true,
    priority: 5
  },
  {
    name: 'data-quality-monitoring',
    description: 'Monitor and alert on data quality issues',
    triggerEvent: 'analytics.data.quality.check',
    conditions: [
      {
        field: 'qualityScore',
        operator: 'less_than',
        value: 0.8
      }
    ],
    actions: [
      {
        type: 'create_notification',
        config: {
          title: 'Data Quality Alert',
          message: 'Data quality score below threshold: ${payload.qualityScore}',
          type: 'WARNING',
          severity: 'HIGH'
        }
      },
      {
        type: 'trigger_workflow',
        config: {
          workflowName: 'data-quality-investigation'
        }
      }
    ],
    isActive: true,
    priority: 25
  }
];
