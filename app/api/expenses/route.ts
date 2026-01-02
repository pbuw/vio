import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateCoverage } from '@/lib/coverage-calculator';
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
    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const { amount, date, description, subCategoryId } = body;

    if (!amount || !subCategoryId) {
      return NextResponse.json(
        { error: 'Amount and subCategoryId are required' },
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

    // Get coverage rules for this subcategory
    const coverageRules = await db.coverageRule.findMany({
      where: {
        subCategoryId,
      },
    });

    const basicRule = coverageRules.find((r) => r.insuranceType === 'basic') || null;
    const supplementaryRule = coverageRules.find((r) => r.insuranceType === 'supplementary') || null;

    // Calculate coverage
    const calculation = calculateCoverage(
      amount,
      basicRule
        ? {
            insuranceType: 'basic',
            percentage: basicRule.percentage,
            maxAmount: basicRule.maxAmount,
          }
        : null,
      supplementaryRule
        ? {
            insuranceType: 'supplementary',
            percentage: supplementaryRule.percentage,
            maxAmount: supplementaryRule.maxAmount,
          }
        : null
    );

    // Create expense
    const expense = await db.expense.create({
      data: {
        amount,
        date: date ? new Date(date) : new Date(),
        description: description || null,
        subCategoryId,
        basicCoverage: calculation.basicCoverage,
        supplementaryCoverage: calculation.supplementaryCoverage,
        userPays: calculation.userPays,
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update budget for current year
    const expenseDate = date ? new Date(date) : new Date();
    const year = expenseDate.getFullYear();

    const budget = await db.budget.findUnique({
      where: {
        subCategoryId_year: {
          subCategoryId,
          year,
        },
      },
    });

    if (budget) {
      await db.budget.update({
        where: {
          id: budget.id,
        },
        data: {
          usedAmount: budget.usedAmount + calculation.supplementaryCoverage,
        },
      });
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // Get the expense before deleting to update the budget
    const expense = await db.expense.findFirst({
      where: {
        id,
        subCategory: {
          category: {
            userId: user.id,
          },
        },
      },
      include: {
        subCategory: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Delete the expense
    await db.expense.delete({
      where: { id },
    });

    // Update budget for the expense's year
    const expenseDate = new Date(expense.date);
    const year = expenseDate.getFullYear();

    const budget = await db.budget.findUnique({
      where: {
        subCategoryId_year: {
          subCategoryId: expense.subCategoryId,
          year,
        },
      },
    });

    if (budget) {
      // Subtract the supplementary coverage from the used amount
      await db.budget.update({
        where: {
          id: budget.id,
        },
        data: {
          usedAmount: Math.max(0, budget.usedAmount - expense.supplementaryCoverage),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

