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
    const year = searchParams.get('year');

    const where: any = {
      subCategory: {
        category: {
          userId: user.id,
        },
      },
    };
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
      where.subCategoryId = subCategoryId;
    }
    if (year) where.year = parseInt(year);

    const budgets = await db.budget.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        year: 'desc',
      },
    });
    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
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
    const { subCategoryId, year, amount } = body;

    if (!subCategoryId || !year || amount === undefined) {
      return NextResponse.json(
        { error: 'subCategoryId, year, and amount are required' },
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

    const budget = await db.budget.upsert({
      where: {
        subCategoryId_year: {
          subCategoryId,
          year: parseInt(year),
        },
      },
      update: {
        amount: parseFloat(amount),
      },
      create: {
        subCategoryId,
        year: parseInt(year),
        amount: parseFloat(amount),
        usedAmount: 0,
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create/update budget' },
      { status: 500 }
    );
  }
}

