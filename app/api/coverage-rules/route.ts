import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subCategoryId = searchParams.get('subCategoryId');

    const where: any = subCategoryId ? { subCategoryId } : {};
    if (subCategoryId) {
      // Verify subcategory belongs to user
      const subCategory = await db.subCategory.findFirst({
        where: {
          id: subCategoryId,
          category: { userId: user.id },
        },
      });
      if (!subCategory) {
        return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
      }
    } else {
      // Filter by user's subcategories
      where.subCategory = { category: { userId: user.id } };
    }

    const coverageRules = await db.coverageRule.findMany({
      where,
      include: {
        subCategory: true,
      },
      orderBy: {
        insuranceType: 'asc',
      },
    });
    return NextResponse.json(coverageRules);
  } catch (error) {
    console.error('Error fetching coverage rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coverage rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subCategoryId, insuranceType, percentage, maxAmount, description } = body;

    if (!subCategoryId || !insuranceType) {
      return NextResponse.json(
        { error: 'subCategoryId and insuranceType are required' },
        { status: 400 }
      );
    }

    if (insuranceType !== 'basic' && insuranceType !== 'supplementary') {
      return NextResponse.json(
        { error: 'insuranceType must be "basic" or "supplementary"' },
        { status: 400 }
      );
    }

    // Verify subcategory belongs to user
    const subCategory = await db.subCategory.findFirst({
      where: {
        id: subCategoryId,
        category: { userId: user.id },
      },
    });

    if (!subCategory) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    const coverageRule = await db.coverageRule.upsert({
      where: {
        subCategoryId_insuranceType: {
          subCategoryId,
          insuranceType,
        },
      },
      update: {
        percentage: percentage !== undefined ? percentage : null,
        maxAmount: maxAmount !== undefined ? maxAmount : null,
        description: description || null,
      },
      create: {
        subCategoryId,
        insuranceType,
        percentage: percentage !== undefined ? percentage : null,
        maxAmount: maxAmount !== undefined ? maxAmount : null,
        description: description || null,
      },
      include: {
        subCategory: true,
      },
    });

    return NextResponse.json(coverageRule, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating coverage rule:', error);
    return NextResponse.json(
      { error: 'Failed to create/update coverage rule' },
      { status: 500 }
    );
  }
}

