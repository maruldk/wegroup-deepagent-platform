
/**
 * Explicit Feedback API - Collect and process explicit user feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserFeedbackService } from '@/lib/ai/user-feedback-service';
import { UserFeedbackData } from '@/lib/types';

export const dynamic = "force-dynamic";

const feedbackService = new UserFeedbackService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      targetType, 
      targetId, 
      feedbackType, 
      rating, 
      sentiment, 
      comment, 
      context,
      weight 
    } = body;

    if (!targetType || !targetId || !feedbackType) {
      return NextResponse.json(
        { error: 'Target type, target ID, and feedback type are required' },
        { status: 400 }
      );
    }

    const feedbackData: UserFeedbackData = {
      userId: session.user.id,
      targetType,
      targetId,
      feedbackType,
      rating,
      sentiment,
      comment,
      context,
      weight
    };

    const feedback = await feedbackService.collectExplicitFeedback(
      feedbackData,
      session.user.tenantId
    );

    return NextResponse.json({ 
      success: true, 
      data: feedback,
      message: 'Feedback collected successfully'
    });
  } catch (error) {
    console.error('Error in explicit feedback POST:', error);
    return NextResponse.json(
      { error: 'Failed to collect feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const targetType = searchParams.get('targetType');
    const timeWindow = parseInt(searchParams.get('timeWindow') || '30');

    const analysis = await feedbackService.analyzeFeedbackPatterns(
      userId,
      targetType || undefined,
      timeWindow
    );

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error in explicit feedback GET:', error);
    return NextResponse.json(
      { error: 'Failed to analyze feedback' },
      { status: 500 }
    );
  }
}
