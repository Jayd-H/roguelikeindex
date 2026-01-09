import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description } = await request.json();
    const listId = params.id;

    const list = await db.select().from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
      .get();

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    const updatedList = await db.update(lists)
      .set({ 
        title: title || list.title, 
        description: description || list.description,
        updatedAt: new Date().toISOString()
      })
      .where(eq(lists.id, listId))
      .returning()
      .get();

    return NextResponse.json(updatedList);
  } catch {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const listId = params.id;
    
    // Verify ownership
    const list = await db.select().from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
      .get();

    if (!list) return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 404 });

    await db.delete(lists).where(eq(lists.id, listId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}