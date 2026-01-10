import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, favorites, ownedGames, lists, reviews, listItems, games } from '@/lib/schema';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { UserProfile, Game } from '@/lib/types';

export const revalidate = 60;

export async function GET(
  request: Request,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const username = params.username.toLowerCase();
  const currentUser = await getCurrentUser();

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  try {
    const targetUser = await db.query.users.findFirst({
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

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = currentUser?.id === targetUser.id;

    // Parallel fetch of all related data using optimized indexes
    const [favoritesData, ownedData, createdLists, reviewsData] = await Promise.all([
      db.select({ gameId: favorites.gameId }).from(favorites).where(eq(favorites.userId, targetUser.id)),
      db.select({ gameId: ownedGames.gameId }).from(ownedGames).where(eq(ownedGames.userId, targetUser.id)),
      
      db.select({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        isPublic: lists.isPublic,
        averageRating: lists.averageRating,
        createdAt: lists.createdAt,
      })
      .from(lists)
      .where(eq(lists.userId, targetUser.id))
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
      .where(eq(reviews.userId, targetUser.id))
      .orderBy(desc(reviews.date))
    ]);

    const allGameIds = [
      ...favoritesData.map(f => f.gameId),
      ...ownedData.map(o => o.gameId)
    ];

    // OPTIMIZATION: Only fetch what MiniGameCard needs (id, slug, title, image)
    // No description, stats, or other heavy columns
    const gamesData = allGameIds.length > 0 ? await db.select({
      id: games.id,
      slug: games.slug,
      title: games.title,
      steamAppId: games.steamAppId,
    })
    .from(games)
    .where(inArray(games.id, allGameIds)) : [];

    const gamesMap: Record<string, Game> = {};
    gamesData.forEach(game => {
      // @ts-expect-error Partial game object sufficient for UI
      gamesMap[game.id] = { ...game, tags: [] };
    });

    // Efficiently fetch list item counts
    const listItemCounts = createdLists.length > 0 ? await db.select({
      listId: listItems.listId,
      count: count()
    })
    .from(listItems)
    .where(inArray(listItems.listId, createdLists.map(l => l.id)))
    .groupBy(listItems.listId) : [];

    // Efficiently fetch preview games for lists (limit 4 per list)
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
      creator: targetUser.username,
      averageRating: list.averageRating,
      gameCount: countsMap[list.id] || 0,
      isSaved: false,
      userRating: 0,
      isOwner: isOwner,
      games: itemsByListId[list.id] || []
    }));

    const userProfile: UserProfile = {
        id: targetUser.id,
        username: targetUser.username,
        email: isOwner ? targetUser.email : "", // Mask email if not owner
        bio: targetUser.bio,
        createdAt: targetUser.createdAt || new Date().toISOString(),
        roles: targetUser.roles.map(r => r.role.name)
    };

    return NextResponse.json({
      user: userProfile,
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
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}