import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string; type: string }> }
) {
  const params = await props.params;
  const { slug, type } = params;

  const game = await db.select().from(games).where(eq(games.slug, slug)).get();
  
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
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}