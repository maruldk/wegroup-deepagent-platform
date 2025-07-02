
import { WorkflowDefinition, WorkflowStep } from '../../types';
import { StepType } from '@prisma/client';

export const financeWorkflows: WorkflowDefinition[] = [
  {
    name: 'invoice-processing',
    description: 'Automated invoice processing and categorization',
    version: '1.0',
    triggerEvent: 'finance.invoice.created',
    isActive: true,
    steps: [
      {
        name: 'ai-categorization',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'invoice-categorization',
          confidence_threshold: 0.7
        }
      },
      {
        name: 'fraud-detection',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'fraud-detection',
          risk_threshold: 0.8
        }
      },
      {
        name: 'update-invoice-category',
        type: StepType.DATABASE_UPDATE,
        config: {
          model: 'invoice',
          operation: 'update',
          where: { id: '${payload.invoiceId}' },
          data: { category: '${step1.result.category}' }
        }
      },
      {
        name: 'risk-notification',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step2.result.riskScore} > 0.8',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'High Risk Invoice Detected',
              message: 'Invoice ${payload.invoiceNumber} has been flagged for review',
              type: 'WARNING',
              severity: 'HIGH',
              data: {
                invoiceId: '${payload.invoiceId}',
                riskScore: '${step2.result.riskScore}'
              }
            }
          }
        }
      }
    ]
  },
  {
    name: 'payment-overdue-automation',
    description: 'Automated handling of overdue payments',
    version: '1.0',
    triggerEvent: 'finance.payment.overdue',
    isActive: true,
    steps: [
      {
        name: 'calculate-overdue-days',
        type: StepType.DATA_TRANSFORM,
        config: {
          transform: 'daysBetween',
          params: {
            from: '${payload.dueDate}',
            to: '${new Date()}'
          }
        }
      },
      {
        name: 'escalation-level',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step1.result.days} > 30',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Critical Payment Overdue',
              message: 'Payment for invoice ${payload.invoiceNumber} is ${step1.result.days} days overdue',
              type: 'ERROR',
              severity: 'CRITICAL',
              userId: '${payload.assignedUserId}'
            }
          },
          ifFalse: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Payment Reminder',
              message: 'Payment for invoice ${payload.invoiceNumber} is overdue',
              type: 'WARNING',
              severity: 'MEDIUM',
              userId: '${payload.assignedUserId}'
            }
          }
        }
      },
      {
        name: 'auto-follow-up',
        type: StepType.EMAIL_SEND,
        config: {
          to: '${payload.customerEmail}',
          subject: 'Payment Reminder - Invoice ${payload.invoiceNumber}',
          template: 'payment-reminder',
          data: {
            invoiceNumber: '${payload.invoiceNumber}',
            amount: '${payload.amount}',
            daysOverdue: '${step1.result.days}'
          }
        }
      }
    ]
  },
  {
    name: 'budget-monitoring',
    description: 'Continuous budget monitoring and alerts',
    version: '1.0',
    triggerEvent: 'finance.transaction.created',
    isActive: true,
    steps: [
      {
        name: 'check-budget-impact',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'budget-impact',
          params: {
            transactionAmount: '${payload.amount}',
            category: '${payload.category}',
            tenantId: '${metadata.tenantId}'
          }
        }
      },
      {
        name: 'budget-threshold-check',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step1.result.budgetUtilization} > 0.8',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Budget Threshold Exceeded',
              message: 'Budget for ${payload.category} is at ${step1.result.budgetUtilization * 100}% utilization',
              type: 'WARNING',
              severity: 'HIGH',
              data: {
                category: '${payload.category}',
                utilization: '${step1.result.budgetUtilization}',
                remaining: '${step1.result.remainingBudget}'
              }
            }
          }
        }
      },
      {
        name: 'predictive-analysis',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'budget-forecast',
          params: {
            category: '${payload.category}',
            currentUtilization: '${step1.result.budgetUtilization}',
            timeRemaining: '${step1.result.timeRemaining}'
          }
        }
      }
    ]
  }
];

export const financeAutomationRules = [
  {
    name: 'high-value-invoice-approval',
    description: 'Require approval for high-value invoices',
    triggerEvent: 'finance.invoice.created',
    conditions: [
      {
        field: 'amount',
        operator: 'greater_than',
        value: 10000
      }
    ],
    actions: [
      {
        type: 'create_notification',
        config: {
          title: 'High Value Invoice Requires Approval',
          message: 'Invoice ${payload.invoiceNumber} for ${payload.amount} requires management approval',
          type: 'WARNING',
          severity: 'HIGH',
          role: 'ADMIN'
        }
      },
      {
        type: 'update_status',
        config: {
          model: 'invoice',
          status: 'PENDING_APPROVAL'
        }
      }
    ],
    isActive: true,
    priority: 10
  },
  {
    name: 'duplicate-invoice-detection',
    description: 'Detect and flag potential duplicate invoices',
    triggerEvent: 'finance.invoice.created',
    conditions: [
      {
        field: 'similarity_score',
        operator: 'greater_than',
        value: 0.9
      }
    ],
    actions: [
      {
        type: 'create_notification',
        config: {
          title: 'Potential Duplicate Invoice',
          message: 'Invoice ${payload.invoiceNumber} may be a duplicate',
          type: 'WARNING',
          severity: 'MEDIUM'
        }
      },
      {
        type: 'flag_for_review',
        config: {
          model: 'invoice',
          flag: 'POTENTIAL_DUPLICATE'
        }
      }
    ],
    isActive: true,
    priority: 15
  }
];
