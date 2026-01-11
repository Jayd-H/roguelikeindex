import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { games, reviews, tags, gamesToTags, pricePoints, externalRatings, gameImages } from '@/lib/schema';

export const revalidate = 3600;

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = params.slug;

  const game = await db.select({
    id: games.id,
    slug: games.slug,
    title: games.title,
    description: games.description,
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
  })
  .from(games)
  .where(eq(games.slug, slug))
  .get();

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const [
    dbTags,
    dbPricing,
    dbExternalRatings,
    dbReviews,
    dbGallery
  ] = await Promise.all([
    db.select({
      id: tags.id,
      name: tags.name
    })
    .from(gamesToTags)
    .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
    .where(eq(gamesToTags.gameId, game.id)),

    db.select().from(pricePoints).where(eq(pricePoints.gameId, game.id)),

    db.select().from(externalRatings).where(eq(externalRatings.gameId, game.id)),

    db.select({
      id: reviews.id,
      user: reviews.user,
      userId: reviews.userId,
      rating: reviews.rating,
      comment: reviews.comment,
      date: reviews.date,
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
    }).from(reviews)
      .where(eq(reviews.gameId, game.id))
      .orderBy(desc(reviews.date))
      .limit(20),

    db.select().from(gameImages).where(eq(gameImages.gameId, game.id)),
  ]);

  type PricingAccumulator = {
    [key: string]: {
      platform: string;
      stores: { store: string; price: string; url: string }[];
    };
  };

  const formattedPricing = Object.values(
    dbPricing.reduce<PricingAccumulator>((acc, curr) => {
      if (!acc[curr.platform]) {
        acc[curr.platform] = { platform: curr.platform, stores: [] };
      }
      acc[curr.platform].stores.push({ 
        store: curr.store, 
        price: curr.price, 
        url: curr.url 
      });
      return acc;
    }, {})
  );

  const formattedGame = {
    ...game,
    tags: dbTags,
    similarGames: [],
    pricing: formattedPricing,
    externalRatings: dbExternalRatings,
    reviews: dbReviews,
    gallery: dbGallery,
  };

  return NextResponse.json(formattedGame);
}