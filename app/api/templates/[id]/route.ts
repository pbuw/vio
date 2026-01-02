import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/get-session';

// GET single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.template.findUnique({
      where: { id },
      include: {
        templateCategories: {
          include: {
            templateSubCategories: {
              include: {
                templateCoverageRules: true,
                templateBudgets: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT update template (super admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive, categories } = body;

    // First, delete all existing nested data
    await db.templateCategory.deleteMany({
      where: { templateId: id },
    });

    // Then update template with new data
    const template = await db.template.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        templateCategories: {
          create: categories?.map((cat: any, catIndex: number) => ({
            name: cat.name,
            description: cat.description,
            order: catIndex,
            templateSubCategories: {
              create: cat.subCategories?.map((subCat: any, subIndex: number) => ({
                name: subCat.name,
                description: subCat.description,
                order: subIndex,
                templateCoverageRules: {
                  create: subCat.coverageRules?.map((rule: any) => ({
                    insuranceType: rule.insuranceType,
                    percentage: rule.percentage,
                    maxAmount: rule.maxAmount,
                    description: rule.description,
                  })) || [],
                },
                templateBudgets: {
                  create: subCat.budgets?.map((budget: any) => ({
                    year: budget.year || 0,
                    amount: budget.amount,
                  })) || [],
                },
              })) || [],
            },
          })) || [],
        },
      },
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

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE template (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await db.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

