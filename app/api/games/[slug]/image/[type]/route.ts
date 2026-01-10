import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gameBlobs } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const revalidate = 604800;

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string; type: string }> }
) {
  const params = await props.params;
  const { slug, type } = params;

  if (!['header', 'hero', 'logo'].includes(type)) {
    return new NextResponse(null, { status: 400 });
  }

  // 1. Resolve Slug to Game ID
  const game = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).get();
  
  if (!game) {
    return new NextResponse(null, { status: 404 });
  }

  // 2. Fetch Blob from new table
  const blobEntry = await db.select({ data: gameBlobs.data })
    .from(gameBlobs)
    .where(and(eq(gameBlobs.gameId, game.id), eq(gameBlobs.type, type)))
    .get();

  if (!blobEntry) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = type === 'logo' ? 'image/png' : 'image/jpeg';

  return new NextResponse(blobEntry.data as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}