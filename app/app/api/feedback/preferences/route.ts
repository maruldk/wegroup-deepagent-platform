
/**
 * User Preferences API - Manage learned user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserFeedbackService } from '@/lib/ai/user-feedback-service';
import { UserPreferenceData } from '@/lib/types';

export const dynamic = "force-dynamic";

const feedbackService = new UserFeedbackService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preferenceType = searchParams.get('type');

    const preferences = await feedbackService.getUserPreferences(
      session.user.id,
      preferenceType || undefined
    );

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json(
      { error: 'Failed to get user preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferenceType, key, value, source, confidence } = body;

    if (!preferenceType || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Preference type, key, and value are required' },
        { status: 400 }
      );
    }

    const preferenceData: UserPreferenceData = {
      userId: session.user.id,
      preferenceType,
      key,
      value,
      source: source || 'EXPLICIT',
      confidence: confidence || 0.8
    };

    const preference = await feedbackService.updateUserPreference(
      preferenceData,
      session.user.tenantId
    );

    return NextResponse.json({ 
      success: true, 
      data: preference,
      message: 'Preference updated successfully'
    });
  } catch (error) {
    console.error('Error in preferences POST:', error);
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    );
  }
}
