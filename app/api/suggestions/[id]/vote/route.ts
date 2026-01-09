import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestions, suggestionVotes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { applyChange } from '@/lib/suggestions';

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

    if (suggestion.userId === user.id) {
        return NextResponse.json({ error: 'Cannot vote on your own suggestion' }, { status: 400 });
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
        // Correctly type-cast for the shared helper
        await applyChange({
            gameId: suggestion.gameId,
            targetField: suggestion.targetField,
            operation: suggestion.operation,
            suggestedValue: suggestion.suggestedValue,
            originalValue: suggestion.originalValue
        });
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