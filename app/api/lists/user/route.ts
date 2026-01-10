import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listRatings, savedLists, listItems } from '@/lib/schema';
import { desc, eq, and, not, like, count, inArray } from 'drizzle-orm';
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

    if (userLists.length === 0) {
      return NextResponse.json([]);
    }

    const listIds = userLists.map(l => l.id);

    const counts = await db.select({
      listId: listItems.listId,
      count: count()
    })
    .from(listItems)
    .where(inArray(listItems.listId, listIds))
    .groupBy(listItems.listId);
    
    const countMap = Object.fromEntries(counts.map(c => [c.listId, c.count]));

    let savedMap: Record<string, boolean> = {};
    let ratingMap: Record<string, number> = {};

    if (user) {
      try {
        const saved = await db.select({ listId: savedLists.listId })
          .from(savedLists)
          .where(and(
            eq(savedLists.userId, user.id),
            inArray(savedLists.listId, listIds)
          ));
        savedMap = Object.fromEntries(saved.map(s => [s.listId, true]));

        const ratings = await db.select({ 
            listId: listRatings.listId, 
            rating: listRatings.rating 
          })
          .from(listRatings)
          .where(and(
            eq(listRatings.userId, user.id),
            inArray(listRatings.listId, listIds)
          ));
        ratingMap = Object.fromEntries(ratings.map(r => [r.listId, r.rating]));
      } catch (err) {
        console.error("Error fetching user relation data:", err);
      }
    }

    const formattedLists = userLists.map((list) => {
        const isOwner = user ? list.creator.id === user.id : false;

        return {
            id: list.id,
            title: list.title,
            description: list.description,
            creator: list.creator.username,
            averageRating: list.averageRating,
            gameCount: countMap[list.id] || 0,
            type: 'user' as const,
            isSaved: !!savedMap[list.id],
            userRating: ratingMap[list.id] || 0,
            isOwner,
            games: list.items.map(item => ({
                id: item.game.id,
                slug: item.game.slug,
                title: item.game.title,
                image: `/api/games/${item.game.slug}/image/header`
            }))
        };
    });

    return NextResponse.json(formattedLists);
  } catch (error) {
    console.error("Critical Error fetching user lists:", error);
    return NextResponse.json({ error: 'Failed to fetch user lists' }, { status: 500 });
  }
}