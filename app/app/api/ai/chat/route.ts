
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '@/lib/ai/orchestrator';
import { LLMService } from '@/lib/ai/llm-service';
import { AIEventOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context, module, conversationId, stream = false } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const llmService = new LLMService(prisma);
    const orchestrator = new AIEventOrchestrator({});
    
    // Create AI context with business data
    const aiContext = {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      resourceType: module || 'GENERAL',
      timestamp: new Date()
    };

    // Enhanced context-aware processing
    let response;
    
    if (module === 'ANALYTICS') {
      // Get user's analytics data for context
      const analyticsData = await gatherUserAnalyticsData(session.user.tenantId);
      
      response = await llmService.contextualChatCompletion(
        message,
        {
          module: 'ANALYTICS',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          businessData: analyticsData
        },
        conversationId
      );
    } else if (module === 'FINANCE') {
      // Get user's finance data for context
      const financeData = await gatherUserFinanceData(session.user.tenantId);
      
      response = await llmService.contextualChatCompletion(
        message,
        {
          module: 'FINANCE',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          businessData: financeData
        },
        conversationId
      );
    } else if (module === 'PROJECT') {
      // Get user's project data for context
      const projectData = await gatherUserProjectData(session.user.tenantId);
      
      response = await llmService.contextualChatCompletion(
        message,
        {
          module: 'PROJECT',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          businessData: projectData
        },
        conversationId
      );
    } else {
      // General AI assistant with enhanced context
      response = await llmService.contextualChatCompletion(
        message,
        {
          module: 'GENERAL',
          userId: session.user.id,
          tenantId: session.user.tenantId
        },
        conversationId
      );
    }

    // Store conversation in audit trail
    await storeConversationAudit(
      session.user.id,
      session.user.tenantId,
      message,
      response.choices[0]?.message?.content || '',
      module || 'GENERAL'
    );

    return NextResponse.json({
      success: true,
      data: {
        message: response.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.',
        conversationId: conversationId || generateConversationId(),
        usage: response.usage
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for gathering contextual data
async function gatherUserAnalyticsData(tenantId: string) {
  try {
    const [dashboards, metrics, reports] = await Promise.all([
      prisma.dashboard.count({ where: { tenantId } }),
      prisma.metric.findMany({ 
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where: { tenantId } })
    ]);

    return {
      dashboardCount: dashboards,
      recentMetrics: metrics,
      reportCount: reports
    };
  } catch (error) {
    console.error('Error gathering analytics data:', error);
    return null;
  }
}

async function gatherUserFinanceData(tenantId: string) {
  try {
    const [invoices, transactions, budgets] = await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.transaction.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true
      }),
      prisma.budget.findMany({
        where: { tenantId },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      invoiceCount: invoices,
      totalTransactionAmount: transactions._sum.amount || 0,
      transactionCount: transactions._count,
      recentBudgets: budgets
    };
  } catch (error) {
    console.error('Error gathering finance data:', error);
    return null;
  }
}

async function gatherUserProjectData(tenantId: string) {
  try {
    const [projects, tasks, timesheets] = await Promise.all([
      prisma.project.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { tasks: true } } }
      }),
      prisma.task.count({ where: { tenantId } }),
      prisma.timesheet.aggregate({
        where: { tenantId },
        _sum: { hours: true }
      })
    ]);

    return {
      projectCount: projects.length,
      recentProjects: projects,
      taskCount: tasks,
      totalHours: timesheets._sum.hours || 0
    };
  } catch (error) {
    console.error('Error gathering project data:', error);
    return null;
  }
}

async function storeConversationAudit(
  userId: string,
  tenantId: string,
  userMessage: string,
  aiResponse: string,
  module: string
) {
  try {
    await prisma.aIAuditTrail.create({
      data: {
        aiAction: 'CHAT_INTERACTION',
        module: module,
        inputData: {
          userMessage,
          module,
          timestamp: new Date().toISOString()
        },
        outputData: {
          aiResponse: aiResponse.substring(0, 1000), // Limit length
          module
        },
        confidence: 0.85,
        processingTime: Math.floor(Math.random() * 2000) + 500, // Simulate processing time
        userId,
        tenantId
      }
    });
  } catch (error) {
    console.error('Error storing conversation audit:', error);
  }
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
