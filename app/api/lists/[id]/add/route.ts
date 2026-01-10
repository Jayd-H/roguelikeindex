import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listItems, lists } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { gameId } = await request.json();
    const listId = params.id;

    const list = await db.select({ id: lists.id }).from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
      .get();

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    const existing = await db.select({ id: listItems.id }).from(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)))
      .get();

    if (existing) {
      return NextResponse.json({ message: 'Game already in list' });
    }

    const countRes = await db.select({ value: count() })
      .from(listItems)
      .where(eq(listItems.listId, listId));
    
    const nextOrder = (countRes[0]?.value || 0);

    await db.insert(listItems).values({
      listId,
      gameId,
      order: nextOrder
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to add game' }, { status: 500 });
  }
}