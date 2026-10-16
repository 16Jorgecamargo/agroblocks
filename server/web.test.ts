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
