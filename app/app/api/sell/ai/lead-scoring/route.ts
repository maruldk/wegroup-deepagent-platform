
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
      opportunityId,
      customerId,
      leadData = {} // Custom lead data for scoring
    } = data;

    // Get opportunity or customer data for scoring
    let entityData: any = {};
    let entityType = '';

    if (opportunityId) {
      entityData = await prisma.salesOpportunity.findFirst({
        where: {
          id: opportunityId,
          tenantId: session.user.tenantId,
        },
        include: {
          customer: true,
          activities: true,
          quotes: true,
        },
      });
      entityType = 'opportunity';
    } else if (customerId) {
      entityData = await prisma.customer.findFirst({
        where: {
          id: customerId,
          tenantId: session.user.tenantId,
        },
        include: {
          salesOpportunities: true,
          salesActivities: true,
        },
      });
      entityType = 'customer';
    } else {
      // Score based on provided lead data
      entityData = leadData;
      entityType = 'lead';
    }

    if (!entityData && (opportunityId || customerId)) {
      return NextResponse.json({ error: 'Entity nicht gefunden' }, { status: 404 });
    }

    // Build AI prompt for lead scoring
    const systemPrompt = `Du bist ein Sales AI-Experte für Lead Scoring. Analysiere die folgenden Daten und bewerte die Verkaufswahrscheinlichkeit.

Bewertungskriterien:
1. Unternehmensgröße und -branche
2. Budget und Kaufkraft
3. Entscheidungsbefugnis
4. Zeitrahmen für Kauf
5. Engagement-Level
6. Fit mit unserem Produkt/Service
7. Konkurrenzsituation
8. Historische Daten

Gib eine Bewertung von 1-100 und detaillierte Begründung aus.
Format: JSON mit score, category (Hot, Warm, Cold), reasoning, und recommendations.`;

    const dataForScoring = {
      entityType,
      data: entityData,
      timestamp: new Date().toISOString(),
    };

    const userPrompt = `Bewerte diesen ${entityType}:

${JSON.stringify(dataForScoring, null, 2)}

Analysiere alle verfügbaren Daten und gib eine präzise Lead-Score-Bewertung aus.`;

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
        temperature: 0.3,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    let scoringResult = llmResult.choices?.[0]?.message?.content;

    if (!scoringResult) {
      throw new Error('No scoring result generated');
    }

    // Parse and sanitize JSON response
    try {
      scoringResult = JSON.parse(scoringResult);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      scoringResult = {
        score: 50,
        category: 'Warm',
        reasoning: 'AI-Analyse konnte nicht vollständig durchgeführt werden',
        recommendations: ['Weitere Daten erforderlich für präzise Bewertung']
      };
    }

    // Ensure score is within valid range
    scoringResult.score = Math.max(1, Math.min(100, scoringResult.score || 50));

    // Determine category based on score if not provided
    if (!scoringResult.category) {
      if (scoringResult.score >= 80) {
        scoringResult.category = 'Hot';
      } else if (scoringResult.score >= 60) {
        scoringResult.category = 'Warm';
      } else {
        scoringResult.category = 'Cold';
      }
    }

    const response = {
      entityId: opportunityId || customerId || 'lead-data',
      entityType,
      scoring: {
        score: scoringResult.score,
        category: scoringResult.category,
        reasoning: scoringResult.reasoning || 'AI-basierte Bewertung',
        recommendations: scoringResult.recommendations || [],
        confidence: scoringResult.confidence || 0.8,
        factors: scoringResult.factors || {},
      },
      metadata: {
        scoredAt: new Date().toISOString(),
        aiModel: 'gpt-4.1-mini',
        version: '1.0',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Lead scoring error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lead Scoring' },
      { status: 500 }
    );
  }
}
