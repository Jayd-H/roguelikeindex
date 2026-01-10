import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, tags, gamesToTags, externalRatings, lists, listItems, users, listRatings } from '@/lib/schema';
import { desc, eq, and, gte, inArray, like, sql, SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

interface PartialGame {
  id: string;
  slug: string;
  title: string;
}

const getAutomaticLists = unstable_cache(
  async () => {
    const SYSTEM_USER_ID = 'system-auto-list-creator';
    
    // Ensure system user exists
    await db.insert(users).values({
        id: SYSTEM_USER_ID,
        email: 'system@roguelikeindex.com',
        username: 'RoguelikeIndex',
        password: 'system-password-placeholder' 
    }).onConflictDoNothing();

    // Helper: Fetch limited game data by IDs
    const fetchGamesByIds = async (ids: string[]) => {
      if (ids.length === 0) return [];
      return await db.select({
        id: games.id,
        slug: games.slug,
        title: games.title,
      })
      .from(games)
      .where(inArray(games.id, ids))
      .limit(10);
    };

    // Helper: Fetch IDs by simple criteria
    const getGameIds = async (condition: SQL) => {
      const res = await db.select({ id: games.id })
        .from(games)
        .where(condition)
        .orderBy(desc(games.rating))
        .limit(10);
      return res.map(g => g.id);
    };

    // --- Category Queries ---
    const topRatedIds = await getGameIds(gte(games.rating, 4.0));
    const topRated = await fetchGamesByIds(topRatedIds);

    const deckVerifiedIds = await getGameIds(eq(games.steamDeckVerified, true));
    const deckVerified = await fetchGamesByIds(deckVerifiedIds);

    const deckbuilderIds = await getGameIds(eq(games.subgenre, 'Deckbuilder'));
    const deckbuilders = await fetchGamesByIds(deckbuilderIds);

    const actionIds = await getGameIds(eq(games.subgenre, 'Action'));
    const actionRoguelikes = await fetchGamesByIds(actionIds);

    const turnBasedIds = await getGameIds(eq(games.subgenre, 'Turn-Based'));
    const turnBasedRoguelikes = await fetchGamesByIds(turnBasedIds);

    const traditionalIds = await getGameIds(eq(games.subgenre, 'Traditional'));
    const traditionalRoguelikes = await fetchGamesByIds(traditionalIds);

    // --- External Rating Queries ---
    const ignRatings = await db.select({ gameId: externalRatings.gameId })
      .from(externalRatings)
      .where(and(like(externalRatings.source, 'IGN%'), gte(externalRatings.score, '8')))
      .limit(10);
    const ignGames = await fetchGamesByIds(ignRatings.map(r => r.gameId));

    const metaRatings = await db.select({ gameId: externalRatings.gameId })
      .from(externalRatings)
      .where(and(like(externalRatings.source, 'Metacritic%'), gte(externalRatings.score, '85')))
      .limit(10);
    const metaGames = await fetchGamesByIds(metaRatings.map(r => r.gameId));

    // --- Tag Queries ---
    const getTagGames = async (tagName: string) => {
        const tag = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).get();
        if (!tag) return [];
        
        const links = await db.select({ gameId: gamesToTags.gameId })
            .from(gamesToTags)
            .where(eq(gamesToTags.tagId, tag.id))
            .limit(10);
            
        return await fetchGamesByIds(links.map(l => l.gameId));
    };

    const strategyGames = await getTagGames('Strategy');
    const storyGames = await getTagGames('Story Rich');
    const pixelArtGames = await getTagGames('Pixel Art');
    const multiplayerGames = await getTagGames('Multiplayer');

    const definitions = [
      { id: 'auto-top', title: 'Hall of Fame', desc: 'The absolute best roguelikes as rated by the community.', games: topRated },
      { id: 'auto-deck', title: 'Perfect on Deck', desc: 'Verified gems for your portable sessions.', games: deckVerified },
      { id: 'auto-action', title: 'Action Packed', desc: 'Fast-paced combat and reflex-heavy challenges.', games: actionRoguelikes },
      { id: 'auto-deckbuilder', title: 'Master Deckbuilders', desc: 'Draft your way to victory with these card-based hits.', games: deckbuilders },
      { id: 'auto-turnbased', title: 'Tactical Thinkers', desc: 'Take your time and plan every move carefully.', games: turnBasedRoguelikes },
      { id: 'auto-traditional', title: 'Classic Roguelikes', desc: 'The purest form of the genre.', games: traditionalRoguelikes },
      { id: 'auto-ign', title: 'IGN Editor\'s Choice', desc: 'Critically acclaimed titles scoring 8+ on IGN.', games: ignGames },
      { id: 'auto-metacritic', title: 'Metacritic Must-Plays', desc: 'Games with a Metascore of 85 or higher.', games: metaGames },
      { id: 'auto-strat', title: 'Strategic Minds', desc: 'For those who prefer planning over reflexes.', games: strategyGames },
      { id: 'auto-story', title: 'Rich Narratives', desc: 'Roguelikes with compelling stories and lore.', games: storyGames },
      { id: 'auto-pixel', title: 'Pixel Perfect', desc: 'Beautiful retro-styled roguelikes.', games: pixelArtGames },
      { id: 'auto-multiplayer', title: 'Play Together', desc: 'Roguelikes you can enjoy with friends.', games: multiplayerGames },
    ].filter(d => d.games.length > 0);

    const formatGames = (gamesList: PartialGame[]) => gamesList.map(g => ({
        id: g.id,
        slug: g.slug,
        title: g.title,
        image: `/api/games/${g.slug}/image/header`
    }));

    // --- DB Synchronization (Run inside cache callback to only execute once per revalidate period) ---
    const finalLists = await Promise.all(definitions.map(async (def) => {
        // Upsert List
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

        // Replace List Items
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

        // Update Ratings
        const ratingResult = await db.select({ value: sql<number>`avg(rating)` })
            .from(listRatings)
            .where(eq(listRatings.listId, def.id))
            .get();
        const avgRating = ratingResult?.value || 0;

        await db.update(lists).set({ averageRating: avgRating }).where(eq(lists.id, def.id));

        return {
            id: def.id,
            title: def.title,
            description: def.desc,
            type: 'automatic' as const,
            creator: 'RoguelikeIndex',
            averageRating: avgRating,
            gameCount: def.games.length,
            isSaved: false,
            userRating: 0,
            games: formatGames(def.games)
        };
    }));

    return finalLists;
  },
  ['automatic-lists-v1'],
  { revalidate: 86400 } // Re-run logic (and DB updates) once every 24 hours
);

export async function GET() {
  try {
    const lists = await getAutomaticLists();
    return NextResponse.json(lists);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to sync automatic lists' }, { status: 500 });
  }
}