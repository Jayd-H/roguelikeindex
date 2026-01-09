import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestions, games, rateLimits, usersToRoles, roles } from '@/lib/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { containsProfanity } from '@/lib/profanity';
import { applyChange } from '@/lib/suggestions';

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { targetField, operation, originalValue, suggestedValue } = await request.json();

    if (!targetField || !operation || suggestedValue === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const checkValue = (val: unknown): boolean => {
      if (typeof val === 'string') return containsProfanity(val);
      if (typeof val === 'object' && val !== null) {
        return Object.values(val as Record<string, unknown>).some(v => checkValue(v));
      }
      return false;
    };

    if (checkValue(suggestedValue)) {
      return NextResponse.json({ error: 'Inappropriate content detected' }, { status: 400 });
    }

    const game = await db.select().from(games).where(eq(games.slug, params.slug)).get();
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // Check if user is admin
    const isAdmin = await db.select()
        .from(usersToRoles)
        .innerJoin(roles, eq(usersToRoles.roleId, roles.id))
        .where(and(eq(usersToRoles.userId, user.id), eq(roles.name, 'admin')))
        .get();

    const safeOriginalValue = originalValue === undefined ? null : originalValue;
    const suggestedSql = sql`${JSON.stringify(suggestedValue)}`;
    const originalSql = safeOriginalValue ? sql`${JSON.stringify(safeOriginalValue)}` : null;

    if (isAdmin) {
        // Admin Bypass: Apply immediately
        await applyChange({
            gameId: game.id,
            targetField,
            operation,
            suggestedValue,
            originalValue: safeOriginalValue
        });

        // Log as approved suggestion for history
        await db.insert(suggestions).values({
            gameId: game.id,
            userId: user.id,
            targetField,
            operation,
            originalValue: originalSql,
            suggestedValue: suggestedSql,
            voteCount: 999,
            status: 'approved'
        });

        return NextResponse.json({ success: true, status: 'approved' });
    }

    // Normal User Flow with Rate Limit
    const userId = user.id;
    const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
    const MAX_ATTEMPTS = 10;
    const now = new Date();
    
    await db.delete(rateLimits).where(
      and(
        eq(rateLimits.key, userId), 
        eq(rateLimits.action, 'suggest_edit'), 
        lt(rateLimits.expiresAt, now)
      )
    );

    const limitRecord = await db.select().from(rateLimits).where(
      and(eq(rateLimits.key, userId), eq(rateLimits.action, 'suggest_edit'))
    ).get();

    if (limitRecord) {
      if (limitRecord.count >= MAX_ATTEMPTS) {
         return NextResponse.json({ error: 'Too many suggestions. Try again later.' }, { status: 429 });
      }
      await db.update(rateLimits)
        .set({ count: limitRecord.count + 1 })
        .where(eq(rateLimits.id, limitRecord.id));
    } else {
      await db.insert(rateLimits).values({
        key: userId,
        action: 'suggest_edit',
        count: 1,
        expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
      });
    }

    const existing = await db.select().from(suggestions).where(
        and(
            eq(suggestions.gameId, game.id),
            eq(suggestions.userId, user.id),
            eq(suggestions.targetField, targetField),
            eq(suggestions.status, 'pending')
        )
    ).get();

    if (existing) {
        return NextResponse.json({ error: 'You already have a pending suggestion for this field' }, { status: 400 });
    }

    await db.insert(suggestions).values({
      gameId: game.id,
      userId: user.id,
      targetField,
      operation,
      originalValue: originalSql,
      suggestedValue: suggestedSql,
      voteCount: 1 
    });

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}