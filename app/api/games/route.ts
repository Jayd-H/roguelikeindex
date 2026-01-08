import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { like, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  try {
    const data = await db.query.games.findMany({
    columns: {
      headerBlob: false,
      heroBlob: false,
      logoBlob: false
    },
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

    const formattedData = data.map(game => ({
      ...game,
      tags: game.tags.map(t => t.tag)
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("API Error in /api/games:", error);
    return NextResponse.json({ error: 'Error fetching games' }, { status: 500 });
  }
}