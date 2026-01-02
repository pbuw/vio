import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';

// POST apply template to user's account
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, replaceExisting = false } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch template with all nested data
    const template = await db.template.findUnique({
      where: { id: templateId, isActive: true },
      include: {
        templateCategories: {
          include: {
            templateSubCategories: {
              include: {
                templateCoverageRules: true,
                templateBudgets: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 404 }
      );
    }

    // If replaceExisting, delete all user's existing categories
    if (replaceExisting) {
      await db.category.deleteMany({
        where: { userId: user.id },
      });
    }

    const currentYear = new Date().getFullYear();

    // Create categories, subcategories, coverage rules, and budgets from template
    const createdCategories = await Promise.all(
      template.templateCategories.map(async (templateCat) => {
        const category = await db.category.create({
          data: {
            name: templateCat.name,
            description: templateCat.description,
            userId: user.id,
            subCategories: {
              create: templateCat.templateSubCategories.map((templateSubCat) => {
                // Find budget for current year or use year 0 (all years)
                const budget = templateSubCat.templateBudgets.find(
                  (b) => b.year === currentYear || b.year === 0
                );

                return {
                  name: templateSubCat.name,
                  description: templateSubCat.description,
                  coverageRules: {
                    create: templateSubCat.templateCoverageRules.map((rule) => ({
                      insuranceType: rule.insuranceType,
                      percentage: rule.percentage,
                      maxAmount: rule.maxAmount,
                      description: rule.description,
                    })),
                  },
                  budgets: budget
                    ? {
                        create: {
                          year: currentYear,
                          amount: budget.amount,
                          usedAmount: 0,
                        },
                      }
                    : undefined,
                };
              }),
            },
          },
          include: {
            subCategories: {
              include: {
                coverageRules: true,
                budgets: true,
              },
            },
          },
        });
        return category;
      })
    );

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" applied successfully`,
      categories: createdCategories,
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}

