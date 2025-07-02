
import { 
  PrismaClient,
  NotificationType,
  NotificationSeverity,
  StepType,
  StepStatus,
  EventType,
  EventPriority,
  EventStatus
} from '@prisma/client';
import { 
  financeWorkflows, 
  financeAutomationRules 
} from '../lib/ai/workflows/finance-automation';
import { 
  projectWorkflows, 
  projectAutomationRules 
} from '../lib/ai/workflows/project-automation';
import { 
  analyticsWorkflows, 
  analyticsAutomationRules 
} from '../lib/ai/workflows/analytics-automation';

const prisma = new PrismaClient();

async function seedEventOrchestration() {
  console.log('🚀 Starting Event Orchestration seeding...');

  try {
    // Get the default tenant
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'wegroup' }
    });

    if (!tenant) {
      console.error('❌ Default tenant not found. Please run the main seed script first.');
      return;
    }

    console.log(`📋 Using tenant: ${tenant.name} (${tenant.id})`);

    // Seed Workflow Definitions
    console.log('📝 Seeding workflow definitions...');
    
    const allWorkflows = [
      ...financeWorkflows,
      ...projectWorkflows,
      ...analyticsWorkflows
    ];

    for (const workflow of allWorkflows) {
      await prisma.workflowDefinition.upsert({
        where: {
          name_version_tenantId: {
            name: workflow.name,
            version: workflow.version,
            tenantId: tenant.id
          }
        },
        create: {
          name: workflow.name,
          description: workflow.description,
          version: workflow.version,
          triggerEvent: workflow.triggerEvent,
          steps: workflow.steps as any,
          isActive: workflow.isActive,
          tenantId: tenant.id
        },
        update: {
          description: workflow.description,
          steps: workflow.steps as any,
          isActive: workflow.isActive
        }
      });
      console.log(`  ✅ Workflow: ${workflow.name}`);
    }

    // Seed Sample Events for Testing
    console.log('📊 Seeding sample events...');
    
    const sampleEvents = [
      {
        eventType: EventType.BUSINESS_EVENT,
        eventName: 'finance.invoice.created',
        source: 'finance-module',
        payload: {
          invoiceId: 'sample-invoice-1',
          invoiceNumber: 'INV-2024-001',
          customerId: 'sample-customer-1',
          amount: 1500.00,
          currency: 'EUR'
        },
        metadata: {
          userId: 'demo-user',
          tenantId: tenant.id,
          timestamp: new Date(),
          source: 'demo-seed'
        },
        priority: EventPriority.MEDIUM,
        status: EventStatus.COMPLETED,
        tenantId: tenant.id
      },
      {
        eventType: EventType.BUSINESS_EVENT,
        eventName: 'project.task.completed',
        source: 'project-module',
        payload: {
          taskId: 'sample-task-1',
          taskName: 'Design System Implementation',
          projectId: 'sample-project-1',
          projectName: 'Mobile App Development',
          completionTime: 8.5,
          userId: 'demo-user'
        },
        metadata: {
          userId: 'demo-user',
          tenantId: tenant.id,
          timestamp: new Date(),
          source: 'demo-seed'
        },
        priority: EventPriority.MEDIUM,
        status: EventStatus.COMPLETED,
        tenantId: tenant.id
      },
      {
        eventType: EventType.AI_EVENT,
        eventName: 'analytics.anomaly.detected',
        source: 'analytics-module',
        payload: {
          anomalyId: 'anomaly-001',
          metricName: 'Revenue Growth',
          anomalyType: 'sudden_drop',
          severity: 'HIGH',
          confidence: 0.92,
          description: 'Unexpected 15% revenue drop detected'
        },
        metadata: {
          userId: 'ai-system',
          tenantId: tenant.id,
          timestamp: new Date(),
          source: 'ai-analytics'
        },
        priority: EventPriority.HIGH,
        status: EventStatus.COMPLETED,
        tenantId: tenant.id
      }
    ];

    for (const event of sampleEvents) {
      await prisma.eventBus.create({
        data: event
      });
      console.log(`  ✅ Event: ${event.eventName}`);
    }

    // Seed Sample Notifications
    console.log('🔔 Seeding sample notifications...');
    
    const sampleNotifications = [
      {
        title: 'Invoice Processing Complete',
        message: 'Invoice INV-2024-001 has been automatically processed and categorized as "Software License"',
        type: NotificationType.SUCCESS,
        severity: NotificationSeverity.INFO,
        data: {
          invoiceId: 'sample-invoice-1',
          category: 'software-license',
          confidence: 0.95
        },
        tenantId: tenant.id,
        isPersistent: true
      },
      {
        title: 'Project Milestone Achieved',
        message: '🎉 Congratulations! The Design System Implementation milestone has been completed ahead of schedule',
        type: NotificationType.SUCCESS,
        severity: NotificationSeverity.INFO,
        data: {
          projectId: 'sample-project-1',
          milestone: 'Design System Implementation',
          daysAhead: 2
        },
        tenantId: tenant.id,
        isPersistent: true
      },
      {
        title: 'Revenue Anomaly Detected',
        message: 'AI has detected an unusual 15% revenue drop. Immediate investigation recommended.',
        type: NotificationType.WARNING,
        severity: NotificationSeverity.HIGH,
        data: {
          anomalyType: 'revenue_drop',
          impact: '15%',
          confidence: 0.92
        },
        tenantId: tenant.id,
        isPersistent: true
      },
      {
        title: 'Budget Threshold Alert',
        message: 'Marketing budget has reached 85% utilization with 2 weeks remaining in the period',
        type: NotificationType.WARNING,
        severity: NotificationSeverity.MEDIUM,
        data: {
          category: 'marketing',
          utilization: 0.85,
          daysRemaining: 14
        },
        tenantId: tenant.id,
        isPersistent: true
      }
    ];

    for (const notification of sampleNotifications) {
      await prisma.realTimeNotification.create({
        data: notification
      });
      console.log(`  ✅ Notification: ${notification.title}`);
    }

    // Seed AI Orchestration Metrics
    console.log('📈 Seeding orchestration metrics...');
    
    const today = new Date();
    const orchestrationMetrics = {
      eventProcessedCount: 1247,
      avgProcessingTime: 85.5, // milliseconds
      successRate: 0.987,
      errorRate: 0.013,
      automationScore: 0.65, // 65% autonomy
      workflowSuccessRate: 0.942,
      aiDecisionAccuracy: 0.891,
      userSatisfactionScore: 0.876,
      date: today,
      tenantId: tenant.id
    };

    await prisma.aIOrchestrationMetrics.upsert({
      where: {
        date_tenantId: {
          date: today,
          tenantId: tenant.id
        }
      },
      create: orchestrationMetrics,
      update: orchestrationMetrics
    });

    console.log('  ✅ Orchestration metrics created');

    // Seed Sample Workflow Executions
    console.log('⚙️ Seeding sample workflow executions...');
    
    const financeWorkflow = await prisma.workflowDefinition.findFirst({
      where: { name: 'invoice-processing', tenantId: tenant.id }
    });

    if (financeWorkflow) {
      const workflowExecution = await prisma.workflowExecution.create({
        data: {
          workflowDefinitionId: financeWorkflow.id,
          correlationId: 'corr_demo_001',
          status: EventStatus.COMPLETED,
          currentStep: 4,
          totalSteps: 4,
          startTime: new Date(Date.now() - 5000), // 5 seconds ago
          endTime: new Date(),
          inputData: {
            invoiceId: 'sample-invoice-1',
            amount: 1500.00
          },
          outputData: {
            category: 'software-license',
            confidence: 0.95,
            fraudScore: 0.02
          },
          tenantId: tenant.id
        }
      });

      // Add workflow steps
      const steps = [
        {
          stepNumber: 1,
          stepName: 'ai-categorization',
          stepType: StepType.AI_ANALYSIS,
          status: StepStatus.COMPLETED,
          outputData: { category: 'software-license', confidence: 0.95 },
          executionTime: 1200
        },
        {
          stepNumber: 2,
          stepName: 'fraud-detection',
          stepType: StepType.AI_ANALYSIS,
          status: StepStatus.COMPLETED,
          outputData: { fraudScore: 0.02, riskLevel: 'LOW' },
          executionTime: 800
        },
        {
          stepNumber: 3,
          stepName: 'update-invoice-category',
          stepType: StepType.DATABASE_UPDATE,
          status: StepStatus.COMPLETED,
          outputData: { updated: true },
          executionTime: 150
        },
        {
          stepNumber: 4,
          stepName: 'success-notification',
          stepType: StepType.NOTIFICATION,
          status: StepStatus.COMPLETED,
          outputData: { notificationSent: true },
          executionTime: 100
        }
      ];

      for (const step of steps) {
        await prisma.workflowStep.create({
          data: {
            workflowExecutionId: workflowExecution.id,
            ...step,
            startTime: new Date(Date.now() - 5000 + (step.stepNumber * 1000)),
            endTime: new Date(Date.now() - 5000 + (step.stepNumber * 1000) + step.executionTime),
            tenantId: tenant.id
          }
        });
      }

      console.log('  ✅ Sample workflow execution created');
    }

    console.log('✨ Event Orchestration seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • ${allWorkflows.length} workflow definitions`);
    console.log(`  • ${sampleEvents.length} sample events`);
    console.log(`  • ${sampleNotifications.length} sample notifications`);
    console.log('  • 1 orchestration metrics record');
    console.log('  • 1 sample workflow execution with 4 steps');
    console.log('');
    console.log('🌟 The Event Orchestration system is now ready!');
    console.log('   Visit /event-orchestration to see the dashboard');

  } catch (error) {
    console.error('❌ Error seeding event orchestration:', error);
    throw error;
  }
}

export default seedEventOrchestration;

// Run if called directly
if (require.main === module) {
  seedEventOrchestration()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
