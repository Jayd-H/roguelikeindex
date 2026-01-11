import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamesToTags, tags, gameBlobs } from '@/lib/schema';
import { and, eq, gte, inArray, like, desc, asc, count } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getCurrentUser } from '@/lib/get-user';
import { containsProfanity } from '@/lib/profanity';

export const revalidate = 60;

const getCachedTotal = unstable_cache(
  async () => {
    const res = await db.select({ value: count() }).from(games);
    return res[0]?.value || 0;
  },
  ['total-games-count'],
  { revalidate: 3600 }
);

async function processImage(entry: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!entry) return null;

  try {
    if (typeof entry === 'object' && 'arrayBuffer' in entry) {
      const arrayBuffer = await entry.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    if (typeof entry === 'string' && entry.startsWith('http')) {
      const res = await fetch(entry);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (e) {
    console.error("Image processing error:", e);
  }
  return null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (containsProfanity(title) || containsProfanity(description)) {
      return NextResponse.json({ error: 'Inappropriate content' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    const existing = await db.select().from(games).where(eq(games.slug, slug)).get();
    
    if (existing) {
      return NextResponse.json({ error: 'Game with this title already exists' }, { status: 400 });
    }

    const newGame = await db.insert(games).values({
      slug,
      title,
      description,
      steamAppId: (formData.get("steamAppId") as string) || null,
      releaseDate: (formData.get("releaseDate") as string) || null,
      developer: (formData.get("developer") as string) || null,
      publisher: (formData.get("publisher") as string) || null,
      
      status: 'pending',
      submitterId: user.id,
      
      subgenre: 'Unknown',
      narrativePresence: 'Unknown',
      combatType: 'Unknown',
      avgRunLength: 'Unknown',
      timeToFirstWin: 'Unknown',
      timeTo100: 'Unknown',
      
      // Default numeric stats to null (Unknown)
      difficulty: null,
      rngReliance: null,
      userFriendliness: null,
      complexity: null,
      synergyDepth: null,
      replayability: null,
      
      metaProgression: false,
      steamDeckVerified: false,
      rating: 0
    }).returning().get();

    const imageTypes = ['header', 'hero', 'logo'];
    await Promise.all(imageTypes.map(async (type) => {
      const buffer = await processImage(formData.get(type));
      if (buffer) {
        await db.insert(gameBlobs).values({
          gameId: newGame.id,
          type,
          data: buffer
        });
      }
    }));

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

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
      const subQuery = db.select({ gameId: gamesToTags.gameId })
        .from(gamesToTags)
        .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
        .where(inArray(tags.name, selectedTags));
        
      conditions.push(inArray(games.id, subQuery));
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
      status: games.status, 
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