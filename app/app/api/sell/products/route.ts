
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const isService = searchParams.get('isService');
    const isActive = searchParams.get('isActive') !== 'false';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      isActive,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (category !== 'all') {
      where.category = category;
    }

    if (isService !== null) {
      where.isService = isService === 'true';
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              quoteItems: true,
              opportunityProducts: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
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
    const {
      name,
      description,
      sku,
      category,
      subcategory,
      price,
      cost,
      currency = 'EUR',
      unit,
      weight,
      dimensions,
      imageUrl,
      isService = false,
      isRecurring = false,
      billingCycle,
      taxRate,
      minQuantity = 1,
      maxQuantity,
      stockLevel,
      reorderLevel,
      tags = [],
      customFields = {}
    } = data;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name und Preis sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if SKU is unique (if provided)
    if (sku) {
      const existingProduct = await prisma.product.findFirst({
        where: { sku, tenantId: session.user.tenantId },
      });
      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU bereits vorhanden' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        category,
        subcategory,
        price,
        cost,
        currency,
        unit,
        weight,
        dimensions,
        imageUrl,
        isService,
        isRecurring,
        billingCycle,
        taxRate,
        minQuantity,
        maxQuantity,
        stockLevel,
        reorderLevel,
        tags,
        customFields,
        tenantId: session.user.tenantId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRODUCT_CREATED',
        resource: 'PRODUCT',
        resourceId: product.id,
        details: { name: product.name, price: product.price.toString() },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
