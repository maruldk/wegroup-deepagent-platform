
import { NextRequest, NextResponse } from 'next/server';
import { aiWorkflowEngine } from '@/lib/ai/workflows/ai-workflow-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workflows = aiWorkflowEngine.getWorkflows();
    const runningInstances = aiWorkflowEngine.getRunningInstances();

    return NextResponse.json({
      success: true,
      data: {
        workflows,
        runningInstances,
        summary: {
          totalWorkflows: workflows.length,
          activeWorkflows: workflows.filter(w => w.isActive).length,
          runningInstances: runningInstances.length
        }
      }
    });
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, context } = body;

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const result = await aiWorkflowEngine.executeWorkflow(workflowId, context || {});

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
