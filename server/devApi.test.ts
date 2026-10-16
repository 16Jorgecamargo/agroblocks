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
