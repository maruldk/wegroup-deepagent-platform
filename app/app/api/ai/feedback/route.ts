
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackType, rating, comment, aiDecisionId, aiInsightId } = body;

    if (!feedbackType || !rating) {
      return NextResponse.json({ error: 'Feedback type and rating are required' }, { status: 400 });
    }

    const feedback = await prisma.aIFeedback.create({
      data: {
        feedbackType,
        rating: parseInt(rating),
        comment,
        aiDecisionId,
        aiInsightId,
        userId: session.user.id,
        tenantId: session.user.tenantId
      }
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('AI Feedback Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit AI feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const feedbackType = url.searchParams.get('type');

    const where: any = { tenantId: session.user.tenantId };
    if (feedbackType) where.feedbackType = feedbackType;

    const feedback = await prisma.aIFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Calculate feedback statistics
    const stats = {
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0,
      totalFeedback: feedback.length,
      ratingDistribution: {
        5: feedback.filter(f => f.rating === 5).length,
        4: feedback.filter(f => f.rating === 4).length,
        3: feedback.filter(f => f.rating === 3).length,
        2: feedback.filter(f => f.rating === 2).length,
        1: feedback.filter(f => f.rating === 1).length
      }
    };

    return NextResponse.json({ feedback, stats });
  } catch (error) {
    console.error('AI Feedback Get Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
