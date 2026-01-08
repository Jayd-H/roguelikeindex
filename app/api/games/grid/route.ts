import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { sql, count } from 'drizzle-orm';

// Cache this route's response for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // 1. Fetch 30 random games with their header images
    const gridGames = await db.select({
      id: games.id,
      slug: games.slug,
      headerBlob: games.headerBlob,
    })
    .from(games)
    .orderBy(sql`RANDOM()`)
    .limit(30)
    .all();

    // 2. Fetch total count (lightweight)
    const [total] = await db.select({ count: count() }).from(games);

    // 3. Convert Buffers to Base64 Data URIs
    const gamesWithImages = gridGames.map(game => {
      let image = null;
      if (game.headerBlob) {
        // Convert Buffer to Base64 string
        const base64 = Buffer.from(game.headerBlob).toString('base64');
        image = `data:image/jpeg;base64,${base64}`;
      }
      
      return {
        id: game.id,
        slug: game.slug,
        image: image // Send the actual image data
      };
    });

    return NextResponse.json({
      games: gamesWithImages,
      totalCount: total?.count || 0
    });
  } catch (error) {
    console.error("Grid API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch grid games' }, { status: 500 });
  }
}