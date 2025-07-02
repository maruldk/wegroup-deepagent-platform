
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectManagementService } from '@/lib/services/project-management-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const templates = await ProjectManagementService.getProjectTemplates(
      session.user.tenantId,
      category
    );

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    const { name, description, category, estimatedDuration, defaultBudget, taskTemplates } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Template name and category are required' },
        { status: 400 }
      );
    }

    const template = await ProjectManagementService.createProjectTemplate({
      name,
      description,
      category,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      defaultBudget: defaultBudget ? parseFloat(defaultBudget) : undefined,
      taskTemplates,
      tenantId: session.user.tenantId,
      createdBy: session.user.id,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating project template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}
