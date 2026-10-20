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

  it('answers 400 to a run in the old single pre/post format', async () => {
    const old = { ...validSnapshot, assessments: { pre: null, post: null } }
    expect((await handleApi(request('POST', '/api/runs', { body: JSON.stringify(old) }), deps())).status).toBe(400)
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
