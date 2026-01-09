import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags, gamesToTags, games } from '@/lib/schema';
import { eq, count, desc } from 'drizzle-orm';

export const revalidate = 86400;

export async function GET() {
  try {
    const totalGamesRes = await db.select({ value: count() }).from(games);
    const totalGames = totalGamesRes[0]?.value || 0;

    const tagsWithCounts = await db
      .select({
        id: tags.id,
        name: tags.name,
        gameCount: count(gamesToTags.gameId),
      })
      .from(tags)
      .leftJoin(gamesToTags, eq(tags.id, gamesToTags.tagId))
      .groupBy(tags.id)
      .orderBy(desc(count(gamesToTags.gameId)));

    const excludedTags = [
      "steam trading cards",
      "steam cloud",
      "custom volume controls",
      "save anytime",
      "stereo sound",
      "remote play on tv",
      "remote play on tablet",
      "remote play on phone",
      "adjustable text size",
      "captions available",
      "surround sound",
      "tracked controller support",
      "steam timeline",
      "subtitle options"
    ];

    const filteredTags = tagsWithCounts.filter(t => 
      t.gameCount > 1 && 
      t.gameCount < totalGames && 
      !excludedTags.includes(t.name.toLowerCase())
    );

    return NextResponse.json(filteredTags);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}