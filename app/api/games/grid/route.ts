import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { sql, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gridGames = await db.select({
      id: games.id,
      slug: games.slug,
    })
    .from(games)
    .orderBy(sql`RANDOM()`)
    .limit(30)
    .all();

    const [total] = await db.select({ count: count() }).from(games);

    return NextResponse.json({
      games: gridGames,
      totalCount: total?.count || 0
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch grid games' }, { status: 500 });
  }
}