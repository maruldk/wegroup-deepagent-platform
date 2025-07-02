
/**
 * Personalized Recommendations API - Generate user-specific recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserFeedbackService } from '@/lib/ai/user-feedback-service';

export const dynamic = "force-dynamic";

const feedbackService = new UserFeedbackService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { context } = body;

    const recommendations = await feedbackService.generatePersonalizedRecommendations(
      session.user.id,
      context || {}
    );

    return NextResponse.json({ 
      success: true, 
      data: recommendations,
      message: 'Recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error in recommendations POST:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
