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
    const year = searchParams.get('year') 
      ? parseInt(searchParams.get('year')!) 
      : new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Get all expenses for the year (filtered by user)
    const expenses = await db.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        subCategory: {
          category: {
            userId: user.id,
          },
        },
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Calculate totals
    const totals = {
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalBasicCoverage: expenses.reduce((sum, e) => sum + e.basicCoverage, 0),
      totalSupplementaryCoverage: expenses.reduce((sum, e) => sum + e.supplementaryCoverage, 0),
      totalUserPays: expenses.reduce((sum, e) => sum + e.userPays, 0),
    };

    // Get all budgets for the year (filtered by user)
    const budgets = await db.budget.findMany({
      where: {
        year,
        subCategory: {
          category: {
            userId: user.id,
          },
        },
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Calculate remaining budgets
    const budgetSummary = budgets.map((budget) => ({
      id: budget.id,
      subCategoryId: budget.subCategoryId,
      subCategoryName: budget.subCategory.name,
      categoryName: budget.subCategory.category.name,
      totalBudget: budget.amount,
      usedAmount: budget.usedAmount,
      remainingAmount: budget.amount - budget.usedAmount,
      percentageUsed: (budget.usedAmount / budget.amount) * 100,
    }));

    // Get expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const categoryName = expense.subCategory.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          totalExpenses: 0,
          totalBasicCoverage: 0,
          totalSupplementaryCoverage: 0,
          totalUserPays: 0,
          expenseCount: 0,
        };
      }
      acc[categoryName].totalExpenses += expense.amount;
      acc[categoryName].totalBasicCoverage += expense.basicCoverage;
      acc[categoryName].totalSupplementaryCoverage += expense.supplementaryCoverage;
      acc[categoryName].totalUserPays += expense.userPays;
      acc[categoryName].expenseCount += 1;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      year,
      totals,
      budgetSummary,
      expensesByCategory,
      recentExpenses: expenses.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

