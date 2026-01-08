import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, favorites, ownedGames, reviews } from '@/lib/schema';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = await verifyToken(token);
  
  if (!payload || typeof payload.email !== 'string') {
    return NextResponse.json({ user: null });
  }

  const user = await db.select({ 
    id: users.id, 
    email: users.email, 
    name: users.name 
  }).from(users).where(eq(users.email, payload.email)).get();

  if (!user) {
     return NextResponse.json({ user: null });
  }

  const favoritesCount = await db.select({ value: count() }).from(favorites).where(eq(favorites.userId, user.id)).get();
  const ownedCount = await db.select({ value: count() }).from(ownedGames).where(eq(ownedGames.userId, user.id)).get();
  const reviewsCount = await db.select({ value: count() }).from(reviews).where(eq(reviews.userId, user.id)).get();

  return NextResponse.json({ 
    user: {
      ...user,
      stats: {
        favorites: favoritesCount?.value || 0,
        owned: ownedCount?.value || 0,
        reviews: reviewsCount?.value || 0
      }
    } 
  });
}