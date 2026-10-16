import { act, render } from '@testing-library/react'
import { RunSync } from '@/app/RunSync'
import { useProgressStore } from '@/stores/progressStore'

describe('RunSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useProgressStore.getState().resetProgress()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('posts the run to the API two seconds after a change', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<RunSync />)
    act(() => useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' }))
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/api\/runs$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body)).student).toEqual({ name: 'Ana Souza', school: 'Escola Azul' })
  })
})
