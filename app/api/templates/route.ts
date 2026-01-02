import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isSuperAdmin } from '@/lib/get-session';

// GET all templates (public, but only active ones for regular users)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.role === 'superadmin';
    
    // Super admins see all templates, regular users only see active ones
    const templates = await db.template.findMany({
      where: isAdmin ? {} : { isActive: true },
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
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST create new template (super admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isActive = true, categories } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Create template with all nested data
    const template = await db.template.create({
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

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

