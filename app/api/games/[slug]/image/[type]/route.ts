import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Cache on the server (Edge) for 7 days
export const revalidate = 604800;

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string; type: string }> }
) {
  const params = await props.params;
  const { slug, type } = params;

  let selection;
  let contentType = 'image/jpeg';

  if (type === 'header') {
    selection = { blob: games.headerBlob };
  } else if (type === 'hero') {
    selection = { blob: games.heroBlob };
  } else if (type === 'logo') {
    selection = { blob: games.logoBlob };
    contentType = 'image/png';
  } else {
    return new NextResponse(null, { status: 400 });
  }

  const game = await db.select(selection)
    .from(games)
    .where(eq(games.slug, slug))
    .get();
  
  if (!game || !game.blob) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(game.blob as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}