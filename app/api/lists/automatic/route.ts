import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, tags, gamesToTags, externalRatings, lists, listItems, users, savedLists, listRatings } from '@/lib/schema';
import { desc, eq, and, gte, inArray, like, sql, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export const revalidate = 3600;

interface PartialGame {
  id: string;
  slug: string;
  title: string;
  rating: number;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
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
        columns: { id: true, slug: true, title: true, rating: true }
      });
    };

    const topRated = await db.query.games.findMany({
      where: gte(games.rating, 4.0),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const deckVerified = await db.query.games.findMany({
      where: eq(games.steamDeckVerified, true),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const deckbuilders = await db.query.games.findMany({
      where: eq(games.subgenre, 'Deckbuilder'),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const actionRoguelikes = await db.query.games.findMany({
      where: eq(games.subgenre, 'Action'),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const turnBasedRoguelikes = await db.query.games.findMany({
      where: eq(games.subgenre, 'Turn-Based'),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const traditionalRoguelikes = await db.query.games.findMany({
      where: eq(games.subgenre, 'Traditional'),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

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

    const getTagGames = async (tagName: string) => {
        const tag = await db.query.tags.findFirst({ where: eq(tags.name, tagName) });
        if (!tag) return [];
        const links = await db.select({ gameId: gamesToTags.gameId })
            .from(gamesToTags)
            .where(eq(gamesToTags.tagId, tag.id));
        return await fetchGamesByIds(links.map(l => l.gameId));
    };

    const strategyGames = await getTagGames('Strategy');
    const storyGames = await getTagGames('Story Rich');
    const pixelArtGames = await getTagGames('Pixel Art');
    const multiplayerGames = await getTagGames('Multiplayer');

    const metaProgressionGames = await db.query.games.findMany({
      where: eq(games.metaProgression, true),
      orderBy: desc(games.rating),
      columns: { id: true, slug: true, title: true, rating: true }
    });

    const definitions = [
      { id: 'auto-top', title: 'Hall of Fame', desc: 'The absolute best roguelikes as rated by the community.', games: topRated },
      { id: 'auto-deck', title: 'Perfect on Deck', desc: 'Verified gems for your portable sessions.', games: deckVerified },
      { id: 'auto-action', title: 'Action Packed', desc: 'Fast-paced combat and reflex-heavy challenges.', games: actionRoguelikes },
      { id: 'auto-deckbuilder', title: 'Master Deckbuilders', desc: 'Draft your way to victory with these card-based hits.', games: deckbuilders },
      { id: 'auto-turnbased', title: 'Tactical Thinkers', desc: 'Take your time and plan every move carefully.', games: turnBasedRoguelikes },
      { id: 'auto-traditional', title: 'Classic Roguelikes', desc: 'The purest form of the genre.', games: traditionalRoguelikes },
      { id: 'auto-meta', title: 'Progressive Journey', desc: 'Get stronger between runs with meta progression.', games: metaProgressionGames },
      { id: 'auto-ign', title: 'IGN Editor\'s Choice', desc: 'Critically acclaimed titles scoring 8+ on IGN.', games: ignGames },
      { id: 'auto-metacritic', title: 'Metacritic Must-Plays', desc: 'Games with a Metascore of 85 or higher.', games: metaGames },
      { id: 'auto-strat', title: 'Strategic Minds', desc: 'For those who prefer planning over reflexes.', games: strategyGames },
      { id: 'auto-story', title: 'Rich Narratives', desc: 'Roguelikes with compelling stories and lore.', games: storyGames },
      { id: 'auto-pixel', title: 'Pixel Perfect', desc: 'Beautiful retro-styled roguelikes.', games: pixelArtGames },
      { id: 'auto-multiplayer', title: 'Play Together', desc: 'Roguelikes you can enjoy with friends.', games: multiplayerGames },
    ].filter(d => d.games.length > 0);

    const formatGames = (gamesList: PartialGame[]) => gamesList.slice(0, 10).map(g => ({
        id: g.id,
        slug: g.slug,
        title: g.title,
        image: `/api/games/${g.slug}/image/header`
    }));

    const finalLists = await Promise.all(definitions.map(async (def) => {
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

        let isSaved = false;
        let userRating = 0;
        
        const ratingResult = await db.select({ value: sql<number>`avg(rating)` })
            .from(listRatings)
            .where(eq(listRatings.listId, def.id))
            .get();
        const avgRating = ratingResult?.value || 0;

        await db.update(lists).set({ averageRating: avgRating }).where(eq(lists.id, def.id));

        if (currentUser) {
            const saved = await db.select().from(savedLists).where(and(eq(savedLists.userId, currentUser.id), eq(savedLists.listId, def.id))).get();
            isSaved = !!saved;
            const myRating = await db.select().from(listRatings).where(and(eq(listRatings.userId, currentUser.id), eq(listRatings.listId, def.id))).get();
            userRating = myRating ? myRating.rating : 0;
        }

        return {
            id: def.id,
            title: def.title,
            description: def.desc,
            type: 'automatic' as const,
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