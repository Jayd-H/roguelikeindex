import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedLists, lists } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listId = params.id;
  const list = await db.select().from(lists).where(eq(lists.id, listId)).get();
  
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const existing = await db.select().from(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, listId))).get();

  if (existing) {
    await db.delete(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, listId))).run();
    return NextResponse.json({ saved: false });
  } else {
    await db.insert(savedLists).values({ userId: user.id, listId }).run();
    return NextResponse.json({ saved: true });
  }
}