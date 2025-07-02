
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const predictionType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const where: any = { 
      tenantId: session.user.tenantId,
      status: 'ACTIVE'
    };

    if (predictionType) {
      where.predictionType = predictionType;
    }

    const predictions = await prisma.aIPrediction.findMany({
      where,
      orderBy: { targetDate: 'asc' },
      take: limit
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('AI Predictions Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI predictions' },
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
    const { predictionId, actualValue } = body;

    // Update prediction with actual value and calculate accuracy
    const prediction = await prisma.aIPrediction.findUnique({
      where: { id: predictionId }
    });

    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    const accuracy = prediction.predictedValue > 0 
      ? 1 - Math.abs(prediction.predictedValue - actualValue) / prediction.predictedValue
      : 0;

    await prisma.aIPrediction.update({
      where: { id: predictionId },
      data: {
        actualValue,
        accuracy: Math.max(0, Math.min(1, accuracy)),
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ success: true, accuracy });
  } catch (error) {
    console.error('AI Predictions Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update prediction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
