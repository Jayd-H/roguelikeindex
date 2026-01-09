import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamesToTags, tags } from '@/lib/schema';
import { and, eq, gte, inArray, like, desc, asc, count } from 'drizzle-orm';

export const revalidate = 60;

const gameColumns = {
  id: games.id,
  slug: games.slug,
  title: games.title,
  description: games.description,
  subgenre: games.subgenre,
  combatType: games.combatType,
  narrativePresence: games.narrativePresence,
  avgRunLength: games.avgRunLength,
  timeToFirstWin: games.timeToFirstWin,
  timeTo100: games.timeTo100,
  difficulty: games.difficulty,
  rngReliance: games.rngReliance,
  userFriendliness: games.userFriendliness,
  complexity: games.complexity,
  synergyDepth: games.synergyDepth,
  replayability: games.replayability,
  metaProgression: games.metaProgression,
  steamDeckVerified: games.steamDeckVerified,
  rating: games.rating,
  releaseDate: games.releaseDate,
  developer: games.developer,
  publisher: games.publisher,
  steamAppId: games.steamAppId,
  achievementsCount: games.achievementsCount,
  websiteUrl: games.websiteUrl,
  supportEmail: games.supportEmail,
};

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
    
    const gamesList = await db.select(gameColumns)
      .from(games)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    if (gamesList.length === 0) {
      return NextResponse.json({ games: [], total: 0 });
    }

    const gameIds = gamesList.map(g => g.id);
    
    const gameTags = await db.select({
      gameId: gamesToTags.gameId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(gamesToTags)
    .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
    .where(inArray(gamesToTags.gameId, gameIds));

    const tagsByGame = gameTags.reduce((acc, { gameId, tagId, tagName }) => {
      if (!acc[gameId]) acc[gameId] = [];
      acc[gameId].push({ id: tagId, name: tagName });
      return acc;
    }, {} as Record<string, { id: number; name: string }[]>);

    const formattedData = gamesList.map(game => ({
      ...game,
      tags: tagsByGame[game.id] || []
    }));

    const totalResult = await db.select({ value: count() })
      .from(games)
      .where(and(...conditions));
    
    const total = totalResult[0]?.value || 0;

    return NextResponse.json({
      games: formattedData,
      total: total
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching games' }, { status: 500 });
  }
}