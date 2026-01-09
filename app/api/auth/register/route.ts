import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { hashPassword, signToken } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';
import { containsProfanity } from '@/lib/profanity';

export async function POST(req: Request) {
  try {
    const { email, password, username: rawUsername } = await req.json();

    if (!email || !password || !rawUsername) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const username = rawUsername.toLowerCase();

    if (username.length < 3 || username.length > 16) {
      return NextResponse.json({ error: 'Username must be between 3 and 16 characters' }, { status: 400 });
    }
    
    if (containsProfanity(username)) {
      return NextResponse.json({ error: 'Username contains inappropriate words' }, { status: 400 });
    }

    if (password.length <= 4) {
      return NextResponse.json({ error: 'Password must be greater than 4 characters' }, { status: 400 });
    }

    const existing = await db.select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .get();
      
    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      username,
    }).returning().get();

    const token = await signToken({ id: newUser.id, email: newUser.email });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}