
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      context = 'general', // general, opportunity, customer, pipeline
      entityId, // opportunity ID, customer ID, etc.
      userId = session.user.id,
      recommendationType = 'all' // all, next_actions, upsell, strategy, follow_up
    } = data;

    // Get contextual data based on request
    let contextData: any = {};
    
    if (context === 'opportunity' && entityId) {
      contextData = await prisma.salesOpportunity.findFirst({
        where: {
          id: entityId,
          tenantId: session.user.tenantId,
        },
        include: {
          customer: true,
          assignee: { select: { name: true, email: true } },
          quotes: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { items: true },
          },
          activities: {
            orderBy: { scheduledAt: 'desc' },
            take: 5,
          },
          products: {
            include: { product: true },
          },
        },
      });
    } else if (context === 'customer' && entityId) {
      contextData = await prisma.customer.findFirst({
        where: {
          id: entityId,
          tenantId: session.user.tenantId,
        },
        include: {
          salesOpportunities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          salesActivities: {
            orderBy: { scheduledAt: 'desc' },
            take: 5,
          },
        },
      });
    } else {
      // General pipeline context
      contextData = await prisma.salesOpportunity.findMany({
        where: {
          tenantId: session.user.tenantId,
          assignedTo: userId,
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
        include: {
          customer: { select: { companyName: true } },
          activities: {
            where: {
              status: { in: ['PLANNED', 'IN_PROGRESS'] },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
          },
        },
        orderBy: [
          { priority: 'desc' },
          { expectedCloseDate: 'asc' },
        ],
        take: 10,
      });
    }

    // Get user's recent performance data
    const userStats = await prisma.salesOpportunity.groupBy({
      by: ['stage'],
      where: {
        tenantId: session.user.tenantId,
        assignedTo: userId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      _count: { stage: true },
      _sum: { amount: true },
    });

    // Get pending activities
    const pendingActivities = await prisma.salesActivity.findMany({
      where: {
        tenantId: session.user.tenantId,
        assignedTo: userId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        scheduledAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      include: {
        opportunity: { select: { title: true, stage: true } },
        customer: { select: { companyName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    // Build AI prompt for recommendations
    const systemPrompt = `Du bist ein Sales AI-Coach und Strategieberater. Analysiere die Verkaufsdaten und gib personalisierte, actionable Empfehlungen.

Fokussiere auf:
1. Next Best Actions für Opportunities
2. Prioritäten und Zeitmanagement
3. Upselling und Cross-selling Chancen
4. Kundenbeziehung und Follow-up Strategien
5. Pipeline-Optimierung
6. Performance-Verbesserung
7. Verkaufstechniken und -strategien

Gib konkrete, umsetzbare Empfehlungen mit Begründung und Prioritäten aus.
Format: JSON mit kategorisierten recommendations.`;

    const recommendationData = {
      context,
      entityId,
      user: { id: userId, name: session.user.name },
      data: contextData,
      userStats: userStats.map(s => ({
        stage: s.stage,
        count: s._count.stage,
        value: s._sum.amount || 0,
      })),
      pendingActivities: pendingActivities.map(a => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        scheduledAt: a.scheduledAt,
        opportunity: a.opportunity?.title,
        customer: a.customer?.companyName,
        priority: a.priority,
      })),
      requestedType: recommendationType,
      timestamp: new Date().toISOString(),
    };

    const userPrompt = `Analysiere diese Verkaufssituation und gib strategische Empfehlungen:

${JSON.stringify(recommendationData, null, 2)}

Fokus: ${recommendationType === 'all' ? 'Alle Empfehlungstypen' : recommendationType}
Context: ${context}

Gib priorisierte, konkrete Handlungsempfehlungen mit Begründung aus.`;

    // Call LLM API
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    let recommendationsResult = llmResult.choices?.[0]?.message?.content;

    if (!recommendationsResult) {
      throw new Error('No recommendations generated');
    }

    // Parse and sanitize JSON response
    try {
      recommendationsResult = JSON.parse(recommendationsResult);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      recommendationsResult = {
        nextActions: [
          {
            action: 'Review pipeline priorities',
            priority: 'high',
            reason: 'AI-Analyse konnte nicht vollständig durchgeführt werden',
            timeline: 'today',
          }
        ],
        summary: 'Basis-Empfehlungen aufgrund eingeschränkter AI-Analyse',
      };
    }

    const response = {
      context,
      entityId,
      userId,
      recommendations: {
        nextActions: recommendationsResult.nextActions || [],
        strategic: recommendationsResult.strategic || [],
        upsell: recommendationsResult.upsell || [],
        followUp: recommendationsResult.followUp || [],
        pipeline: recommendationsResult.pipeline || [],
        priorities: recommendationsResult.priorities || [],
      },
      insights: {
        summary: recommendationsResult.summary || '',
        opportunities: recommendationsResult.opportunities || [],
        risks: recommendationsResult.risks || [],
        trends: recommendationsResult.trends || [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'gpt-4.1-mini',
        recommendationType,
        context,
        confidence: recommendationsResult.confidence || 0.8,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sales recommendations error:', error);
    return NextResponse.json(
      { error: 'Fehler bei den Verkaufsempfehlungen' },
      { status: 500 }
    );
  }
}
