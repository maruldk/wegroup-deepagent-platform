
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { WorkflowExecStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const workflowName = searchParams.get('workflowName');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {
      tenantId: session.user.tenantId
    };

    if (status) {
      where.status = status;
    }

    if (workflowName) {
      where.workflowDefinition = {
        name: {
          contains: workflowName,
          mode: 'insensitive'
        }
      };
    }

    // Get workflow executions
    const executions = await prisma.workflowExecution.findMany({
      where,
      include: {
        workflowDefinition: {
          select: {
            name: true,
            description: true,
            version: true
          }
        },
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.workflowExecution.count({ where });

    // Calculate statistics
    const stats = await prisma.workflowExecution.groupBy({
      by: ['status'],
      where: {
        tenantId: session.user.tenantId
      },
      _count: true
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      executions,
      stats: statusStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });

  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workflowDefinitionId,
      inputData,
      correlationId
    } = body;

    // Validate required fields
    if (!workflowDefinitionId || !inputData) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowDefinitionId, inputData' },
        { status: 400 }
      );
    }

    // Verify workflow definition exists and belongs to tenant
    const workflowDefinition = await prisma.workflowDefinition.findFirst({
      where: {
        id: workflowDefinitionId,
        tenantId: session.user.tenantId,
        isActive: true
      }
    });

    if (!workflowDefinition) {
      return NextResponse.json(
        { error: 'Workflow definition not found or inactive' },
        { status: 404 }
      );
    }

    // Calculate total steps
    const steps = Array.isArray(workflowDefinition.steps) 
      ? workflowDefinition.steps 
      : [];

    // Create workflow execution
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowDefinitionId,
        correlationId: correlationId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: WorkflowExecStatus.PENDING,
        currentStep: 1,
        totalSteps: steps.length,
        inputData,
        tenantId: session.user.tenantId
      },
      include: {
        workflowDefinition: {
          select: {
            name: true,
            description: true,
            version: true
          }
        }
      }
    });

    // TODO: Trigger workflow execution through orchestrator
    // This would normally start the actual workflow execution

    return NextResponse.json({
      success: true,
      execution,
      message: 'Workflow execution started successfully'
    });

  } catch (error) {
    console.error('Failed to start workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}
