import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Cache on the server (Edge) for 7 days (604800 seconds)
export const revalidate = 604800;

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string; type: string }> }
) {
  const params = await props.params;
  const { slug, type } = params;

  // We only select the specific blob column needed to minimize IO
  const game = await db.select({
    headerBlob: games.headerBlob,
    heroBlob: games.heroBlob,
    logoBlob: games.logoBlob
  })
  .from(games)
  .where(eq(games.slug, slug))
  .get();
  
  if (!game) return new NextResponse(null, { status: 404 });

  let imageBuffer: Buffer | null = null;
  let contentType = 'image/jpeg';

  if (type === 'header') imageBuffer = game.headerBlob;
  else if (type === 'hero') imageBuffer = game.heroBlob;
  else if (type === 'logo') {
    imageBuffer = game.logoBlob;
    contentType = 'image/png';
  }

  if (!imageBuffer) return new NextResponse(null, { status: 404 });

  return new NextResponse(imageBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      // Browser cache for 1 year (immutable)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}