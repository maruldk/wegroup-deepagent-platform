
import { WorkflowDefinition, WorkflowStep } from '../../types';
import { StepType } from '@prisma/client';

export const projectWorkflows: WorkflowDefinition[] = [
  {
    name: 'project-optimization',
    description: 'Automated project optimization and resource allocation',
    version: '1.0',
    triggerEvent: 'project.task.completed',
    isActive: true,
    steps: [
      {
        name: 'analyze-project-health',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'project-health',
          params: {
            projectId: '${payload.projectId}',
            completedTaskId: '${payload.taskId}'
          }
        }
      },
      {
        name: 'resource-optimization',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'resource-optimization',
          params: {
            projectId: '${payload.projectId}',
            currentProgress: '${step1.result.progress}'
          }
        }
      },
      {
        name: 'risk-assessment',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'project-risk',
          params: {
            projectId: '${payload.projectId}',
            timeline: '${step1.result.timeline}',
            resources: '${step2.result.resources}'
          }
        }
      },
      {
        name: 'recommendations-notification',
        type: StepType.NOTIFICATION,
        config: {
          title: 'Project Optimization Recommendations',
          message: 'New recommendations available for project ${payload.projectName}',
          type: 'AI_INSIGHT',
          severity: 'MEDIUM',
          data: {
            projectId: '${payload.projectId}',
            health: '${step1.result}',
            optimization: '${step2.result}',
            risks: '${step3.result}'
          }
        }
      },
      {
        name: 'auto-task-assignment',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step2.result.autoAssignmentRecommended} === true',
          ifTrue: {
            type: StepType.DATABASE_UPDATE,
            config: {
              model: 'task',
              operation: 'update',
              where: { id: '${step2.result.nextTaskId}' },
              data: { assigneeId: '${step2.result.recommendedAssignee}' }
            }
          }
        }
      }
    ]
  },
  {
    name: 'deadline-monitoring',
    description: 'Proactive deadline monitoring and alerts',
    version: '1.0',
    triggerEvent: 'project.deadline.approaching',
    isActive: true,
    steps: [
      {
        name: 'calculate-risk-level',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'deadline-risk',
          params: {
            projectId: '${payload.projectId}',
            daysRemaining: '${payload.daysRemaining}',
            completionPercentage: '${payload.completionPercentage}'
          }
        }
      },
      {
        name: 'escalation-decision',
        type: StepType.CONDITIONAL,
        config: {
          condition: '${step1.result.riskLevel} === "HIGH"',
          ifTrue: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Critical Project Deadline Risk',
              message: 'Project ${payload.projectName} is at high risk of missing deadline',
              type: 'ERROR',
              severity: 'CRITICAL',
              userId: '${payload.managerId}'
            }
          },
          ifFalse: {
            type: StepType.NOTIFICATION,
            config: {
              title: 'Project Deadline Reminder',
              message: 'Project ${payload.projectName} deadline approaching in ${payload.daysRemaining} days',
              type: 'WARNING',
              severity: 'MEDIUM',
              userId: '${payload.managerId}'
            }
          }
        }
      },
      {
        name: 'resource-reallocation',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'resource-reallocation',
          params: {
            projectId: '${payload.projectId}',
            riskLevel: '${step1.result.riskLevel}',
            daysRemaining: '${payload.daysRemaining}'
          }
        }
      },
      {
        name: 'team-notification',
        type: StepType.NOTIFICATION,
        config: {
          title: 'Project Update Required',
          message: 'Please review and update project ${payload.projectName} status',
          type: 'INFO',
          severity: 'MEDIUM',
          channel: 'project-${payload.projectId}'
        }
      }
    ]
  },
  {
    name: 'milestone-achievement',
    description: 'Automated milestone celebration and next phase planning',
    version: '1.0',
    triggerEvent: 'project.milestone.reached',
    isActive: true,
    steps: [
      {
        name: 'milestone-analysis',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'milestone-impact',
          params: {
            projectId: '${payload.projectId}',
            milestoneId: '${payload.milestoneId}',
            completionTime: '${payload.completionTime}'
          }
        }
      },
      {
        name: 'team-celebration',
        type: StepType.NOTIFICATION,
        config: {
          title: '🎉 Milestone Achieved!',
          message: 'Congratulations! ${payload.milestoneName} has been completed for project ${payload.projectName}',
          type: 'SUCCESS',
          severity: 'INFO',
          channel: 'project-${payload.projectId}'
        }
      },
      {
        name: 'next-phase-planning',
        type: StepType.AI_ANALYSIS,
        config: {
          analysisType: 'next-phase-planning',
          params: {
            projectId: '${payload.projectId}',
            completedMilestone: '${payload.milestoneId}',
            currentProgress: '${step1.result.progress}'
          }
        }
      },
      {
        name: 'planning-notification',
        type: StepType.NOTIFICATION,
        config: {
          title: 'Next Phase Planning Available',
          message: 'AI recommendations for the next project phase are ready for review',
          type: 'AI_INSIGHT',
          severity: 'MEDIUM',
          userId: '${payload.managerId}',
          data: {
            projectId: '${payload.projectId}',
            recommendations: '${step3.result}'
          }
        }
      }
    ]
  }
];

export const projectAutomationRules = [
  {
    name: 'overdue-task-escalation',
    description: 'Automatically escalate overdue tasks',
    triggerEvent: 'project.task.overdue',
    conditions: [
      {
        field: 'daysOverdue',
        operator: 'greater_than',
        value: 2
      }
    ],
    actions: [
      {
        type: 'create_notification',
        config: {
          title: 'Overdue Task Escalation',
          message: 'Task ${payload.taskName} is ${payload.daysOverdue} days overdue',
          type: 'WARNING',
          severity: 'HIGH',
          userId: '${payload.managerId}'
        }
      },
      {
        type: 'update_priority',
        config: {
          model: 'task',
          priority: 'HIGH'
        }
      }
    ],
    isActive: true,
    priority: 20
  },
  {
    name: 'resource-conflict-detection',
    description: 'Detect and resolve resource conflicts',
    triggerEvent: 'project.resource.allocated',
    conditions: [
      {
        field: 'conflictDetected',
        operator: 'equals',
        value: true
      }
    ],
    actions: [
      {
        type: 'create_notification',
        config: {
          title: 'Resource Conflict Detected',
          message: 'Resource conflict detected for ${payload.resourceName}',
          type: 'WARNING',
          severity: 'HIGH'
        }
      },
      {
        type: 'trigger_workflow',
        config: {
          workflowName: 'resource-conflict-resolution'
        }
      }
    ],
    isActive: true,
    priority: 15
  }
];
