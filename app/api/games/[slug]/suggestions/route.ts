import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestions, games, users, suggestionVotes } from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  const game = await db.select().from(games).where(eq(games.slug, params.slug)).get();
  
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const conditions = [
    eq(suggestions.gameId, game.id),
    eq(suggestions.status, 'pending')
  ];

  if (user) {
    conditions.push(ne(suggestions.userId, user.id));
  }

  const pendingSuggestions = await db.select({
    id: suggestions.id,
    targetField: suggestions.targetField,
    operation: suggestions.operation,
    originalValue: suggestions.originalValue,
    suggestedValue: suggestions.suggestedValue,
    voteCount: suggestions.voteCount,
    createdAt: suggestions.createdAt,
    suggester: users.username,
  })
  .from(suggestions)
  .innerJoin(users, eq(suggestions.userId, users.id))
  .where(and(...conditions))
  .orderBy(suggestions.createdAt);

  let votedIds: string[] = [];
  if (user) {
    const votes = await db.select({ id: suggestionVotes.suggestionId })
        .from(suggestionVotes)
        .where(eq(suggestionVotes.userId, user.id));
    votedIds = votes.map(v => v.id);
  }

  return NextResponse.json({
    suggestions: pendingSuggestions,
    votedIds
  });
}