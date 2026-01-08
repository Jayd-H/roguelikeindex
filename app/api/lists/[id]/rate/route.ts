import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listRatings, lists } from '@/lib/schema';
import { eq, and, avg } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rating } = await request.json();
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const listId = params.id;
  const list = await db.select().from(lists).where(eq(lists.id, listId)).get();
  
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  // Update or Insert Rating
  const existing = await db.select().from(listRatings).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, listId))).get();

  if (existing) {
    await db.update(listRatings).set({ rating }).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, listId))).run();
  } else {
    await db.insert(listRatings).values({ userId: user.id, listId, rating }).run();
  }

  // Recalculate Average
  const result = await db.select({ value: avg(listRatings.rating) }).from(listRatings).where(eq(listRatings.listId, listId)).get();
  const newAverage = result?.value ? parseFloat(result.value) : 0;

  await db.update(lists).set({ averageRating: newAverage }).where(eq(lists.id, listId)).run();

  return NextResponse.json({ success: true, averageRating: newAverage });
}