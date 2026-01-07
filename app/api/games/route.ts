import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { like, or } from 'drizzle-orm';
// We remove 'games' and 'tags' from imports to fix the unused variable warning
// We also removed 'eq' as it wasn't used

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  try {
    const data = await db.query.games.findMany({
      // We use the 'games' alias provided by the callback, not the imported variable
      where: search ? (games) => 
        or(
          like(games.title, `%${search}%`)
        )
      : undefined,
      with: {
        tags: {
          with: {
            tag: true
          }
        }
      }
    });

    // Flatten tags structure for frontend (Drizzle returns { tag: { id, name } })
    const formattedData = data.map(game => ({
      ...game,
      tags: game.tags.map(t => t.tag)
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching games' }, { status: 500 });
  }
}