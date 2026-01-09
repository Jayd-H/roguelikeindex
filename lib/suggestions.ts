import { db } from '@/lib/db';
import { games, tags, gamesToTags, pricePoints, externalRatings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

interface SuggestionData {
  gameId: string;
  targetField: string;
  operation: string;
  suggestedValue: unknown;
  originalValue: unknown;
}

export async function applyChange(suggestion: SuggestionData) {
    const { targetField, operation, suggestedValue, gameId, originalValue } = suggestion;
    
    if (targetField === 'metaProgression') {
        const value = suggestedValue as boolean;
        await db.update(games).set({ metaProgression: value }).where(eq(games.id, gameId));
    } 
    else if (targetField === 'steamDeckVerified') {
        const value = suggestedValue as boolean;
        await db.update(games).set({ steamDeckVerified: value }).where(eq(games.id, gameId));
    }
    else if (targetField === 'tags') {
        const value = suggestedValue as { name: string };
        if (operation === 'add') {
            let tag = await db.select().from(tags).where(eq(tags.name, value.name)).get();
            if (!tag) {
                tag = await db.insert(tags).values({ name: value.name }).returning().get();
            }
            await db.insert(gamesToTags).values({ gameId, tagId: tag.id }).onConflictDoNothing();
        } else if (operation === 'remove') {
            const tag = await db.select().from(tags).where(eq(tags.name, value.name)).get();
            if (tag) {
                await db.delete(gamesToTags).where(and(eq(gamesToTags.gameId, gameId), eq(gamesToTags.tagId, tag.id)));
            }
        }
    }
    else if (targetField === 'pricing') {
        const value = suggestedValue as { platform: string; store: string; price: string; url: string };
        const original = originalValue as { id: number } | null;
        if (operation === 'add') {
            await db.insert(pricePoints).values({ ...value, gameId });
        } else if (operation === 'edit' && original?.id) {
            await db.update(pricePoints)
                .set({ price: value.price, url: value.url })
                .where(eq(pricePoints.id, original.id));
        } else if (operation === 'remove' && original?.id) {
            await db.delete(pricePoints).where(eq(pricePoints.id, original.id));
        }
    }
    else if (targetField === 'externalRatings') {
        const value = suggestedValue as { source: string; score: string; url: string };
        const original = originalValue as { id: number } | null;
        if (operation === 'add') {
            await db.insert(externalRatings).values({ ...value, gameId });
        } else if (operation === 'edit' && original?.id) {
            await db.update(externalRatings)
                .set({ score: value.score, url: value.url })
                .where(eq(externalRatings.id, original.id));
        } else if (operation === 'remove' && original?.id) {
            await db.delete(externalRatings).where(eq(externalRatings.id, original.id));
        }
    }
}