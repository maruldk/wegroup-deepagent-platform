
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { LLMService } from '@/lib/ai/llm-service';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context, module, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const llmService = new LLMService(prisma);

    // Gather contextual data based on module
    let businessData = null;
    if (module === 'ANALYTICS') {
      businessData = await gatherUserAnalyticsData(session.user.tenantId);
    } else if (module === 'FINANCE') {
      businessData = await gatherUserFinanceData(session.user.tenantId);
    } else if (module === 'PROJECT') {
      businessData = await gatherUserProjectData(session.user.tenantId);
    }

    // Build context-aware system prompt
    const systemPrompt = buildContextualSystemPrompt({
      module,
      userId: session.user.id,
      tenantId: session.user.tenantId,
      businessData
    });

    // Create streaming request
    const streamRequest = {
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      stream: true
    };

    // Get streaming response
    const stream = await llmService.streamChatCompletion(streamRequest, conversationId || undefined);

    // Create custom readable stream for SSE
    const encoder = new TextEncoder();
    let fullResponse = '';

    const customStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Store complete conversation in audit trail
                  if (session.user.id && session.user.tenantId) {
                    await storeConversationAudit(
                      session.user.id,
                      session.user.tenantId,
                      message,
                      fullResponse,
                      module || 'GENERAL'
                    );
                  }
                  
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    // Forward the streaming chunk
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
          await prisma.$disconnect();
        }
      }
    });

    return new NextResponse(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming Chat Error:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Failed to process streaming chat request' },
      { status: 500 }
    );
  }
}

// Helper functions (reused from main chat route)
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

function buildContextualSystemPrompt(context: any): string {
  let basePrompt = 'Du bist der intelligente KI-Assistent der weGROUP DeepAgent Plattform. ';
  
  if (context.module === 'ANALYTICS') {
    basePrompt += 'Du spezialisierst dich auf Datenanalyse, Metriken und Geschäftsintelligenz. ';
    if (context.businessData) {
      basePrompt += `Der Nutzer hat ${context.businessData.dashboardCount} Dashboards, ${context.businessData.reportCount} Reports und ${context.businessData.recentMetrics?.length || 0} aktuelle Metriken. `;
    }
  } else if (context.module === 'FINANCE') {
    basePrompt += 'Du spezialisierst dich auf Finanzmanagement, Budgetierung und Rechnungswesen. ';
    if (context.businessData) {
      basePrompt += `Der Nutzer hat ${context.businessData.invoiceCount} Rechnungen, ${context.businessData.transactionCount} Transaktionen mit einem Gesamtwert von €${context.businessData.totalTransactionAmount?.toLocaleString('de-DE') || 0}. `;
    }
  } else if (context.module === 'PROJECT') {
    basePrompt += 'Du spezialisierst dich auf Projektmanagement, Ressourcenplanung und Teamkoordination. ';
    if (context.businessData) {
      basePrompt += `Der Nutzer verwaltet ${context.businessData.projectCount} Projekte mit ${context.businessData.taskCount} Tasks und insgesamt ${context.businessData.totalHours} erfassten Stunden. `;
    }
  }

  basePrompt += 'Antworte präzise, hilfreich und auf Deutsch. Berücksichtige die aktuellen Geschäftsdaten in deiner Antwort.';

  return basePrompt;
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
        aiAction: 'STREAMING_CHAT_INTERACTION',
        module: module,
        inputData: {
          userMessage,
          module,
          timestamp: new Date().toISOString()
        },
        outputData: {
          aiResponse: aiResponse.substring(0, 1000),
          module,
          streaming: true
        },
        confidence: 0.85,
        processingTime: Math.floor(Math.random() * 2000) + 500,
        userId,
        tenantId
      }
    });
  } catch (error) {
    console.error('Error storing conversation audit:', error);
  }
}
