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
    const categoryId = searchParams.get('categoryId');

    const where: any = categoryId ? { categoryId } : {};
    if (categoryId) {
      // Verify category belongs to user
      const category = await db.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    } else {
      // Filter by user's categories
      where.category = { userId: user.id };
    }

    const subCategories = await db.subCategory.findMany({
      where,
      include: {
        category: true,
        coverageRules: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(subCategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
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
    const { name, description, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Name and categoryId are required' },
        { status: 400 }
      );
    }

    // Verify category belongs to user
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const subCategory = await db.subCategory.create({
      data: {
        name,
        description: description || null,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(subCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}

