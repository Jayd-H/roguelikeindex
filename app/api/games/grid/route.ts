import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { count } from 'drizzle-orm';

export const revalidate = 86400;

export async function GET() {
  try {
    const [total] = await db.select({ value: count() }).from(games);

    return NextResponse.json({
      totalCount: total?.value || 0
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch grid stats' }, { status: 500 });
  }
}