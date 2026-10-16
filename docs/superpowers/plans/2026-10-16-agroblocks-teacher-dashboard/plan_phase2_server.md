# Phase 2 — Server (Tasks 4–7)

See `plan_index.md` for Goal, Global Constraints and Review Focus. Every file in `server/` and `api/` uses relative imports with `.js` extensions and never imports `@/…`.

### Task 4: Run stores (memory and Redis)

**Files:**
- Modify: `package.json` (dependency), `vite.config.ts` (`test.include`), `tsconfig.json` (`include`, `types`)
- Create: `server/store.ts`
- Test: `server/store.test.ts`

**Interfaces:**
- Consumes: `RunSnapshot` from `../src/shared/runSnapshot.js`; `validSnapshot` from `../src/shared/snapshotFixture.js`.
- Produces:
  - `interface RunStore { put(snapshot: RunSnapshot): Promise<void>; list(): Promise<RunSnapshot[]>; remove(runId: string): Promise<void> }` — `list` is most recently updated first
  - `createMemoryStore(): RunStore`
  - `interface RedisLike` (subset of `@upstash/redis` `Redis`) and `createRedisStore(redis: RedisLike): RunStore`

- [ ] **Step 1: Setup**

Run: `npm install @upstash/redis@1.39.0`
Then in `vite.config.ts` set `include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts']`.
In `tsconfig.json` set `"include": ["src", "tests", "server", "api", "vite.config.ts", "playwright.config.ts", "playwright.howto.config.ts"]` and add `"node"` to `"types"`.

- [ ] **Step 2: Write the failing test**

`server/store.test.ts`:
```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run server/store.test.ts`
Expected: FAIL — cannot resolve `./store.js`.

- [ ] **Step 4: Implement**

`server/store.ts`:
```ts
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
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run server && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json server
git commit -m "feat(server): memory and Redis run stores"
```

### Task 5: Teacher tokens and API handlers

**Files:**
- Create: `server/token.ts`, `server/handlers.ts`
- Test: `server/token.test.ts`, `server/handlers.test.ts`

**Interfaces:**
- Consumes: `RunStore`, `createMemoryStore` (Task 4); `runSnapshotSchema`, `MAX_BODY_BYTES` (Task 1); `studentKeyOf` (Task 1).
- Produces:
  - `TOKEN_TTL_MS = 12 * 60 * 60 * 1000`
  - `createToken(secret: string, now: number): { token: string; expiresAt: number }`
  - `verifyToken(secret: string, token: string, now: number): boolean`
  - `interface ApiRequest { method: string; path: string; headers: Record<string, string | undefined>; query: Record<string, string | undefined>; body: string }`
  - `interface ApiResponse { status: number; body?: unknown }`
  - `interface ApiDeps { store: RunStore | null; password: string | null; secret: string | null; now: () => number; wait: (ms: number) => Promise<void> }`
  - `handleApi(request: ApiRequest, deps: ApiDeps): Promise<ApiResponse>`

Routes: `POST /api/runs` → 204 | 400 | 413 | 503; `POST /api/teacher/login` → 200 `{ token, expiresAt }` | 400 | 401 | 503; `GET /api/teacher/runs` → 200 `{ runs }` | 401 | 503; `DELETE /api/teacher/runs?id=` → 204 | 400 | 401 | 503; other paths 404; wrong method 405. Errors use body `{ error: '<kebab-code>' }`.

- [ ] **Step 1: Write the failing tests**

`server/token.test.ts`:
```ts
import { createToken, TOKEN_TTL_MS, verifyToken } from './token.js'

describe('teacher token', () => {
  it('verifies until it expires', () => {
    const { token, expiresAt } = createToken('secret', 1000)
    expect(expiresAt).toBe(1000 + TOKEN_TTL_MS)
    expect(verifyToken('secret', token, 2000)).toBe(true)
    expect(verifyToken('secret', token, expiresAt + 1)).toBe(false)
  })

  it('rejects other secrets, tampered expiry and garbage', () => {
    const { token } = createToken('secret', 1000)
    expect(verifyToken('other', token, 2000)).toBe(false)
    const [, signature] = token.split('.')
    const forged = `${Buffer.from(String(9e15)).toString('base64url')}.${signature}`
    expect(verifyToken('secret', forged, 2000)).toBe(false)
    expect(verifyToken('secret', 'nope', 2000)).toBe(false)
    expect(verifyToken('secret', '', 2000)).toBe(false)
  })
})
```

`server/handlers.test.ts`:
```ts
import { validSnapshot } from '../src/shared/snapshotFixture.js'
import { handleApi, type ApiDeps, type ApiRequest } from './handlers.js'
import { createMemoryStore } from './store.js'
import { createToken } from './token.js'

function deps(overrides: Partial<ApiDeps> = {}): ApiDeps {
  return { store: createMemoryStore(), password: 'dashboard', secret: 'secret', now: () => 1000, wait: vi.fn(async () => undefined), ...overrides }
}

function request(method: string, path: string, extra: Partial<ApiRequest> = {}): ApiRequest {
  return { method, path, headers: {}, query: {}, body: '', ...extra }
}

const bearer = (secret = 'secret', now = 1000) => ({ authorization: `Bearer ${createToken(secret, now).token}` })

describe('handleApi', () => {
  it('stores a valid run and recomputes the student key', async () => {
    const d = deps()
    const response = await handleApi(request('POST', '/api/runs', { body: JSON.stringify({ ...validSnapshot, studentKey: 'forged' }) }), d)
    expect(response.status).toBe(204)
    expect((await d.store?.list())?.[0].studentKey).toBe('ana souza|escola azul')
  })

  it('rejects bad json, invalid runs and oversized bodies', async () => {
    expect((await handleApi(request('POST', '/api/runs', { body: '{' }), deps())).status).toBe(400)
    expect((await handleApi(request('POST', '/api/runs', { body: JSON.stringify({ runId: 'x' }) }), deps())).status).toBe(400)
    expect((await handleApi(request('POST', '/api/runs', { body: 'x'.repeat(512 * 1024 + 1) }), deps())).status).toBe(413)
  })

  it('logs in with the right password only, waiting before a refusal', async () => {
    const d = deps()
    const ok = await handleApi(request('POST', '/api/teacher/login', { body: JSON.stringify({ password: 'dashboard' }) }), d)
    expect(ok.status).toBe(200)
    expect(ok.body).toMatchObject({ expiresAt: 1000 + 12 * 60 * 60 * 1000 })
    const wrong = await handleApi(request('POST', '/api/teacher/login', { body: JSON.stringify({ password: 'Dashboard' }) }), d)
    expect(wrong).toEqual({ status: 401, body: { error: 'wrong-password' } })
    expect(d.wait).toHaveBeenCalledWith(400)
  })

  it('lists and deletes runs only with a valid token', async () => {
    const d = deps()
    await d.store?.put(validSnapshot)
    expect((await handleApi(request('GET', '/api/teacher/runs'), d)).status).toBe(401)
    expect((await handleApi(request('GET', '/api/teacher/runs', { headers: bearer('other') }), d)).status).toBe(401)
    const listed = await handleApi(request('GET', '/api/teacher/runs', { headers: bearer() }), d)
    expect(listed).toEqual({ status: 200, body: { runs: [validSnapshot] } })
    expect((await handleApi(request('DELETE', '/api/teacher/runs', { headers: bearer() }), d)).status).toBe(400)
    const removed = await handleApi(request('DELETE', '/api/teacher/runs', { headers: bearer(), query: { id: validSnapshot.runId } }), d)
    expect(removed.status).toBe(204)
    expect(await d.store?.list()).toEqual([])
  })

  it('rejects an expired token', async () => {
    const d = deps({ now: () => 1000 + 13 * 60 * 60 * 1000 })
    expect((await handleApi(request('GET', '/api/teacher/runs', { headers: bearer() }), d)).status).toBe(401)
  })

  it('answers 503 when the server is not configured', async () => {
    const empty = deps({ store: null, password: null, secret: null })
    expect(await handleApi(request('POST', '/api/runs', { body: JSON.stringify(validSnapshot) }), empty)).toEqual({ status: 503, body: { error: 'not-configured' } })
    expect((await handleApi(request('POST', '/api/teacher/login', { body: '{"password":"dashboard"}' }), empty)).status).toBe(503)
    expect((await handleApi(request('GET', '/api/teacher/runs', { headers: bearer() }), empty)).status).toBe(503)
  })

  it('answers 404 and 405', async () => {
    expect((await handleApi(request('GET', '/api/nothing'), deps())).status).toBe(404)
    expect((await handleApi(request('GET', '/api/runs'), deps())).status).toBe(405)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run server`
Expected: FAIL — cannot resolve `./token.js` / `./handlers.js`.

- [ ] **Step 3: Implement**

`server/token.ts`:
```ts
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
```

`server/handlers.ts`:
```ts
import { MAX_BODY_BYTES, runSnapshotSchema } from '../src/shared/runSnapshot.js'
import { studentKeyOf } from '../src/shared/student.js'
import type { RunStore } from './store.js'
import { createToken, safeEqual, verifyToken } from './token.js'

export interface ApiRequest {
  method: string
  path: string
  headers: Record<string, string | undefined>
  query: Record<string, string | undefined>
  body: string
}

export interface ApiResponse {
  status: number
  body?: unknown
}

export interface ApiDeps {
  store: RunStore | null
  password: string | null
  secret: string | null
  now: () => number
  wait: (ms: number) => Promise<void>
}

const NOT_CONFIGURED: ApiResponse = { status: 503, body: { error: 'not-configured' } }

function error(status: number, code: string): ApiResponse {
  return { status, body: { error: code } }
}

function parseJson(body: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(body) }
  } catch {
    return { ok: false }
  }
}

function authorized(request: ApiRequest, deps: ApiDeps, secret: string): boolean {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return verifyToken(secret, token, deps.now())
}

async function saveRun(request: ApiRequest, deps: ApiDeps): Promise<ApiResponse> {
  if (!deps.store) return NOT_CONFIGURED
  if (Buffer.byteLength(request.body) > MAX_BODY_BYTES) return error(413, 'too-large')
  const json = parseJson(request.body)
  if (!json.ok) return error(400, 'bad-json')
  const parsed = runSnapshotSchema.safeParse(json.value)
  if (!parsed.success) return error(400, 'invalid-run')
  await deps.store.put({ ...parsed.data, studentKey: studentKeyOf(parsed.data.student) })
  return { status: 204 }
}

async function login(request: ApiRequest, deps: ApiDeps): Promise<ApiResponse> {
  if (!deps.password || !deps.secret) return NOT_CONFIGURED
  const json = parseJson(request.body)
  const password = json.ok && typeof (json.value as { password?: unknown })?.password === 'string' ? (json.value as { password: string }).password : null
  if (password === null) return error(400, 'bad-request')
  if (!safeEqual(password, deps.password)) {
    await deps.wait(400)
    return error(401, 'wrong-password')
  }
  return { status: 200, body: createToken(deps.secret, deps.now()) }
}

async function teacherRuns(request: ApiRequest, deps: ApiDeps): Promise<ApiResponse> {
  if (!deps.store || !deps.secret) return NOT_CONFIGURED
  if (!authorized(request, deps, deps.secret)) return error(401, 'unauthorized')
  if (request.method === 'GET') return { status: 200, body: { runs: await deps.store.list() } }
  const id = request.query.id
  if (!id) return error(400, 'missing-id')
  await deps.store.remove(id)
  return { status: 204 }
}

const ROUTES: Record<string, { methods: string[]; run: (request: ApiRequest, deps: ApiDeps) => Promise<ApiResponse> }> = {
  '/api/runs': { methods: ['POST'], run: saveRun },
  '/api/teacher/login': { methods: ['POST'], run: login },
  '/api/teacher/runs': { methods: ['GET', 'DELETE'], run: teacherRuns },
}

export async function handleApi(request: ApiRequest, deps: ApiDeps): Promise<ApiResponse> {
  const route = ROUTES[request.path.replace(/\/+$/, '')]
  if (!route) return error(404, 'not-found')
  if (!route.methods.includes(request.method)) return error(405, 'method-not-allowed')
  return route.run(request, deps)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run server && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add server
git commit -m "feat(server): teacher tokens and API handlers"
```

### Task 6: Vercel Functions

**Files:**
- Create: `server/env.ts`, `server/web.ts`, `api/runs.ts`, `api/teacher/login.ts`, `api/teacher/runs.ts`
- Test: `server/web.test.ts`, `server/functions.test.ts` (never put tests inside `api/`: every file there becomes a Vercel Function)

**Interfaces:**
- Consumes: `handleApi`, `ApiDeps`, `ApiRequest`, `ApiResponse` (Task 5); `createRedisStore` (Task 4).
- Produces:
  - `createEnvDeps(env: Record<string, string | undefined>): ApiDeps` — Redis from `KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`; password `TEACHER_PASSWORD`; secret `TEACHER_TOKEN_SECRET`; `null` when missing
  - `toApiRequest(request: Request): Promise<ApiRequest>`, `toWebResponse(response: ApiResponse): Response`, `handleWeb(request: Request, deps: ApiDeps): Promise<Response>`
  - Vercel Functions: `api/runs.ts` exports `POST`; `api/teacher/login.ts` exports `POST`; `api/teacher/runs.ts` exports `GET`, `DELETE` — each `(request: Request) => Promise<Response>`

- [ ] **Step 1: Write the failing tests**

`server/web.test.ts`:
```ts
import { validSnapshot } from '../src/shared/snapshotFixture.js'
import { createMemoryStore } from './store.js'
import { handleWeb, toApiRequest } from './web.js'
import { createEnvDeps } from './env.js'

describe('web adapter', () => {
  it('converts a Request into an ApiRequest', async () => {
    const request = new Request('https://x.vercel.app/api/teacher/runs?id=abc', { method: 'DELETE', headers: { Authorization: 'Bearer t' } })
    expect(await toApiRequest(request)).toEqual({ method: 'DELETE', path: '/api/teacher/runs', headers: { authorization: 'Bearer t' }, query: { id: 'abc' }, body: '' })
  })

  it('returns JSON responses and empty 204s', async () => {
    const deps = { store: createMemoryStore(), password: 'dashboard', secret: 's', now: () => 1, wait: async () => undefined }
    const saved = await handleWeb(new Request('https://x/api/runs', { method: 'POST', body: JSON.stringify(validSnapshot) }), deps)
    expect(saved.status).toBe(204)
    expect(await saved.text()).toBe('')
    const denied = await handleWeb(new Request('https://x/api/teacher/runs'), deps)
    expect(denied.status).toBe(401)
    expect(denied.headers.get('content-type')).toBe('application/json')
    expect(await denied.json()).toEqual({ error: 'unauthorized' })
  })

  it('builds dependencies from env and leaves missing ones null', () => {
    expect(createEnvDeps({})).toMatchObject({ store: null, password: null, secret: null })
    const deps = createEnvDeps({ KV_REST_API_URL: 'https://r.upstash.io', KV_REST_API_TOKEN: 't', TEACHER_PASSWORD: 'dashboard', TEACHER_TOKEN_SECRET: 's' })
    expect(deps.store).not.toBeNull()
    expect(deps.password).toBe('dashboard')
  })
})
```

`server/functions.test.ts`:
```ts
import { POST as saveRun } from '../api/runs.js'
import { POST as login } from '../api/teacher/login.js'
import { DELETE as removeRun, GET as listRuns } from '../api/teacher/runs.js'

describe('Vercel functions', () => {
  it('load and answer 503 when env is missing', async () => {
    const env = { ...process.env }
    for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'TEACHER_PASSWORD', 'TEACHER_TOKEN_SECRET']) delete process.env[key]
    try {
      expect((await saveRun(new Request('https://x/api/runs', { method: 'POST', body: '{}' }))).status).toBe(503)
      expect((await login(new Request('https://x/api/teacher/login', { method: 'POST', body: '{"password":"x"}' }))).status).toBe(503)
      expect((await listRuns(new Request('https://x/api/teacher/runs'))).status).toBe(503)
      expect((await removeRun(new Request('https://x/api/teacher/runs?id=a', { method: 'DELETE' }))).status).toBe(503)
    } finally {
      process.env = env
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run server/web.test.ts server/functions.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`server/env.ts`:
```ts
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
```

`server/web.ts`:
```ts
import { handleApi, type ApiDeps, type ApiRequest, type ApiResponse } from './handlers.js'

export async function toApiRequest(request: Request): Promise<ApiRequest> {
  const url = new URL(request.url)
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })
  return {
    method: request.method.toUpperCase(),
    path: url.pathname,
    headers,
    query: Object.fromEntries(url.searchParams.entries()),
    body: request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text(),
  }
}

export function toWebResponse(response: ApiResponse): Response {
  if (response.body === undefined) return new Response(null, { status: response.status })
  return new Response(JSON.stringify(response.body), { status: response.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

export async function handleWeb(request: Request, deps: ApiDeps): Promise<Response> {
  return toWebResponse(await handleApi(await toApiRequest(request), deps))
}
```

`api/runs.ts`:
```ts
import { createEnvDeps } from '../server/env.js'
import { handleWeb } from '../server/web.js'

export function POST(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}
```

`api/teacher/login.ts`:
```ts
import { createEnvDeps } from '../../server/env.js'
import { handleWeb } from '../../server/web.js'

export function POST(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}
```

`api/teacher/runs.ts`:
```ts
import { createEnvDeps } from '../../server/env.js'
import { handleWeb } from '../../server/web.js'

export function GET(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}

export function DELETE(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run server && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add server api
git commit -m "feat(api): Vercel functions for runs and the teacher area"
```

### Task 7: Local API in Vite dev and preview

**Files:**
- Create: `server/devApi.ts`
- Modify: `vite.config.ts` (add plugin)
- Test: `server/devApi.test.ts`

**Interfaces:**
- Consumes: `handleApi`, `ApiDeps` (Task 5), `createMemoryStore` (Task 4).
- Produces: `devApi(deps?: ApiDeps): Plugin` (Vite plugin `agroblocks-dev-api`, registers the same middleware in `configureServer` and `configurePreviewServer`); `createApiMiddleware(deps: ApiDeps): (req: IncomingMessage, res: ServerResponse, next: () => void) => void`; default deps: memory store, password `process.env.TEACHER_PASSWORD ?? 'dashboard'`, secret `process.env.TEACHER_TOKEN_SECRET ?? 'agroblocks-dev-secret'`.

- [ ] **Step 1: Write the failing test**

`server/devApi.test.ts`:
```ts
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { validSnapshot } from '../src/shared/snapshotFixture.js'
import { createApiMiddleware, devApi } from './devApi.js'
import { createMemoryStore } from './store.js'

let server: Server
let base = ''

beforeAll(async () => {
  const middleware = createApiMiddleware({ store: createMemoryStore(), password: 'dashboard', secret: 's', now: () => Date.now(), wait: async () => undefined })
  server = createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 418
      res.end()
    }),
  )
  await new Promise<void>((resolve) => server.listen(0, resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

describe('dev API middleware', () => {
  it('serves the API end to end', async () => {
    expect((await fetch(`${base}/api/runs`, { method: 'POST', body: JSON.stringify(validSnapshot) })).status).toBe(204)
    const login = await fetch(`${base}/api/teacher/login`, { method: 'POST', body: JSON.stringify({ password: 'dashboard' }) })
    const { token } = (await login.json()) as { token: string }
    const runs = await fetch(`${base}/api/teacher/runs`, { headers: { authorization: `Bearer ${token}` } })
    expect(((await runs.json()) as { runs: unknown[] }).runs).toHaveLength(1)
  })

  it('passes other paths to the next middleware', async () => {
    expect((await fetch(`${base}/index.html`)).status).toBe(418)
  })

  it('is a vite plugin for dev and preview', () => {
    const plugin = devApi()
    expect(plugin.name).toBe('agroblocks-dev-api')
    expect(typeof plugin.configureServer).toBe('function')
    expect(typeof plugin.configurePreviewServer).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/devApi.test.ts`
Expected: FAIL — cannot resolve `./devApi.js`.

- [ ] **Step 3: Implement**

`server/devApi.ts`:
```ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleApi, type ApiDeps } from './handlers.js'
import { createMemoryStore } from './store.js'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function createApiMiddleware(deps: ApiDeps) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }
    void (async () => {
      const headers: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(req.headers)) headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value
      const response = await handleApi(
        { method: (req.method ?? 'GET').toUpperCase(), path: url.pathname, headers, query: Object.fromEntries(url.searchParams.entries()), body: await readBody(req) },
        deps,
      )
      res.statusCode = response.status
      if (response.body === undefined) {
        res.end()
        return
      }
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(response.body))
    })()
  }
}

export function devApi(deps?: ApiDeps): Plugin {
  const middleware = createApiMiddleware(
    deps ?? {
      store: createMemoryStore(),
      password: process.env.TEACHER_PASSWORD ?? 'dashboard',
      secret: process.env.TEACHER_TOKEN_SECRET ?? 'agroblocks-dev-secret',
      now: () => Date.now(),
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    },
  )
  return {
    name: 'agroblocks-dev-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
```

`vite.config.ts`: add `import { devApi } from './server/devApi'` and set `plugins: [react(), devApi()]`.

- [ ] **Step 4: Run tests, types and build**

Run: `npx vitest run server && npx tsc --noEmit -p . && npm run build`
Expected: PASS; tsc clean; build succeeds; `grep -l "agroblocks-dev-secret" dist/assets/*.js` prints nothing (the plugin is not part of the client bundle).

- [ ] **Step 5: Commit**

```bash
git add server vite.config.ts
git commit -m "feat(server): serve the API from Vite dev and preview with an in-memory store"
```
