import { assignStudent, createInitialSave, registerHint, storeProgram } from '@/game/progress/progression'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { createRunSync, PENDING_KEY } from '@/services/sync/runSync'

const refs = [{ id: 'm0-training', order: 0 }]
const registered = assignStudent(createInitialSave(refs, 'c'), { name: 'Ana Souza', school: 'Escola Azul' }, 'run-0001')

describe('createRunSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.removeItem(PENDING_KEY)
  })
  afterEach(() => vi.useRealTimers())

  it('waits 2 s of quiet and sends the latest save once', async () => {
    const send = vi.fn(async (_snapshot: RunSnapshot) => true)
    const sync = createRunSync({ send, storage: window.localStorage, now: () => 'now' })
    sync.schedule(registered)
    await vi.advanceTimersByTimeAsync(1500)
    const later = registerHint(registered, 'm0-training')
    sync.schedule(later)
    await vi.advanceTimersByTimeAsync(1999)
    expect(send).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].missions['m0-training'].hintsUsed).toBe(1)
  })

  it('ignores saves without a student', async () => {
    const send = vi.fn(async () => true)
    createRunSync({ send, storage: window.localStorage }).schedule(createInitialSave(refs, 'c'))
    await vi.advanceTimersByTimeAsync(3000)
    expect(send).not.toHaveBeenCalled()
  })

  it('marks a failed send as pending and clears it after a later success', async () => {
    const send = vi.fn(async () => false)
    const sync = createRunSync({ send, storage: window.localStorage })
    sync.schedule(registered)
    await vi.advanceTimersByTimeAsync(2000)
    expect(window.localStorage.getItem(PENDING_KEY)).toBe('run-0001')
    send.mockImplementation(async () => true)
    sync.resumePending(registered)
    await vi.advanceTimersByTimeAsync(0)
    expect(send).toHaveBeenCalledTimes(2)
    expect(window.localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('resumes a pending run after a reload', async () => {
    window.localStorage.setItem(PENDING_KEY, 'run-0001')
    const send = vi.fn(async () => true)
    createRunSync({ send, storage: window.localStorage }).resumePending(registered)
    await vi.advanceTimersByTimeAsync(0)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('never has two sends in flight and sends the newest state afterwards', async () => {
    let release: (value: boolean) => void = () => undefined
    const send = vi.fn((_snapshot: RunSnapshot) => new Promise<boolean>((resolve) => (release = resolve)))
    const sync = createRunSync({ send, storage: window.localStorage, delayMs: 10 })
    sync.schedule(registered)
    await vi.advanceTimersByTimeAsync(10)
    sync.schedule(registerHint(registered, 'm0-training'))
    await vi.advanceTimersByTimeAsync(10)
    expect(send).toHaveBeenCalledTimes(1)
    release(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[1][0].missions['m0-training'].hintsUsed).toBe(1)
  })

  it('swallows send errors', async () => {
    const send = vi.fn(async () => {
      throw new Error('offline')
    })
    const sync = createRunSync({ send, storage: window.localStorage })
    sync.schedule(registered)
    await vi.advanceTimersByTimeAsync(2000)
    expect(window.localStorage.getItem(PENDING_KEY)).toBe('run-0001')
  })

  it('does not restart the wait for changes that are not sent, like the program in edition', async () => {
    const send = vi.fn(async (_snapshot: RunSnapshot) => true)
    const sync = createRunSync({ send, storage: window.localStorage })
    sync.schedule(registered)
    for (let index = 0; index < 8; index += 1) {
      await vi.advanceTimersByTimeAsync(500)
      sync.schedule(storeProgram(registered, 'm0-training', `{"blocks":${index}}`))
    }
    expect(send).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(send).toHaveBeenCalledTimes(1)
  })
})
