import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, favorites } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const game = await db.select().from(games).where(eq(games.slug, params.slug)).get();
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.gameId, game.id))).get();

  if (existing) {
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.gameId, game.id))).run();
    return NextResponse.json({ favorited: false });
  } else {
    await db.insert(favorites).values({ userId: user.id, gameId: game.id }).run();
    return NextResponse.json({ favorited: true });
  }
}