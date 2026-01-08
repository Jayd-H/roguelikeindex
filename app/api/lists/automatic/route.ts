import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, tags, gamesToTags, externalRatings, lists, listItems, users, savedLists, listRatings } from '@/lib/schema';
import { desc, eq, and, gte, inArray, like, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export const revalidate = 3600;

interface PartialGame {
  id: string;
  slug: string;
  title: string;
  headerBlob: unknown;
  rating: number;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    // Ensure System User Exists
    const SYSTEM_USER_ID = 'system-auto-list-creator';
    const systemUser = await db.select().from(users).where(eq(users.id, SYSTEM_USER_ID)).get();
    if (!systemUser) {
        await db.insert(users).values({
            id: SYSTEM_USER_ID,
            email: 'system@roguelikeindex.com',
            username: 'RoguelikeIndex',
            password: 'system-password-placeholder' 
        }).onConflictDoNothing();
    }

    const fetchGamesByIds = async (ids: string[]) => {
      if (ids.length === 0) return [];
      return await db.query.games.findMany({
        where: inArray(games.id, ids),
        limit: 10,
        columns: { id: true, slug: true, title: true, headerBlob: true, rating: true }
      });
    };

    // --- Queries ---
    const topRated = await db.query.games.findMany({
      where: gte(games.rating, 4.0),
      orderBy: desc(games.rating),
      limit: 10,
      columns: { id: true, slug: true, title: true, headerBlob: true, rating: true }
    });

    const deckVerified = await db.query.games.findMany({
      where: eq(games.steamDeckVerified, true),
      orderBy: desc(games.rating),
      limit: 10,
      columns: { id: true, slug: true, title: true, headerBlob: true, rating: true }
    });

    // Subgenre based lists (More reliable than tags if tags are sparse)
    const deckbuilders = await db.query.games.findMany({
      where: eq(games.subgenre, 'Deckbuilder'),
      limit: 10,
      columns: { id: true, slug: true, title: true, headerBlob: true, rating: true }
    });

    const actionRoguelikes = await db.query.games.findMany({
        where: eq(games.subgenre, 'Action'),
        limit: 10,
        columns: { id: true, slug: true, title: true, headerBlob: true, rating: true }
    });

    // Ratings
    const ignRatings = await db.select({ gameId: externalRatings.gameId })
      .from(externalRatings)
      .where(and(like(externalRatings.source, '%IGN%'), gte(externalRatings.score, '8')))
      .limit(10);
    const ignGames = await fetchGamesByIds(ignRatings.map(r => r.gameId));

    const metaRatings = await db.select({ gameId: externalRatings.gameId })
      .from(externalRatings)
      .where(and(like(externalRatings.source, '%Metacritic%'), gte(externalRatings.score, '85')))
      .limit(10);
    const metaGames = await fetchGamesByIds(metaRatings.map(r => r.gameId));

    // Tags
    const getTagGames = async (tagName: string) => {
        const tag = await db.query.tags.findFirst({ where: eq(tags.name, tagName) });
        if (!tag) return [];
        const links = await db.select({ gameId: gamesToTags.gameId })
            .from(gamesToTags)
            .where(eq(gamesToTags.tagId, tag.id))
            .limit(10);
        return await fetchGamesByIds(links.map(l => l.gameId));
    };

    const strategyGames = await getTagGames('Strategy');
    const storyGames = await getTagGames('Story Rich');

    const definitions = [
      { id: 'auto-top', title: 'Hall of Fame', desc: 'The absolute best roguelikes as rated by the community.', games: topRated },
      { id: 'auto-deck', title: 'Perfect on Deck', desc: 'Verified gems for your portable sessions.', games: deckVerified },
      { id: 'auto-action', title: 'Action Packed', desc: 'Fast-paced combat and reflex-heavy challenges.', games: actionRoguelikes },
      { id: 'auto-deckbuilder', title: 'Master Deckbuilders', desc: 'Draft your way to victory with these card-based hits.', games: deckbuilders },
      { id: 'auto-ign', title: 'IGN Editor\'s Choice', desc: 'Critically acclaimed titles scoring 8+ on IGN.', games: ignGames },
      { id: 'auto-meta', title: 'Metacritic Must-Plays', desc: 'Games with a Metascore of 85 or higher.', games: metaGames },
      { id: 'auto-strat', title: 'Strategic Minds', desc: 'For those who prefer planning over reflexes.', games: strategyGames },
      { id: 'auto-story', title: 'Rich Narratives', desc: 'Roguelikes with compelling stories and lore.', games: storyGames },
    ].filter(d => d.games.length > 0);

    // --- Sync to DB & Fetch User State ---
    const finalLists = await Promise.all(definitions.map(async (def) => {
        // 1. Sync List to DB
        await db.insert(lists).values({
            id: def.id,
            userId: SYSTEM_USER_ID,
            title: def.title,
            description: def.desc,
            isPublic: true,
        }).onConflictDoUpdate({
            target: lists.id,
            set: { title: def.title, description: def.desc, updatedAt: new Date().toISOString() }
        });

        // 2. Sync Items
        await db.delete(listItems).where(eq(listItems.listId, def.id));
        if (def.games.length > 0) {
            await db.insert(listItems).values(
                def.games.map((g, i) => ({
                    listId: def.id,
                    gameId: g.id,
                    order: i
                }))
            );
        }

        // 3. Get Real Rating
        let isSaved = false;
        let userRating = 0;
        
        // Calculate average from DB (real user ratings)
        const ratingResult = await db.select({ value: sql<number>`avg(rating)` })
            .from(listRatings)
            .where(eq(listRatings.listId, def.id))
            .get();
        const avgRating = ratingResult?.value || 0;

        // Update the cached average in the list table
        await db.update(lists).set({ averageRating: avgRating }).where(eq(lists.id, def.id));

        if (currentUser) {
            const saved = await db.select().from(savedLists).where(and(eq(savedLists.userId, currentUser.id), eq(savedLists.listId, def.id))).get();
            isSaved = !!saved;
            const myRating = await db.select().from(listRatings).where(and(eq(listRatings.userId, currentUser.id), eq(listRatings.listId, def.id))).get();
            userRating = myRating ? myRating.rating : 0;
        }

        const formatGames = (gamesList: PartialGame[]) => gamesList.map(g => ({
            ...g,
            image: g.headerBlob ? `data:image/jpeg;base64,${Buffer.from(g.headerBlob as Buffer).toString('base64')}` : null
        }));

        return {
            id: def.id,
            title: def.title,
            description: def.desc,
            type: 'automatic',
            creator: 'RoguelikeIndex',
            averageRating: avgRating,
            gameCount: def.games.length,
            isSaved,
            userRating,
            games: formatGames(def.games)
        };
    }));

    return NextResponse.json(finalLists);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to sync automatic lists' }, { status: 500 });
  }
}