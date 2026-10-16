import type { RunSnapshot } from '../src/shared/runSnapshot.js'

export interface RunStore {
  put(snapshot: RunSnapshot): Promise<void>
  list(): Promise<RunSnapshot[]>
  remove(runId: string): Promise<void>
}

export interface RedisLike {
  set(key: string, value: string): Promise<unknown>
  zadd(key: string, entry: { score: number; member: string }): Promise<unknown>
  zrange(key: string, start: number, stop: number, options: { rev: true }): Promise<string[]>
  mget(...keys: string[]): Promise<unknown[]>
  del(key: string): Promise<unknown>
  zrem(key: string, member: string): Promise<unknown>
}

const INDEX = 'runs'
const BATCH = 100

function runKey(runId: string): string {
  return `run:${runId}`
}

function byUpdatedDesc(a: RunSnapshot, b: RunSnapshot): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

export function createMemoryStore(): RunStore {
  const runs = new Map<string, RunSnapshot>()
  return {
    put: async (snapshot) => {
      runs.set(snapshot.runId, snapshot)
    },
    list: async () => [...runs.values()].sort(byUpdatedDesc),
    remove: async (runId) => {
      runs.delete(runId)
    },
  }
}

function parse(value: unknown): RunSnapshot | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as RunSnapshot
    } catch {
      return null
    }
  }
  return value as RunSnapshot
}

export function createRedisStore(redis: RedisLike): RunStore {
  return {
    put: async (snapshot) => {
      await redis.set(runKey(snapshot.runId), JSON.stringify(snapshot))
      await redis.zadd(INDEX, { score: Date.parse(snapshot.updatedAt) || 0, member: snapshot.runId })
    },
    list: async () => {
      const ids = await redis.zrange(INDEX, 0, -1, { rev: true })
      const result: RunSnapshot[] = []
      for (let start = 0; start < ids.length; start += BATCH) {
        const values = await redis.mget(...ids.slice(start, start + BATCH).map(runKey))
        for (const value of values) {
          const run = parse(value)
          if (run) result.push(run)
        }
      }
      return result
    },
    remove: async (runId) => {
      await redis.del(runKey(runId))
      await redis.zrem(INDEX, runId)
    },
  }
}
