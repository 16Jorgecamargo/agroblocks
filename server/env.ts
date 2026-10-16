import { Redis } from '@upstash/redis'
import type { ApiDeps } from './handlers.js'
import { createRedisStore, type RedisLike } from './store.js'

export function createEnvDeps(env: Record<string, string | undefined>): ApiDeps {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  return {
    store: url && token ? createRedisStore(new Redis({ url, token }) as unknown as RedisLike) : null,
    password: env.TEACHER_PASSWORD || null,
    secret: env.TEACHER_TOKEN_SECRET || null,
    now: () => Date.now(),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }
}
