import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';

const APPROVAL_THRESHOLD = 5;

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const game = await db.select().from(games).where(eq(games.slug, params.slug)).get();
  
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  
  if (game.status !== 'pending') {
    return NextResponse.json({ error: 'Game not pending review' }, { status: 400 });
  }

  // Prevent submitter from approving their own game
  if (game.submitterId === user.id) {
    return NextResponse.json({ error: 'You cannot approve your own submission' }, { status: 403 });
  }

  const updatedGame = await db.update(games)
    .set({ 
      approvalVotes: sql`approval_votes + 1`,
      status: sql`CASE WHEN approval_votes + 1 >= ${APPROVAL_THRESHOLD} THEN 'approved' ELSE status END`
    })
    .where(eq(games.id, game.id))
    .returning()
    .get();

  return NextResponse.json({ 
    success: true, 
    approved: updatedGame.status === 'approved',
    votes: updatedGame.approvalVotes 
  });
}