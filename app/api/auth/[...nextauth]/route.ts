import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const result = NextAuth(authOptions);

export const { handlers, auth } = result;
export const { GET, POST } = handlers;

