import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, users, savedLists, listRatings, games, gamesToTags, tags } from '@/lib/schema';
import { eq, and, inArray, gte, or, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  
  // Decode the slug to handle any URL encoding
  const slug = decodeURIComponent(params.slug);

  const parts = slug.split('-');
  const username = parts[0];
  const listNameSlug = parts.slice(1).join('-');

  const user = await getCurrentUser();

  try {
    let creator;

    // Special handling for the system user to ensure robust lookup
    if (username.toLowerCase() === 'roguelikeindex') {
      creator = await db.select().from(users).where(eq(users.id, 'system-auto-list-creator')).get();
    } else {
      creator = await db.select()
        .from(users)
        .where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
        .get();
    }

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const allLists = await db.query.lists.findMany({
      where: eq(lists.userId, creator.id),
      with: {
        creator: {
          columns: {
            id: true,
            username: true
          }
        }
      }
    });

    const list = allLists.find(l => {
      const titleSlug = l.title.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
      return titleSlug === listNameSlug;
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const search = searchParams.get('search');
    const tagNames = searchParams.get('tags');
    const combat = searchParams.get('combat');
    const narrative = searchParams.get('narrative');
    const rating = searchParams.get('rating');
    const complexity = searchParams.get('complexity');
    const meta = searchParams.get('meta');
    const deck = searchParams.get('deck');

    const gameIds = await db.select({ gameId: listItems.gameId })
      .from(listItems)
      .where(eq(listItems.listId, list.id))
      .all();

    const filteredGameIds = gameIds.map((g: { gameId: string }) => g.gameId);

    if (filteredGameIds.length === 0) {
      const isSaved = user ? !!(await db.select().from(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, list.id))).get()) : false;
      const userRating = user ? (await db.select().from(listRatings).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, list.id))).get())?.rating || 0 : 0;

      return NextResponse.json({
        list: {
          id: list.id,
          title: list.title,
          description: list.description,
          creator: list.creator.username,
          averageRating: list.averageRating || 0,
          isSaved,
          userRating,
          isOwner: user?.id === list.userId
        },
        games: [],
        total: 0
      });
    }

    const conditions = [inArray(games.id, filteredGameIds)];

    if (search) {
      conditions.push(
        or(
          eq(games.title, `%${search}%`),
          eq(games.description, `%${search}%`)
        )!
      );
    }
    
    if (tagNames) {
      const selectedTags = tagNames.split(',');
      const matchingGames = await db.selectDistinct({ gameId: gamesToTags.gameId })
        .from(gamesToTags)
        .leftJoin(tags, eq(gamesToTags.tagId, tags.id))
        .where(inArray(tags.name, selectedTags));
      
      const tagGameIds = matchingGames.map((g: { gameId: string }) => g.gameId);
      if (tagGameIds.length > 0) {
        conditions.push(inArray(games.id, tagGameIds));
      } else {
        const isSaved = user ? !!(await db.select().from(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, list.id))).get()) : false;
        const userRating = user ? (await db.select().from(listRatings).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, list.id))).get())?.rating || 0 : 0;

        return NextResponse.json({
          list: {
            id: list.id,
            title: list.title,
            description: list.description,
            creator: list.creator.username,
            averageRating: list.averageRating || 0,
            isSaved,
            userRating,
            isOwner: user?.id === list.userId
          },
          games: [],
          total: 0
        });
      }
    }
    if (combat) conditions.push(inArray(games.combatType, combat.split(',')));
    if (narrative) conditions.push(inArray(games.narrativePresence, narrative.split(',')));
    if (rating) conditions.push(gte(games.rating, parseFloat(rating)));
    if (complexity) conditions.push(gte(games.complexity, parseFloat(complexity)));
    if (meta === 'true') conditions.push(eq(games.metaProgression, true));
    if (deck === 'true') conditions.push(eq(games.steamDeckVerified, true));

    const data = await db.query.games.findMany({
      where: and(...conditions),
      with: {
        tags: {
          with: {
            tag: true
          }
        }
      }
    });

    const formattedData = data.map((game) => ({
      ...game,
      tags: game.tags.map((t) => t.tag)
    }));

    const isSaved = user ? !!(await db.select().from(savedLists).where(and(eq(savedLists.userId, user.id), eq(savedLists.listId, list.id))).get()) : false;
    const userRating = user ? (await db.select().from(listRatings).where(and(eq(listRatings.userId, user.id), eq(listRatings.listId, list.id))).get())?.rating || 0 : 0;

    return NextResponse.json({
      list: {
        id: list.id,
        title: list.title,
        description: list.description,
        creator: list.creator.username,
        averageRating: list.averageRating || 0,
        isSaved,
        userRating,
        isOwner: user?.id === list.userId
      },
      games: formattedData,
      total: formattedData.length
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching list' }, { status: 500 });
  }
}