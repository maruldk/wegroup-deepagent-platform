
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, description } = await request.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Typ und Beschreibung sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if customer exists and belongs to user's tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    const contactHistory = await prisma.contactHistory.create({
      data: {
        customerId: params.id,
        userId: session.user.id,
        type,
        description,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTACT_HISTORY_CREATED',
        resource: 'CONTACT_HISTORY',
        resourceId: contactHistory.id,
        details: { customerId: params.id, type, description: description.substring(0, 100) },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(contactHistory, { status: 201 });
  } catch (error) {
    console.error('Create contact history error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
