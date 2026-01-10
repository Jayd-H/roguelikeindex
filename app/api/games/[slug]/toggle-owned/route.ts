import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, ownedGames } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const game = await db.select({ id: games.id }).from(games).where(eq(games.slug, params.slug)).get();
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const existing = await db.select({ userId: ownedGames.userId }).from(ownedGames).where(and(eq(ownedGames.userId, user.id), eq(ownedGames.gameId, game.id))).get();

  if (existing) {
    await db.delete(ownedGames).where(and(eq(ownedGames.userId, user.id), eq(ownedGames.gameId, game.id))).run();
    return NextResponse.json({ owned: false });
  } else {
    await db.insert(ownedGames).values({ userId: user.id, gameId: game.id }).run();
    return NextResponse.json({ owned: true });
  }
}