import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';

/**
 * GET /api/expenses/:id/documents
 * List all documents for an expense
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify expense belongs to user
    const expense = await db.expense.findFirst({
      where: {
        id,
        subCategory: {
          category: {
            userId: user.id,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      );
    }

    // Get all documents for this expense
    const documents = await db.expenseDocument.findMany({
      where: {
        expenseId: id,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        documentType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

