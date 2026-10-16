import { clearToken, deleteRun, fetchRuns, login, readToken, saveToken, TOKEN_KEY } from '@/services/teacher/teacherApi'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('teacher API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.removeItem(TOKEN_KEY)
  })

  it('logs in and maps failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { token: 't', expiresAt: 5 })))
    expect(await login('dashboard')).toEqual({ ok: true, token: 't', expiresAt: 5 })
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'wrong-password' })))
    expect(await login('x')).toEqual({ ok: false, reason: 'wrong-password' })
    vi.stubGlobal('fetch', vi.fn(async () => json(503, { error: 'not-configured' })))
    expect(await login('x')).toEqual({ ok: false, reason: 'not-configured' })
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))))
    expect(await login('x')).toEqual({ ok: false, reason: 'offline' })
  })

  it('sends the bearer token and maps 401', async () => {
    const fetchMock = vi.fn(async () => json(200, { runs: [] }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchRuns('t')).toEqual({ ok: true, runs: [] })
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toMatchObject({ authorization: 'Bearer t' })
    vi.stubGlobal('fetch', vi.fn(async () => json(401, {})))
    expect(await fetchRuns('t')).toEqual({ ok: false, reason: 'unauthorized' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    expect(await deleteRun('t', 'run 1')).toEqual({ ok: true })
  })

  it('keeps the token only until it expires', () => {
    saveToken('t', Date.now() + 1000)
    expect(readToken()).toBe('t')
    saveToken('t', Date.now() - 1)
    expect(readToken()).toBeNull()
    saveToken('t', Date.now() + 1000)
    clearToken()
    expect(readToken()).toBeNull()
  })
})
