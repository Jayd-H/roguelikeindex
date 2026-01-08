import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { hash, compare } from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return await compare(password, hash);
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}