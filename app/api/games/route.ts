import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamesToTags, tags } from '@/lib/schema';
import { and, eq, gte, inArray, like, desc, asc, count } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export const revalidate = 60;

const getCachedTotal = unstable_cache(
  async () => {
    const res = await db.select({ value: count() }).from(games);
    return res[0]?.value || 0;
  },
  ['total-games-count'],
  { revalidate: 3600 }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const search = searchParams.get('search');
  const tagNames = searchParams.get('tags');
  const combat = searchParams.get('combat');
  const narrative = searchParams.get('narrative');
  const rating = searchParams.get('rating');
  const complexity = searchParams.get('complexity');
  const meta = searchParams.get('meta');
  const deck = searchParams.get('deck');
  const sort = searchParams.get('sort') || 'rating';

  try {
    const conditions = [];

    if (search) conditions.push(like(games.title, `%${search}%`));

    if (tagNames) {
      const selectedTags = tagNames.split(',');
      const matchingGames = await db.selectDistinct({ gameId: gamesToTags.gameId })
        .from(gamesToTags)
        .leftJoin(tags, eq(gamesToTags.tagId, tags.id))
        .where(inArray(tags.name, selectedTags));
      
      const gameIds = matchingGames.map(g => g.gameId);

      if (gameIds.length > 0) {
        conditions.push(inArray(games.id, gameIds));
      } else {
        return NextResponse.json({ games: [], total: 0 });
      }
    }

    if (combat) conditions.push(inArray(games.combatType, combat.split(',')));
    if (narrative) conditions.push(inArray(games.narrativePresence, narrative.split(',')));
    if (rating) conditions.push(gte(games.rating, parseFloat(rating)));
    if (complexity) conditions.push(gte(games.complexity, parseFloat(complexity)));
    if (meta === 'true') conditions.push(eq(games.metaProgression, true));
    if (deck === 'true') conditions.push(eq(games.steamDeckVerified, true));

    let orderBy;
    switch (sort) {
      case 'newest':
        orderBy = desc(games.releaseDate);
        break;
      case 'alphabetical':
        orderBy = asc(games.title);
        break;
      case 'complexity':
        orderBy = desc(games.complexity);
        break;
      default:
        orderBy = desc(games.rating);
    }

    const offset = (page - 1) * limit;
    
    const gamesListIds = await db.select({ id: games.id })
      .from(games)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    if (gamesListIds.length === 0) {
      return NextResponse.json({ games: [], total: 0 });
    }

    const ids = gamesListIds.map(g => g.id);

    const gamesData = await db.select({
      id: games.id,
      slug: games.slug,
      title: games.title,
      description: games.description,
      combatType: games.combatType,
      narrativePresence: games.narrativePresence,
      avgRunLength: games.avgRunLength,
      difficulty: games.difficulty,
      rating: games.rating,
      steamAppId: games.steamAppId,
      steamDeckVerified: games.steamDeckVerified,
    })
    .from(games)
    .where(inArray(games.id, ids));

    const tagsData = await db.select({
      gameId: gamesToTags.gameId,
      name: tags.name
    })
    .from(gamesToTags)
    .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
    .where(inArray(gamesToTags.gameId, ids));

    const tagsMap: Record<string, { name: string }[]> = {};
    tagsData.forEach(t => {
      if (!tagsMap[t.gameId]) tagsMap[t.gameId] = [];
      if (tagsMap[t.gameId].length < 3) {
        tagsMap[t.gameId].push({ name: t.name });
      }
    });

    const gamesMap = new Map(gamesData.map(g => [g.id, g]));
    const sortedGames = ids.map(id => gamesMap.get(id)!);

    const formattedData = sortedGames.map(game => ({
      ...game,
      tags: tagsMap[game.id] || []
    }));

    let total = 0;
    const hasActiveFilters = search || tagNames || combat || narrative || rating || complexity || meta || deck;

    if (hasActiveFilters) {
      const totalResult = await db.select({ value: count() })
        .from(games)
        .where(and(...conditions));
      total = totalResult[0]?.value || 0;
    } else {
      total = await getCachedTotal();
    }

    return NextResponse.json({
      games: formattedData,
      total: total
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching games' }, { status: 500 });
  }
}