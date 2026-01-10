import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, favorites, ownedGames, reviews } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ favorited: false, owned: false, review: null });

  const game = await db.select({ id: games.id })
    .from(games)
    .where(eq(games.slug, params.slug))
    .get();
    
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const fav = await db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.gameId, game.id))).get();
  const owned = await db.select().from(ownedGames).where(and(eq(ownedGames.userId, user.id), eq(ownedGames.gameId, game.id))).get();
  const review = await db.select().from(reviews).where(and(eq(reviews.userId, user.id), eq(reviews.gameId, game.id))).get();

  return NextResponse.json({
    favorited: !!fav,
    owned: !!owned,
    review: review || null
  });
}