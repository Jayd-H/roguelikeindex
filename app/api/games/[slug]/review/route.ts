import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, reviews } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

const parseTime = (val: string | null): number | null => {
  if (!val) return null;
  const match = val.toLowerCase().match(/^(\d+)(h|m)$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  return match[2] === 'h' ? num * 60 : num;
};

const formatTime = (minutes: number): string => {
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes)}m`;
};

const getMode = (arr: string[]): string | null => {
  if (arr.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const item of arr) {
    if (item) counts[item] = (counts[item] || 0) + 1;
  }
  let best = null;
  let max = 0;
  for (const [key, val] of Object.entries(counts)) {
    if (val > max) {
      max = val;
      best = key;
    }
  }
  return best;
};

async function updateGameStats(gameId: string) {
  const allReviews = await db.select({
    rating: reviews.rating,
    difficulty: reviews.difficulty,
    replayability: reviews.replayability,
    synergyDepth: reviews.synergyDepth,
    complexity: reviews.complexity,
    rngReliance: reviews.rngReliance,
    userFriendliness: reviews.userFriendliness,
    avgRunLength: reviews.avgRunLength,
    timeToFirstWin: reviews.timeToFirstWin,
    timeTo100: reviews.timeTo100,
    narrativePresence: reviews.narrativePresence,
    combatType: reviews.combatType,
  }).from(reviews).where(eq(reviews.gameId, gameId));

  const avg = (field: keyof typeof allReviews[0], asFloat = false): number | null => {
    const valid = allReviews.filter(r => r[field] !== null && typeof r[field] === 'number');
    if (valid.length === 0) return null;
    const sum = valid.reduce((a, b) => a + (b[field] as number), 0);
    const value = sum / valid.length;
    return asFloat ? parseFloat(value.toFixed(1)) : Math.round(value);
  };

  const avgTime = (field: 'avgRunLength' | 'timeToFirstWin' | 'timeTo100') => {
    const valid = allReviews.map(r => parseTime(r[field])).filter(v => v !== null) as number[];
    if (valid.length === 0) return null;
    const sum = valid.reduce((a, b) => a + b, 0);
    return formatTime(sum / valid.length);
  };

  const mode = (field: 'narrativePresence' | 'combatType') => {
    const values = allReviews.map(r => r[field]).filter(v => v !== null) as string[];
    return getMode(values);
  };

  const newStats = {
    rating: avg('rating', true) ?? 0,
    difficulty: avg('difficulty') ?? 0,
    replayability: avg('replayability') ?? 0,
    synergyDepth: avg('synergyDepth') ?? 0,
    complexity: avg('complexity') ?? 0,
    rngReliance: avg('rngReliance') ?? 0,
    userFriendliness: avg('userFriendliness') ?? 0,
    avgRunLength: avgTime('avgRunLength') ?? undefined,
    timeToFirstWin: avgTime('timeToFirstWin') ?? undefined,
    timeTo100: avgTime('timeTo100') ?? undefined,
    narrativePresence: mode('narrativePresence') ?? undefined,
    combatType: mode('combatType') ?? undefined,
  };

  await db.update(games).set(newStats).where(eq(games.id, gameId));
}

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await request.json();
  const {
    rating, comment, difficulty, replayability, synergyDepth, complexity,
    rngReliance, userFriendliness, avgRunLength, timeToFirstWin, timeTo100,
    narrativePresence, combatType
  } = json;

  const game = await db.select({ id: games.id }).from(games).where(eq(games.slug, params.slug)).get();
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const existing = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, user.id), eq(reviews.gameId, game.id))).get();

  const reviewData = {
    user: user.name || user.email.split('@')[0],
    userId: user.id,
    gameId: game.id,
    date: new Date().toISOString(),
    rating: rating || 0,
    comment: comment || "",
    
    difficulty: difficulty ?? null,
    replayability: replayability ?? null,
    synergyDepth: synergyDepth ?? null,
    complexity: complexity ?? null,
    rngReliance: rngReliance ?? null,
    userFriendliness: userFriendliness ?? null,
    
    avgRunLength: avgRunLength || null,
    timeToFirstWin: timeToFirstWin || null,
    timeTo100: timeTo100 || null, 
    narrativePresence: narrativePresence || null,
    combatType: combatType || null,
  };

  let result;
  if (existing) {
    result = await db.update(reviews).set(reviewData).where(eq(reviews.id, existing.id)).returning().get();
  } else {
    result = await db.insert(reviews).values(reviewData).returning().get();
  }

  await updateGameStats(game.id);

  return NextResponse.json({ review: result });
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const game = await db.select({ id: games.id }).from(games).where(eq(games.slug, params.slug)).get();
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  await db.delete(reviews).where(and(eq(reviews.userId, user.id), eq(reviews.gameId, game.id)));

  await updateGameStats(game.id);

  return NextResponse.json({ success: true });
}