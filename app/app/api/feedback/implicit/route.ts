
/**
 * Implicit Feedback API - Collect behavioral feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserFeedbackService } from '@/lib/ai/user-feedback-service';
import { ImplicitFeedbackData } from '@/lib/types';

export const dynamic = "force-dynamic";

const feedbackService = new UserFeedbackService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      targetType, 
      targetId, 
      value, 
      context,
      sessionId 
    } = body;

    if (!action || !targetType) {
      return NextResponse.json(
        { error: 'Action and target type are required' },
        { status: 400 }
      );
    }

    const feedbackData: ImplicitFeedbackData = {
      userId: session.user.id,
      sessionId,
      action,
      targetType,
      targetId,
      value,
      context,
      timestamp: new Date()
    };

    const feedback = await feedbackService.collectImplicitFeedback(
      feedbackData,
      session.user.tenantId
    );

    return NextResponse.json({ 
      success: true, 
      data: feedback,
      message: 'Implicit feedback collected'
    });
  } catch (error) {
    console.error('Error in implicit feedback POST:', error);
    return NextResponse.json(
      { error: 'Failed to collect implicit feedback' },
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
    const timeWindow = parseInt(searchParams.get('timeWindow') || '7');

    const metrics = await feedbackService.getFeedbackMetrics(
      session.user.tenantId,
      timeWindow
    );

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error in implicit feedback GET:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback metrics' },
      { status: 500 }
    );
  }
}
