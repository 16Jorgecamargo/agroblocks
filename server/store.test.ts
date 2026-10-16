import { validSnapshot } from '../src/shared/snapshotFixture.js'
import { createMemoryStore, createRedisStore, type RedisLike } from './store.js'

function fakeRedis(): RedisLike & { data: Map<string, unknown>; scores: Map<string, number> } {
  const data = new Map<string, unknown>()
  const scores = new Map<string, number>()
  return {
    data,
    scores,
    set: async (key, value) => {
      data.set(key, JSON.parse(value))
      return 'OK'
    },
    zadd: async (_key, entry) => {
      scores.set(entry.member, entry.score)
      return 1
    },
    zrange: async () => [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([member]) => member),
    mget: async (...keys) => keys.map((key) => data.get(key) ?? null),
    del: async (key) => {
      data.delete(key)
      return 1
    },
    zrem: async (_key, member) => {
      scores.delete(member)
      return 1
    },
  }
}

const older = { ...validSnapshot, runId: 'run-older-0001', updatedAt: '2026-10-16T09:00:00.000Z' }
const newer = { ...validSnapshot, runId: 'run-newer-0002', updatedAt: '2026-10-16T11:00:00.000Z' }

for (const [name, make] of [
  ['memory', () => createMemoryStore()],
  ['redis', () => createRedisStore(fakeRedis())],
] as const) {
  describe(`${name} store`, () => {
    it('lists runs newest first and replaces a run on put', async () => {
      const store = make()
      await store.put(older)
      await store.put(newer)
      await store.put({ ...older, updatedAt: '2026-10-16T09:30:00.000Z' })
      const runs = await store.list()
      expect(runs.map((run) => run.runId)).toEqual(['run-newer-0002', 'run-older-0001'])
      expect(runs[1].updatedAt).toBe('2026-10-16T09:30:00.000Z')
    })

    it('removes a run', async () => {
      const store = make()
      await store.put(older)
      await store.remove('run-older-0001')
      expect(await store.list()).toEqual([])
    })
  })
}

it('reads values that Redis returns as strings or objects and skips missing ones', async () => {
  const redis = fakeRedis()
  const store = createRedisStore(redis)
  await store.put(older)
  redis.data.set('run:run-older-0001', JSON.stringify(older))
  redis.scores.set('ghost', 1)
  expect((await store.list()).map((run) => run.runId)).toEqual(['run-older-0001'])
})
