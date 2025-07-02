
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getOrchestrator, AIEventOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get AI insights from database directly
    const insights = await prisma.aIInsight.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(category && { category })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('AI Insights Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisType, data, context } = body;

    // Generate insights based on analysis type
    let result;
    switch (analysisType) {
      case 'ANOMALY_DETECTION':
        result = { 
          type: 'ANOMALY_DETECTION',
          insights: ['Mock anomaly detection insight'],
          confidence: 0.85,
          data
        };
        break;
      case 'PREDICTIVE_ANALYSIS':
        result = { 
          type: 'PREDICTIVE_ANALYSIS',
          insights: ['Mock predictive analysis insight'],
          confidence: 0.75,
          data
        };
        break;
      case 'RISK_ASSESSMENT':
        result = { 
          type: 'RISK_ASSESSMENT',
          insights: ['Mock risk assessment insight'],
          confidence: 0.90,
          data
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Insights Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, actionTaken } = body;

    // Mark insight as read in database
    await prisma.aIInsight.update({
      where: { id: insightId },
      data: { 
        isRead: true,
        actionTaken: actionTaken || null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI Insights Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
