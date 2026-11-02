import { createHash, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
export async function hashPassword(pw: string): Promise<string> {
  return argonHash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPassword(hash: string, pw: string): Promise<boolean> {
  try { return await argonVerify(hash, pw); } catch { return false; }
}
export function hmacSign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a); const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
