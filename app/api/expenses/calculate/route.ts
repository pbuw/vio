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
    const amount = searchParams.get('amount');
    const subCategoryId = searchParams.get('subCategoryId');

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

    const expenseAmount = parseFloat(amount);

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
      expenseAmount,
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

    return NextResponse.json(calculation);
  } catch (error) {
    console.error('Error calculating coverage:', error);
    return NextResponse.json(
      { error: 'Failed to calculate coverage' },
      { status: 500 }
    );
  }
}

