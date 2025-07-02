
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const milestones = await db.milestone.findMany({
      where: {
        projectId: params.id,
        tenantId: session.user.tenantId,
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, dueDate } = body;

    if (!name || !dueDate) {
      return NextResponse.json(
        { error: 'Name and due date are required' },
        { status: 400 }
      );
    }

    const milestone = await db.milestone.create({
      data: {
        name,
        description,
        dueDate: new Date(dueDate),
        projectId: params.id,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create milestone' },
      { status: 500 }
    );
  }
}
