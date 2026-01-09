import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, savedLists, games } from '@/lib/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gameIdToCheck = searchParams.get('gameId');

  try {
    const userLists = await db.select({
      id: lists.id,
      title: lists.title,
      description: lists.description,
      averageRating: lists.averageRating,
      createdAt: lists.createdAt,
    })
    .from(lists)
    .where(eq(lists.userId, user.id))
    .orderBy(desc(lists.createdAt));

    const listsWithStats = await Promise.all(userLists.map(async (list) => {
      const gameCountRes = await db.select({ value: count() })
        .from(listItems)
        .where(eq(listItems.listId, list.id));
      
      const saveCountRes = await db.select({ value: count() })
        .from(savedLists)
        .where(eq(savedLists.listId, list.id));

      const previewGames = await db.select({
        slug: games.slug,
      })
      .from(listItems)
      .innerJoin(games, eq(listItems.gameId, games.id))
      .where(eq(listItems.listId, list.id))
      .limit(4)
      .orderBy(listItems.order);

      let hasGame = false;
      if (gameIdToCheck) {
        const entry = await db.select().from(listItems)
          .where(and(eq(listItems.listId, list.id), eq(listItems.gameId, gameIdToCheck)))
          .get();
        hasGame = !!entry;
      }

      return {
        ...list,
        gameCount: gameCountRes[0]?.value || 0,
        saveCount: saveCountRes[0]?.value || 0,
        previewImages: previewGames.map(g => `/api/games/${g.slug}/image/header`),
        hasGame
      };
    }));

    return NextResponse.json(listsWithStats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, gameId } = await req.json();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const newList = await db.insert(lists).values({
      userId: user.id,
      title,
      description,
      isPublic: true 
    }).returning().get();

    if (gameId) {
        await db.insert(listItems).values({
            listId: newList.id,
            gameId,
            order: 0
        });
    }

    return NextResponse.json(newList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}