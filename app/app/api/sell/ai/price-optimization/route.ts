
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
      productIds = [],
      opportunityId,
      customerSegment,
      competitorPricing = {},
      marketConditions = {},
      volumeDiscount = false,
      urgency = 'normal',
      relationship = 'new'
    } = data;

    if (!productIds.length && !opportunityId) {
      return NextResponse.json(
        { error: 'ProductIds oder OpportunityId erforderlich' },
        { status: 400 }
      );
    }

    // Get products data
    let products: any[] = [];
    let opportunity: any = null;

    if (opportunityId) {
      opportunity = await prisma.salesOpportunity.findFirst({
        where: {
          id: opportunityId,
          tenantId: session.user.tenantId,
        },
        include: {
          customer: true,
          products: {
            include: { product: true },
          },
        },
      });

      if (opportunity) {
        products = opportunity.products.map((op: any) => op.product);
      }
    } else {
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          tenantId: session.user.tenantId,
        },
      });
    }

    if (!products.length) {
      return NextResponse.json({ error: 'Keine Produkte gefunden' }, { status: 404 });
    }

    // Get historical pricing data
    const historicalQuotes = await prisma.salesQuote.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { in: ['ACCEPTED', 'SENT'] },
        items: {
          some: {
            productId: { in: products.map(p => p.id) },
          },
        },
      },
      include: {
        items: {
          where: {
            productId: { in: products.map(p => p.id) },
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Build AI prompt for price optimization
    const systemPrompt = `Du bist ein Sales & Pricing AI-Experte. Analysiere die Produkt- und Marktdaten und optimiere die Preisgestaltung.

Berücksichtige:
1. Produktkosten und Margen
2. Historische Preisdaten
3. Kundensegment und Beziehung
4. Wettbewerbspreise
5. Marktbedingungen
6. Volumenrabatte
7. Dringlichkeit des Geschäfts
8. Saisonalität

Gib optimierte Preise mit Begründung und Verhandlungsstrategien aus.
Format: JSON mit recommendations für jedes Produkt.`;

    const pricingData = {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        currentPrice: p.price,
        cost: p.cost,
        category: p.category,
        margin: p.cost ? ((p.price - p.cost) / p.price * 100) : null,
      })),
      opportunity: opportunity ? {
        stage: opportunity.stage,
        amount: opportunity.amount,
        probability: opportunity.probability,
        customer: opportunity.customer,
      } : null,
      context: {
        customerSegment,
        competitorPricing,
        marketConditions,
        volumeDiscount,
        urgency,
        relationship,
      },
      historicalData: {
        averagePrices: historicalQuotes.flatMap(q => q.items).map(item => ({
          productId: item.productId,
          unitPrice: item.unitPrice,
          discount: item.discount,
          finalPrice: item.unitPrice - item.discount,
        })),
        totalQuotes: historicalQuotes.length,
      },
    };

    const userPrompt = `Optimiere die Preise für diese Produkte:

${JSON.stringify(pricingData, null, 2)}

Analysiere alle Faktoren und gib konkrete Preisempfehlungen mit Begründung aus.`;

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
    let optimizationResult = llmResult.choices?.[0]?.message?.content;

    if (!optimizationResult) {
      throw new Error('No optimization result generated');
    }

    // Parse and sanitize JSON response
    try {
      optimizationResult = JSON.parse(optimizationResult);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      optimizationResult = {
        recommendations: products.map(p => ({
          productId: p.id,
          currentPrice: p.price,
          recommendedPrice: p.price,
          reasoning: 'AI-Analyse konnte nicht vollständig durchgeführt werden',
          confidence: 0.5,
        })),
        summary: 'Preisoptimierung konnte nicht vollständig durchgeführt werden',
      };
    }

    const response = {
      opportunityId,
      products: products.map(p => p.id),
      optimization: {
        recommendations: optimizationResult.recommendations || [],
        summary: optimizationResult.summary || '',
        strategy: optimizationResult.strategy || '',
        risks: optimizationResult.risks || [],
        opportunities: optimizationResult.opportunities || [],
        negotiationTips: optimizationResult.negotiationTips || [],
      },
      metadata: {
        optimizedAt: new Date().toISOString(),
        aiModel: 'gpt-4.1-mini',
        dataVersion: '1.0',
        context: {
          customerSegment,
          urgency,
          relationship,
          volumeDiscount,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Price optimization error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Preisoptimierung' },
      { status: 500 }
    );
  }
}
