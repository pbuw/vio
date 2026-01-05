import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';
import { encryptFileForStorage } from '@/lib/server-encryption';

// Configure route for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '5242880', 10); // 5MB default
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * POST /api/expenses/documents
 * Upload documents for an expense
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const expenseId = formData.get('expenseId') as string;
    const documentType = formData.get('documentType') as string || 'invoice';
    const files = formData.getAll('files') as File[];

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Verify expense belongs to user
    const expense = await db.expense.findFirst({
      where: {
        id: expenseId,
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

    // Validate and process each file
    const uploadedDocuments = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed. Allowed types: PDF, JPG, PNG` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Read file as buffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Encrypt file with server-side encryption
      const encryptedData = encryptFileForStorage(fileBuffer, user.id);

      // Create document record
      const document = await db.expenseDocument.create({
        data: {
          expenseId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          encryptedData,
          documentType: documentType === 'reimbursement' ? 'reimbursement' : 'invoice',
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          documentType: true,
          createdAt: true,
        },
      });

      uploadedDocuments.push(document);
    }

    return NextResponse.json(
      { documents: uploadedDocuments },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

