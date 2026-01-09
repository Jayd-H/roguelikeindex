import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestions, suggestionVotes, games, tags, gamesToTags, pricePoints, externalRatings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

const APPROVAL_THRESHOLD = 3;

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const suggestionId = params.id;
  const { vote } = await request.json(); 

  if (![1, -1].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
  }

  try {
    const suggestion = await db.select().from(suggestions).where(eq(suggestions.id, suggestionId)).get();
    if (!suggestion) return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    
    if (suggestion.status !== 'pending') {
        return NextResponse.json({ error: 'Suggestion already processed' }, { status: 400 });
    }

    const existingVote = await db.select().from(suggestionVotes).where(
        and(eq(suggestionVotes.suggestionId, suggestionId), eq(suggestionVotes.userId, user.id))
    ).get();

    if (existingVote) {
        return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    await db.insert(suggestionVotes).values({
        suggestionId,
        userId: user.id,
        vote
    });

    const newCount = suggestion.voteCount + vote;
    await db.update(suggestions).set({ voteCount: newCount }).where(eq(suggestions.id, suggestionId));

    if (newCount >= APPROVAL_THRESHOLD) {
        await applyChange(suggestion);
        await db.update(suggestions).set({ status: 'approved' }).where(eq(suggestions.id, suggestionId));
        return NextResponse.json({ success: true, status: 'approved' });
    } else if (newCount <= -APPROVAL_THRESHOLD) {
        await db.update(suggestions).set({ status: 'rejected' }).where(eq(suggestions.id, suggestionId));
        return NextResponse.json({ success: true, status: 'rejected' });
    }

    return NextResponse.json({ success: true, status: 'pending' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}

async function applyChange(suggestion: typeof suggestions.$inferSelect) {
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