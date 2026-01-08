import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens, rateLimits } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Get Client IP for Rate Limiting
    // 'x-forwarded-for' is the standard header for client IP in proxies/Next.js
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
    const MAX_ATTEMPTS = 5; // Allow 5 attempts per hour

    const now = new Date();

    // 2. Clean up expired rate limits (optional lazy cleanup)
    await db.delete(rateLimits).where(
      and(eq(rateLimits.key, ip), eq(rateLimits.action, 'forgot_password'), sql`${rateLimits.expiresAt} < ${now}`)
    );

    // 3. Check Rate Limit
    const limitRecord = await db.select().from(rateLimits).where(
      and(eq(rateLimits.key, ip), eq(rateLimits.action, 'forgot_password'))
    ).get();

    if (limitRecord) {
      if (limitRecord.count >= MAX_ATTEMPTS) {
         return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
      // Increment count
      await db.update(rateLimits)
        .set({ count: limitRecord.count + 1 })
        .where(eq(rateLimits.id, limitRecord.id));
    } else {
      // Create new record
      await db.insert(rateLimits).values({
        key: ip,
        action: 'forgot_password',
        count: 1,
        expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
      });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

import { sql } from 'drizzle-orm';