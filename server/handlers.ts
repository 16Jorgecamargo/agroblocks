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
