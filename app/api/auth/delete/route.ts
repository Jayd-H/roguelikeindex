import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { password } = await req.json();
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const currentUserRecord = await db.select().from(users).where(eq(users.id, user.id)).get();
    if (!currentUserRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const valid = await verifyPassword(password, currentUserRecord.password);
    if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 403 });

    await db.delete(users).where(eq(users.id, user.id));
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    
    return response;
  } catch {
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}