import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload || typeof payload.email !== 'string') return null;

  const user = await db.select({
    id: users.id,
    email: users.email,
    name: users.username
  }).from(users).where(eq(users.email, payload.email)).get();

  return user;
}