import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, favorites, ownedGames, lists, savedLists, reviews, listItems } from '@/lib/schema';
import { eq, desc, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { UserProfile, Game, List, Review } from '@/lib/types';

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
};

interface RawListItem {
  game: {
    id: string;
    slug: string;
    title: string;
  };
}

interface RawList {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  averageRating: number | null;
  createdAt: string;
  creator: {
    username: string;
  };
  items: RawListItem[];
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userInfo = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true
      }
    });

    const favoritesData = await db.query.favorites.findMany({
      where: eq(favorites.userId, user.id),
      with: {
        game: {
          columns: gameColumns,
          with: {
            tags: { with: { tag: true } }
          }
        }
      }
    });

    const ownedData = await db.query.ownedGames.findMany({
      where: eq(ownedGames.userId, user.id),
      with: {
        game: {
            columns: gameColumns,
            with: {
                tags: { with: { tag: true } }
            }
        }
      }
    });

    const createdLists = await db.query.lists.findMany({
      where: eq(lists.userId, user.id),
      orderBy: desc(lists.createdAt),
      with: {
        creator: true,
        items: {
          orderBy: (listItems, { asc }) => [asc(listItems.order)],
          limit: 4,
          with: {
            game: {
                columns: {
                    id: true,
                    slug: true,
                    title: true
                }
            }
          }
        }
      }
    });

    const reviewsData = await db.query.reviews.findMany({
      where: eq(reviews.userId, user.id),
      orderBy: desc(reviews.date),
      with: {
        game: {
          columns: {
            title: true,
            slug: true
          }
        }
      }
    });

    const formatList = async (listObj: RawList, isSavedItem = false): Promise<List> => {
        const totalCount = await db.select({ value: count() })
          .from(listItems)
          .where(eq(listItems.listId, listObj.id))
          .get();
        
        return {
            id: listObj.id,
            title: listObj.title,
            description: listObj.description,
            type: 'user',
            creator: listObj.creator.username,
            averageRating: listObj.averageRating,
            gameCount: totalCount?.value || 0,
            isSaved: isSavedItem, 
            userRating: 0, 
            isOwner: !isSavedItem,
            games: listObj.items.map((item) => ({
                id: item.game.id,
                slug: item.game.slug,
                title: item.game.title,
                image: `/api/games/${item.game.slug}/image/header`
            }))
        };
    };

    const formattedCreatedLists = await Promise.all(createdLists.map((l) => formatList(l as unknown as RawList)));

    return NextResponse.json({
      user: userInfo as UserProfile,
      favorites: favoritesData.map((f) => ({ ...f.game, tags: f.game.tags.map((t) => t.tag) })) as Game[],
      owned: ownedData.map((o) => ({ ...o.game, tags: o.game.tags.map((t) => t.tag) })) as Game[],
      createdLists: formattedCreatedLists,
      reviews: reviewsData as Review[]
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}