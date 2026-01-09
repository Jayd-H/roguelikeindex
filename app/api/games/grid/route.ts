import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { count } from 'drizzle-orm';

export const revalidate = 86400;

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'game-images', 'grid-manifest.json');
    let staticGames = [];

    if (fs.existsSync(manifestPath)) {
      const fileContents = fs.readFileSync(manifestPath, 'utf-8');
      const data = JSON.parse(fileContents);
      staticGames = data.games || [];
    }

    const [total] = await db.select({ value: count() }).from(games);

    return NextResponse.json({
      games: staticGames,
      totalCount: total?.value || 0
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch grid games' }, { status: 500 });
  }
}