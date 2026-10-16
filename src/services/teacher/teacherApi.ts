import type { RunSnapshot } from '@/shared/runSnapshot'

export const TOKEN_KEY = 'agroblocks:teacher-token'

export type Failure = 'unauthorized' | 'not-configured' | 'offline'

const base = () => `${import.meta.env.BASE_URL}api/teacher`

function session(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function saveToken(token: string, expiresAt: number): void {
  try {
    session()?.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }))
  } catch {
    return
  }
}

export function clearToken(): void {
  try {
    session()?.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

export function readToken(): string | null {
  try {
    const raw = session()?.getItem(TOKEN_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as { token?: unknown; expiresAt?: unknown }
    if (typeof value.token !== 'string' || typeof value.expiresAt !== 'number' || value.expiresAt <= Date.now()) return null
    return value.token
  } catch {
    return null
  }
}

function failure(status: number): Failure {
  return status === 401 ? 'unauthorized' : status === 503 ? 'not-configured' : 'offline'
}

export async function login(password: string): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; reason: 'wrong-password' | 'not-configured' | 'offline' }> {
  try {
    const response = await fetch(`${base()}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) })
    if (response.status === 401) return { ok: false, reason: 'wrong-password' }
    if (!response.ok) return { ok: false, reason: response.status === 503 ? 'not-configured' : 'offline' }
    const body = (await response.json()) as { token: string; expiresAt: number }
    return { ok: true, token: body.token, expiresAt: body.expiresAt }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}

export async function fetchRuns(token: string): Promise<{ ok: true; runs: RunSnapshot[] } | { ok: false; reason: Failure }> {
  try {
    const response = await fetch(`${base()}/runs`, { headers: { authorization: `Bearer ${token}` } })
    if (!response.ok) return { ok: false, reason: failure(response.status) }
    return { ok: true, runs: ((await response.json()) as { runs: RunSnapshot[] }).runs }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}

export async function deleteRun(token: string, runId: string): Promise<{ ok: true } | { ok: false; reason: Failure }> {
  try {
    const response = await fetch(`${base()}/runs?id=${encodeURIComponent(runId)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
    return response.ok ? { ok: true } : { ok: false, reason: failure(response.status) }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}
