import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, favorites, ownedGames, lists, reviews, listItems, games, gamesToTags, tags } from '@/lib/schema';
import { eq, desc, count, inArray } from 'drizzle-orm';
import type { UserProfile, Game } from '@/lib/types';

export const revalidate = 60;

export async function GET(
  request: Request,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const username = params.username.toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  try {
    const userInfo = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true
      },
      with: {
        roles: {
          with: {
            role: {
              columns: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [favoritesData, ownedData, createdLists, reviewsData] = await Promise.all([
      db.select({
        gameId: favorites.gameId
      })
      .from(favorites)
      .where(eq(favorites.userId, userInfo.id)),
      
      db.select({
        gameId: ownedGames.gameId
      })
      .from(ownedGames)
      .where(eq(ownedGames.userId, userInfo.id)),
      
      db.select({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        isPublic: lists.isPublic,
        averageRating: lists.averageRating,
        createdAt: lists.createdAt,
      })
      .from(lists)
      .where(eq(lists.userId, userInfo.id))
      .orderBy(desc(lists.createdAt)),
      
      db.select({
        id: reviews.id,
        user: reviews.user,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        date: reviews.date,
        gameId: reviews.gameId,
        difficulty: reviews.difficulty,
        replayability: reviews.replayability,
        synergyDepth: reviews.synergyDepth,
        complexity: reviews.complexity,
        rngReliance: reviews.rngReliance,
        userFriendliness: reviews.userFriendliness,
        avgRunLength: reviews.avgRunLength,
        timeToFirstWin: reviews.timeToFirstWin,
        timeTo100: reviews.timeTo100,
        combatType: reviews.combatType,
        narrativePresence: reviews.narrativePresence,
        gameTitle: games.title,
        gameSlug: games.slug,
      })
      .from(reviews)
      .innerJoin(games, eq(reviews.gameId, games.id))
      .where(eq(reviews.userId, userInfo.id))
      .orderBy(desc(reviews.date))
    ]);

    const allGameIds = [
      ...favoritesData.map(f => f.gameId),
      ...ownedData.map(o => o.gameId)
    ];

    const gamesData = allGameIds.length > 0 ? await db.select({
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
    })
    .from(games)
    .where(inArray(games.id, allGameIds)) : [];

    const gameTags = allGameIds.length > 0 ? await db.select({
      gameId: gamesToTags.gameId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(gamesToTags)
    .innerJoin(tags, eq(gamesToTags.tagId, tags.id))
    .where(inArray(gamesToTags.gameId, allGameIds)) : [];

    const tagsByGame: Record<string, { id: number; name: string }[]> = {};
    gameTags.forEach(({ gameId, tagId, tagName }) => {
      if (!tagsByGame[gameId]) tagsByGame[gameId] = [];
      tagsByGame[gameId].push({ id: tagId, name: tagName });
    });

    // Add a lightweight type for this route (we don't fetch pricing/externalRatings/etc here)
    type ProfileGame = Omit<Game, 'pricing' | 'externalRatings' | 'reviews' | 'similarGames'>;

    const gamesMap: Record<string, ProfileGame> = {};
    gamesData.forEach(game => {
      gamesMap[game.id] = { ...game, tags: tagsByGame[game.id] || [] };
    });

    const listItemCounts = createdLists.length > 0 ? await db.select({
      listId: listItems.listId,
      count: count()
    })
    .from(listItems)
    .where(inArray(listItems.listId, createdLists.map(l => l.id)))
    .groupBy(listItems.listId) : [];

    const listItemsByList = createdLists.length > 0 ? await db.select({
      listId: listItems.listId,
      gameId: listItems.gameId,
      gameSlug: games.slug,
      gameTitle: games.title,
      order: listItems.order,
    })
    .from(listItems)
    .innerJoin(games, eq(listItems.gameId, games.id))
    .where(inArray(listItems.listId, createdLists.map(l => l.id)))
    .orderBy(listItems.order)
    .limit(4 * createdLists.length) : [];

    const itemsByListId: Record<string, { id: string; slug: string; title: string; image: string }[]> = {};
    listItemsByList.forEach(item => {
      if (!itemsByListId[item.listId]) itemsByListId[item.listId] = [];
      if (itemsByListId[item.listId].length < 4) {
        itemsByListId[item.listId].push({
          id: item.gameId,
          slug: item.gameSlug,
          title: item.gameTitle,
          image: `/api/games/${item.gameSlug}/image/header`
        });
      }
    });

    const countsMap: Record<string, number> = {};
    listItemCounts.forEach(({ listId, count: itemCount }) => {
      countsMap[listId] = itemCount;
    });

    const formattedCreatedLists = createdLists.map(list => ({
      id: list.id,
      title: list.title,
      description: list.description,
      type: 'user' as const,
      creator: userInfo.username,
      averageRating: list.averageRating,
      gameCount: countsMap[list.id] || 0,
      isSaved: false,
      userRating: 0,
      isOwner: false,
      games: itemsByListId[list.id] || []
    }));

    const publicUser: UserProfile = {
        id: userInfo.id,
        username: userInfo.username,
        email: "",
        bio: userInfo.bio,
        createdAt: userInfo.createdAt || new Date().toISOString(),
        roles: userInfo.roles.map(r => r.role.name)
    };

    return NextResponse.json({
      user: publicUser,
      favorites: favoritesData.map(f => gamesMap[f.gameId]).filter(Boolean),
      owned: ownedData.map(o => gamesMap[o.gameId]).filter(Boolean),
      createdLists: formattedCreatedLists,
      reviews: reviewsData.map(r => ({
        ...r,
        game: { title: r.gameTitle, slug: r.gameSlug }
      }))
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch public profile' }, { status: 500 });
  }
}