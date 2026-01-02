import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  
  // Fetch user from database to get role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function isSuperAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'superadmin';
}

