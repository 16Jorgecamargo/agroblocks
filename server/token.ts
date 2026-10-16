import { createHmac, timingSafeEqual } from 'node:crypto'

export const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createToken(secret: string, now: number): { token: string; expiresAt: number } {
  const expiresAt = now + TOKEN_TTL_MS
  const payload = Buffer.from(String(expiresAt)).toString('base64url')
  return { token: `${payload}.${sign(secret, payload)}`, expiresAt }
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function verifyToken(secret: string, token: string, now: number): boolean {
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined) return false
  if (!safeEqual(signature, sign(secret, payload))) return false
  const expiresAt = Number(Buffer.from(payload, 'base64url').toString())
  return Number.isFinite(expiresAt) && now <= expiresAt
}
