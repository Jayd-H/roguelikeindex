import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, favorites, ownedGames, lists, reviews, listItems } from '@/lib/schema';
import { eq, desc, count } from 'drizzle-orm';
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

export async function GET(
  request: Request,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const username = params.username;

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
      }
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const favoritesData = await db.query.favorites.findMany({
      where: eq(favorites.userId, userInfo.id),
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
      where: eq(ownedGames.userId, userInfo.id),
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
      where: eq(lists.userId, userInfo.id),
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
      where: eq(reviews.userId, userInfo.id),
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

    const formatList = async (listObj: RawList): Promise<List> => {
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
            isSaved: false, 
            userRating: 0, 
            isOwner: false,
            games: listObj.items.map((item) => ({
                id: item.game.id,
                slug: item.game.slug,
                title: item.game.title,
                image: `/api/games/${item.game.slug}/image/header`
            }))
        };
    };

    const formattedCreatedLists = await Promise.all(createdLists.map((l) => formatList(l as unknown as RawList)));

    const publicUser: UserProfile = {
        id: userInfo.id,
        username: userInfo.username,
        email: "", 
        bio: userInfo.bio,
        createdAt: userInfo.createdAt || new Date().toISOString()
    };

    return NextResponse.json({
      user: publicUser,
      favorites: favoritesData.map((f) => ({ ...f.game, tags: f.game.tags.map((t) => t.tag) })) as Game[],
      owned: ownedData.map((o) => ({ ...o.game, tags: o.game.tags.map((t) => t.tag) })) as Game[],
      createdLists: formattedCreatedLists,
      reviews: reviewsData as Review[]
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch public profile' }, { status: 500 });
  }
}