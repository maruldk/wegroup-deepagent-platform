
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxCategories = await prisma.taxCategory.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ taxCategories });
  } catch (error) {
    console.error('Get tax categories error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

    const data = await request.json();
    const { name, rate } = data;

    if (!name || rate === undefined) {
      return NextResponse.json(
        { error: 'Name und Steuersatz sind erforderlich' },
        { status: 400 }
      );
    }

    const taxCategory = await prisma.taxCategory.create({
      data: {
        name,
        rate,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(taxCategory, { status: 201 });
  } catch (error) {
    console.error('Create tax category error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
