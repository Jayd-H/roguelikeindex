import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listItems, lists } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
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

    // Verify ownership of the list
    const list = await db.select().from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
      .get();

    if (!list) return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 404 });

    await db.delete(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)))
      .run();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to remove game' }, { status: 500 });
  }
}