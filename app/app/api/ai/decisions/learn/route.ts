
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Decision Engine for handling AI learning
class AIDecisionLearningEngine {
  async learnFromFeedback(decisionId: string, feedback: any, userId: string) {
    try {
      // Store feedback in database
      await prisma.aIFeedback.create({
        data: {
          userId,
          tenantId: 'default', // Should come from session
          feedbackType: 'GENERAL',
          rating: feedback.rating,
          comment: feedback.comment,
          aiDecisionId: decisionId
        }
      });

      // Get decision details
      const decision = await prisma.aIDecision.findUnique({
        where: { id: decisionId }
      });

      if (!decision) {
        throw new Error('Decision not found');
      }

      // Update model performance based on feedback
      await this.updateModelPerformance(
        decision.decisionType,
        decision.confidence,
        feedback.rating >= 4 // Consider rating 4+ as positive
      );

      return { success: true };
    } catch (error) {
      console.error('Error learning from feedback:', error);
      throw error;
    }
  }

  private async updateModelPerformance(modelType: string, confidence: number, isPositive: boolean) {
    // Update model metrics in database
    const metricKey = `${modelType}_performance`;
    
    // This would update your model performance tracking
    console.log(`Updating model ${modelType} performance: confidence=${confidence}, positive=${isPositive}`);
  }

  private async calculateLearningMetrics(decisionId: string, feedback: any) {
    // Calculate how this feedback affects model learning
    return {
      improvementScore: feedback.rating / 5,
      confidenceAdjustment: feedback.rating >= 4 ? 0.02 : -0.05,
      learningWeight: 1.0
    };
  }

  private async generateImprovementRecommendations(decision: any, feedback: any, outcome?: any) {
    const recommendations = [];
    
    if (feedback.rating < 3) {
      recommendations.push('Review input parameters for accuracy');
      recommendations.push('Consider additional data sources');
    }
    
    if (decision.confidence < 0.7) {
      recommendations.push('Increase training data for this scenario');
    }
    
    return recommendations;
  }

  private async updateModelPerformanceMetrics(decision: any, feedback: any) {
    // Update aggregate model performance metrics
    const modelType = decision.decisionType;
    
    try {
      // Simplified model metrics update - avoiding complex Prisma relations
      console.log(`Updating model metrics for ${modelType}:`, {
        confidence: decision.confidence,
        rating: feedback.rating
      });
    } catch (error) {
      console.error('Error updating model metrics:', error);
    }
  }
}

// Global instance
let decisionEngineInstance: AIDecisionLearningEngine | null = null;

function getDecisionEngine(): AIDecisionLearningEngine {
  if (!decisionEngineInstance) {
    decisionEngineInstance = new AIDecisionLearningEngine();
  }
  return decisionEngineInstance;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { decisionId, feedback, outcome, recommendations } = body;

    if (!decisionId || !feedback) {
      return NextResponse.json(
        { success: false, error: 'Decision ID and feedback are required' },
        { status: 400 }
      );
    }

    // Validate feedback structure
    const validatedFeedback = {
      rating: Number(feedback.rating),
      comment: feedback.comment || '',
      category: feedback.category || 'general',
      timestamp: new Date().toISOString()
    };

    if (validatedFeedback.rating < 1 || validatedFeedback.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get the decision to learn from
    const decision = await prisma.aIDecision.findUnique({
      where: { id: decisionId }
    });

    if (!decision) {
      return NextResponse.json(
        { success: false, error: 'Decision not found' },
        { status: 404 }
      );
    }

    // Process learning from feedback
    const decisionEngine = getDecisionEngine();
    await decisionEngine.learnFromFeedback(
      decisionId,
      validatedFeedback,
      session.user.id!
    );

    // Update decision with outcome if provided
    if (outcome) {
      await prisma.aIDecision.update({
        where: { id: decisionId },
        data: {
          feedback: validatedFeedback.comment,
          isAccepted: validatedFeedback.rating >= 4
        }
      });
    }

    // Calculate learning metrics
    const engineInstance = getDecisionEngine();
    const learningMetrics = await (engineInstance as any).calculateLearningMetrics(decisionId, validatedFeedback);

    // Generate improvement recommendations if requested
    let improvementRecommendations: string[] = [];
    if (recommendations && validatedFeedback.rating < 4) {
      improvementRecommendations = await (engineInstance as any).generateImprovementRecommendations(
        decision, 
        validatedFeedback, 
        outcome
      );
    }

    // Update AI model performance metrics
    await (engineInstance as any).updateModelPerformanceMetrics(decision, validatedFeedback);

    return NextResponse.json({
      success: true,
      data: {
        feedbackId: `fb_${Date.now()}`,
        learningMetrics,
        improvementRecommendations,
        message: 'Feedback processed successfully'
      }
    });

  } catch (error) {
    console.error('Error processing AI decision feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const decisionId = url.searchParams.get('decisionId');
    const type = url.searchParams.get('type') || 'summary';

    if (type === 'summary') {
      // Return learning summary for all decisions
      const recentFeedback = await prisma.aIFeedback.findMany({
        where: {
          userId: session.user.id,
          feedbackType: 'GENERAL'
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          aiDecision: true
        }
      });

      const summary = {
        totalFeedback: recentFeedback.length,
        averageRating: recentFeedback.length > 0 
          ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length 
          : 0,
        positiveCount: recentFeedback.filter(f => f.rating >= 4).length,
        improvementTrend: 'stable', // Could be calculated from historical data
        lastLearningUpdate: recentFeedback[0]?.createdAt || null
      };

      return NextResponse.json({
        success: true,
        data: {
          summary,
          recentFeedback: recentFeedback.slice(0, 5)
        }
      });
    }

    if (decisionId) {
      // Return learning data for specific decision
      const decision = await prisma.aIDecision.findUnique({
        where: { id: decisionId },
        include: {
          aiFeedback: true
        }
      });

      if (!decision) {
        return NextResponse.json(
          { success: false, error: 'Decision not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          decision,
          feedbackCount: decision.feedback?.length || 0,
          learningStatus: decision.feedback && decision.feedback.length > 0 ? 'learned' : 'pending'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'AI Decision Learning API',
        endpoints: {
          'POST /': 'Submit feedback for learning',
          'GET /?type=summary': 'Get learning summary',
          'GET /?decisionId=X': 'Get specific decision learning data'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching AI decision learning data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
