#!/bin/bash
# Build script with automatic migrations

set -e  # Exit on error

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "📦 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, but continuing build..."
  echo "   This might happen if migrations are already applied or database is not accessible."
}

echo "🏗️  Building Next.js application..."
next build

echo "✅ Build completed successfully!"

