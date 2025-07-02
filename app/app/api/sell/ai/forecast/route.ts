
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
      forecastPeriod = 'quarterly', // monthly, quarterly, yearly
      userId = 'all',
      includeSeasonality = true,
      includeMarketTrends = true,
      confidenceLevel = 0.8
    } = data;

    // Get historical sales data
    const currentDate = new Date();
    const historicalStart = new Date();
    historicalStart.setFullYear(currentDate.getFullYear() - 2); // 2 years of data

    const baseWhere = {
      tenantId: session.user.tenantId,
      createdAt: { gte: historicalStart },
    };

    const userWhere = userId !== 'all' 
      ? { ...baseWhere, assignedTo: userId }
      : baseWhere;

    // Get opportunities data
    const [
      allOpportunities,
      wonOpportunities,
      currentPipeline,
      monthlyWins,
      stageConversion
    ] = await Promise.all([
      prisma.salesOpportunity.findMany({
        where: userWhere,
        include: {
          customer: { select: { companyName: true } },
          assignee: { select: { name: true } },
        },
      }),
      prisma.salesOpportunity.findMany({
        where: { ...userWhere, stage: 'CLOSED_WON' },
        orderBy: { actualCloseDate: 'asc' },
      }),
      prisma.salesOpportunity.findMany({
        where: { 
          ...userWhere, 
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
        },
      }),
      // Monthly wins for trend analysis
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', actual_close_date) as month,
          COUNT(*) as deals_count,
          SUM(amount) as revenue,
          AVG(amount) as avg_deal_size
        FROM sales_opportunities 
        WHERE tenant_id = ${session.user.tenantId}
          AND stage = 'CLOSED_WON'
          AND actual_close_date >= ${historicalStart}
          ${userId !== 'all' ? `AND assigned_to = ${userId}` : ''}
        GROUP BY DATE_TRUNC('month', actual_close_date)
        ORDER BY month ASC
      `,
      // Stage conversion rates
      prisma.salesOpportunity.groupBy({
        by: ['stage'],
        where: userWhere,
        _count: { stage: true },
        _sum: { amount: true },
      }),
    ]);

    // Build AI prompt for sales forecasting
    const systemPrompt = `Du bist ein Sales AI-Experte für Revenue Forecasting. Analysiere historische Verkaufsdaten und erstelle präzise Umsatzprognosen.

Berücksichtige:
1. Historische Trends und Saisonalität
2. Pipeline-Stärke und Conversion-Raten
3. Durchschnittliche Deal-Größe und Verkaufszyklen
4. Team-Performance und Kapazitäten
5. Marktbedingungen und externe Faktoren
6. Stage-spezifische Wahrscheinlichkeiten
7. Zeitliche Verteilung der Deals

Gib detaillierte Forecasts mit Konfidenzintervallen aus.
Format: JSON mit forecasts, trends, risks, und recommendations.`;

    const forecastData = {
      forecastPeriod,
      historical: {
        totalOpportunities: allOpportunities.length,
        wonDeals: wonOpportunities.length,
        totalRevenue: wonOpportunities.reduce((sum, opp) => sum + parseFloat(opp.amount.toString()), 0),
        avgDealSize: wonOpportunities.length ? 
          wonOpportunities.reduce((sum, opp) => sum + parseFloat(opp.amount.toString()), 0) / wonOpportunities.length : 0,
        monthlyTrends: monthlyWins,
        conversionRates: stageConversion.map(s => ({
          stage: s.stage,
          count: s._count.stage,
          value: s._sum.amount || 0,
        })),
      },
      currentPipeline: {
        totalValue: currentPipeline.reduce((sum, opp) => sum + parseFloat(opp.amount.toString()), 0),
        totalDeals: currentPipeline.length,
        byStage: currentPipeline.reduce((acc, opp) => {
          acc[opp.stage] = (acc[opp.stage] || 0) + parseFloat(opp.amount.toString());
          return acc;
        }, {} as Record<string, number>),
        avgProbability: currentPipeline.length ?
          currentPipeline.reduce((sum, opp) => sum + opp.probability, 0) / currentPipeline.length : 0,
      },
      context: {
        forecastPeriod,
        includeSeasonality,
        includeMarketTrends,
        confidenceLevel,
        analysisDate: currentDate.toISOString(),
      },
    };

    const userPrompt = `Erstelle eine Umsatzprognose basierend auf diesen Daten:

${JSON.stringify(forecastData, null, 2)}

Analysiere Trends, berechne Wahrscheinlichkeiten und gib eine detaillierte ${forecastPeriod} Prognose aus.`;

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
        temperature: 0.2, // Lower temperature for forecasting
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    let forecastResult = llmResult.choices?.[0]?.message?.content;

    if (!forecastResult) {
      throw new Error('No forecast result generated');
    }

    // Parse and sanitize JSON response
    try {
      forecastResult = JSON.parse(forecastResult);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const pipelineValue = forecastData.currentPipeline.totalValue;
      const avgProbability = forecastData.currentPipeline.avgProbability / 100;
      
      forecastResult = {
        forecast: {
          revenue: pipelineValue * avgProbability,
          deals: Math.round(forecastData.currentPipeline.totalDeals * avgProbability),
          confidence: 0.6,
        },
        summary: 'Basic forecast based on pipeline probability',
        risks: ['AI-Analyse konnte nicht vollständig durchgeführt werden'],
      };
    }

    const response = {
      forecastPeriod,
      userId: userId === 'all' ? null : userId,
      forecast: {
        revenue: forecastResult.forecast?.revenue || 0,
        deals: forecastResult.forecast?.deals || 0,
        confidence: forecastResult.forecast?.confidence || confidenceLevel,
        range: forecastResult.forecast?.range || {},
        breakdown: forecastResult.forecast?.breakdown || {},
      },
      trends: {
        historical: forecastResult.trends?.historical || [],
        seasonal: forecastResult.trends?.seasonal || [],
        growth: forecastResult.trends?.growth || 0,
      },
      insights: {
        summary: forecastResult.summary || '',
        opportunities: forecastResult.opportunities || [],
        risks: forecastResult.risks || [],
        recommendations: forecastResult.recommendations || [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'gpt-4.1-mini',
        dataQuality: forecastResult.metadata?.dataQuality || 'good',
        version: '1.0',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sales forecast error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Umsatzprognose' },
      { status: 500 }
    );
  }
}
