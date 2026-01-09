import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listRatings, savedLists, listItems } from '@/lib/schema';
import { desc, eq, and, not, like, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const offset = (page - 1) * limit;

    const user = await getCurrentUser();
    
    const userLists = await db.query.lists.findMany({
      where: and(
        eq(lists.isPublic, true),
        not(like(lists.id, 'auto-%'))
      ),
      orderBy: desc(lists.createdAt),
      limit: limit,
      offset: offset,
      with: {
        creator: {
          columns: {
            id: true,
            username: true
          }
        },
        items: {
          limit: 10,
          orderBy: (listItems, { asc }) => [asc(listItems.order)],
          with: {
            game: {
              columns: {
                id: true,
                slug: true,
                title: true,
              }
            }
          }
        }
      }
    });

    const formattedLists = await Promise.all(userLists.map(async (list) => {
        let isSaved = false;
        let userRating = 0;
        const isOwner = user ? list.creator.id === user.id : false;

        const totalCount = await db.select({ value: count() })
          .from(listItems)
          .where(eq(listItems.listId, list.id))
          .get();

        if (user) {
            try {
                const saved = await db.select().from(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, list.id))).get();
                isSaved = !!saved;

                const rating = await db.select().from(listRatings).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, list.id))).get();
                userRating = rating ? rating.rating : 0;
            } catch (err) {
                console.error("Error fetching user relation data:", err);
            }
        }

        return {
            id: list.id,
            title: list.title,
            description: list.description,
            creator: list.creator.username,
            averageRating: list.averageRating,
            gameCount: totalCount?.value || 0,
            type: 'user' as const,
            isSaved,
            userRating,
            isOwner,
            games: list.items.map(item => ({
                id: item.game.id,
                slug: item.game.slug,
                title: item.game.title,
                image: `/api/games/${item.game.slug}/image/header`
            }))
        };
    }));

    return NextResponse.json(formattedLists);
  } catch (error) {
    console.error("Critical Error fetching user lists:", error);
    return NextResponse.json({ error: 'Failed to fetch user lists' }, { status: 500 });
  }
}