import type { SaveData } from '@/game/progress/types'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { toSnapshot } from '@/services/sync/toSnapshot'

export const PENDING_KEY = 'agroblocks:sync-pending:v1'

export interface RunSync {
  schedule(save: SaveData): void
  resumePending(save: SaveData): void
  dispose(): void
}

interface RunSyncOptions {
  send: (snapshot: RunSnapshot) => Promise<boolean>
  storage: Storage | null
  delayMs?: number
  now?: () => string
}

function store(storage: Storage | null, action: (target: Storage) => void) {
  try {
    if (storage) action(storage)
  } catch {
    return
  }
}

export function createRunSync({ send, storage, delayMs = 2000, now = () => new Date().toISOString() }: RunSyncOptions): RunSync {
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let queued: SaveData | null = null

  const flush = async (save: SaveData) => {
    if (inFlight) {
      queued = save
      return
    }
    const snapshot = toSnapshot(save, now())
    if (!snapshot) return
    inFlight = true
    let ok = false
    try {
      ok = await send(snapshot)
    } catch {
      ok = false
    }
    inFlight = false
    store(storage, (target) => (ok ? target.removeItem(PENDING_KEY) : target.setItem(PENDING_KEY, snapshot.runId)))
    if (queued) {
      const next = queued
      queued = null
      await flush(next)
    }
  }

  const later = (save: SaveData, ms: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void flush(save)
    }, ms)
  }

  return {
    schedule: (save) => {
      if (save.runId && save.student) later(save, delayMs)
    },
    resumePending: (save) => {
      let pending: string | null = null
      store(storage, (target) => (pending = target.getItem(PENDING_KEY)))
      if (pending && save.runId && save.student) later(save, 0)
    },
    dispose: () => {
      if (timer) clearTimeout(timer)
      timer = null
    },
  }
}

export async function sendRun(snapshot: RunSnapshot): Promise<boolean> {
  try {
    const body = JSON.stringify(snapshot)
    const response = await fetch(`${import.meta.env.BASE_URL}api/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: body.length < 60_000,
    })
    return response.ok
  } catch {
    return false
  }
}
