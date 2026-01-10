import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, games, gamesToTags, tags } from '@/lib/schema';
import { eq, and, inArray, gte, desc, count, avg, isNotNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getGlobalTopPool = unstable_cache(
  async () => {
    return await db.select({ 
      id: games.id 
    })
    .from(games)
    .orderBy(desc(games.rating))
    .limit(50);
  },
  ['global-top-50-pool'],
  { revalidate: 3600 } 
);

const getCachedRecommendations = unstable_cache(
  async (userId: string) => {
    const userReviews = await db.select({
      gameId: reviews.gameId,
      rating: reviews.rating,
      date: reviews.date
    })
    .from(reviews)
    .where(eq(reviews.userId, userId));

    const reviewCount = userReviews.length;
    if (reviewCount < 3) {
      return { status: 'insufficient_data', count: reviewCount, data: [] };
    }

    const reviewedGameIds = new Set(userReviews.map(r => r.gameId));

    const targetGameIds = userReviews
      .filter(r => r.rating >= 4)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(r => r.gameId);
      
    const searchIds = targetGameIds.length > 0 ? targetGameIds : Array.from(reviewedGameIds).slice(0, 5);

    const similarUsersList = await db.selectDistinct({ userId: reviews.userId })
      .from(reviews)
      .where(and(
        inArray(reviews.gameId, searchIds),
        gte(reviews.rating, 4),
        isNotNull(reviews.userId)
      ))
      .limit(5);

    const similarUserIds = similarUsersList
      .map(u => u.userId)
      .filter((id): id is string => id !== null && id !== userId);

    let candidates: { gameId: string; confidence: number }[] = [];

    if (similarUserIds.length > 0) {
        const candidateStats = await db.select({
          gameId: reviews.gameId,
          avgRating: avg(reviews.rating),
          count: count()
        })
        .from(reviews)
        .where(and(
          inArray(reviews.userId, similarUserIds),
          gte(reviews.rating, 4)
        ))
        .groupBy(reviews.gameId)
        .orderBy(desc(count()), desc(avg(reviews.rating)))
        .limit(10); 

        const filteredStats = candidateStats
            .filter(c => !reviewedGameIds.has(c.gameId))
            .slice(0, 5);

        if (filteredStats.length > 0) {
            const maxCount = Math.max(...filteredStats.map(c => c.count), 1);
            
            candidates = filteredStats.map(stat => ({
                gameId: stat.gameId,
                confidence: Math.round((((stat.count / maxCount) * 0.7) + ((Number(stat.avgRating) / 5) * 0.3)) * 100)
            }));
        }
    }

    if (candidates.length < 5) {
        const globalPool = await getGlobalTopPool();
        const needed = 5 - candidates.length;
        
        const existingCandidateIds = new Set(candidates.map(c => c.gameId));
        
        const fillers = globalPool
            .filter(g => !reviewedGameIds.has(g.id) && !existingCandidateIds.has(g.id))
            .slice(0, needed);
            
        candidates.push(...fillers.map(g => ({ gameId: g.id, confidence: 85 })));
    }

    const finalGameIds = candidates.map(c => c.gameId);
    
    if (finalGameIds.length === 0) return { status: 'success', data: [] };

    const gamesData = await db.select({
        id: games.id,
        slug: games.slug,
        title: games.title,
        description: games.description,
        rating: games.rating,
        avgRunLength: games.avgRunLength,
        difficulty: games.difficulty,
        combatType: games.combatType,
        narrativePresence: games.narrativePresence,
        steamAppId: games.steamAppId,
        steamDeckVerified: games.steamDeckVerified
    })
    .from(games)
    .where(inArray(games.id, finalGameIds));

    const tagsData = await db.select({
        gameId: gamesToTags.gameId,
        name: tags.name,
        id: tags.id
    })
    .from(gamesToTags)
    .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
    .where(inArray(gamesToTags.gameId, finalGameIds));

    const tagsMap: Record<string, { id: number; name: string }[]> = {};
    tagsData.forEach(t => {
        if (!tagsMap[t.gameId]) tagsMap[t.gameId] = [];
        if (tagsMap[t.gameId].length < 3) {
            tagsMap[t.gameId].push({ id: t.id, name: t.name });
        }
    });

    const formatted = gamesData.map(game => {
        const match = candidates.find(c => c.gameId === game.id);
        return {
            ...game,
            tags: tagsMap[game.id] || [],
            confidenceScore: match?.confidence || 0,
            pricing: [],
            externalRatings: [],
            reviews: [],
            similarGames: []
        };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);

    return { status: 'success', data: formatted };
  },
  ['recommendations-user-v2'],
  { revalidate: 600 } 
);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await getCachedRecommendations(user.id);

    if (result.status === 'insufficient_data') {
        return NextResponse.json({ status: 'insufficient_data', count: result.count });
    }

    return NextResponse.json({ recommendations: result.data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}