import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamesToTags, tags } from '@/lib/schema';
import { and, eq, gte, inArray, like, desc, asc, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const gameColumns = {
  id: true,
  slug: true,
  title: true,
  description: true,
  subgenre: true,
  combatType: true,
  narrativePresence: true,
  avgRunLength: true,
  timeToFirstWin: true,
  timeTo100: true,
  difficulty: true,
  rngReliance: true,
  userFriendliness: true,
  complexity: true,
  synergyDepth: true,
  replayability: true,
  metaProgression: true,
  steamDeckVerified: true,
  rating: true,
  releaseDate: true,
  developer: true,
  publisher: true,
  steamAppId: true,
  achievementsCount: true,
  websiteUrl: true,
  supportEmail: true,
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

    const data = await db.query.games.findMany({
      where: and(...conditions),
      limit: limit,
      offset: (page - 1) * limit,
      columns: gameColumns,
      with: {
        tags: {
          with: {
            tag: true
          }
        }
      },
      orderBy: orderBy
    });

    const formattedData = data.map(game => ({
      ...game,
      tags: game.tags.map(t => t.tag)
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