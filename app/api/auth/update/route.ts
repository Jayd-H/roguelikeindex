import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, ne, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/get-user';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { containsProfanity } from '@/lib/profanity';

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { username: rawUsername, email, bio, newPassword, currentPassword } = await req.json();

    const currentUserRecord = await db.select().from(users).where(eq(users.id, user.id)).get();
    if (!currentUserRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updates: Partial<typeof users.$inferInsert> = {};

    if (rawUsername && rawUsername !== user.name) {
      const username = rawUsername.toLowerCase();
      
      if (username.length < 3 || username.length > 16) {
        return NextResponse.json({ error: 'Username must be between 3 and 16 characters' }, { status: 400 });
      }
      if (containsProfanity(username)) {
        return NextResponse.json({ error: 'Username contains inappropriate words' }, { status: 400 });
      }
      const taken = await db.select().from(users).where(and(eq(users.username, username), ne(users.id, user.id))).get();
      if (taken) return NextResponse.json({ error: 'Username taken' }, { status: 400 });
      updates.username = username;
    }

    if (email && email !== user.email) {
      if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
      const valid = await verifyPassword(currentPassword, currentUserRecord.password);
      if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 403 });

      if (!email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      const taken = await db.select().from(users).where(and(eq(users.email, email), ne(users.id, user.id))).get();
      if (taken) return NextResponse.json({ error: 'Email taken' }, { status: 400 });
      updates.email = email;
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        return NextResponse.json({ error: 'Bio must be less than 500 characters' }, { status: 400 });
      }
      if (containsProfanity(bio)) {
         return NextResponse.json({ error: 'Bio contains inappropriate language' }, { status: 400 });
      }
      updates.bio = bio;
    }

    if (newPassword) {
        if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
        const valid = await verifyPassword(currentPassword, currentUserRecord.password);
        if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 403 });

        if (newPassword.length <= 4) {
            return NextResponse.json({ error: 'Password too short' }, { status: 400 });
        }
        updates.password = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, user.id));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}