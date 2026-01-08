import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, reviews } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await request.json();
  const { rating, comment, timeToFirstWin, timeTo100 } = json;

  const game = await db.select().from(games).where(eq(games.slug, params.slug)).get();
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const existing = await db.select().from(reviews).where(and(eq(reviews.userId, user.id), eq(reviews.gameId, game.id))).get();

  const reviewData = {
    user: user.name || user.email.split('@')[0],
    userId: user.id,
    rating,
    comment,
    date: new Date().toLocaleDateString(),
    timeToFirstWin,
    hoursPlayed: timeTo100,
    gameId: game.id
  };

  let result;
  if (existing) {
    result = await db.update(reviews).set(reviewData).where(eq(reviews.id, existing.id)).returning().get();
  } else {
    result = await db.insert(reviews).values(reviewData).returning().get();
  }

  return NextResponse.json({ review: result });
}