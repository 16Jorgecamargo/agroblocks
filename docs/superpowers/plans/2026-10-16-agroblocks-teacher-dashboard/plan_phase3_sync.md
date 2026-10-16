# Phase 3 — Sync (Task 8)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 8: Snapshot conversion and debounced sync

**Files:**
- Create: `src/services/sync/toSnapshot.ts`, `src/services/sync/runSync.ts`, `src/app/RunSync.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/services/sync/toSnapshot.test.ts`, `src/services/sync/runSync.test.ts`, `src/app/RunSync.test.tsx`

**Interfaces:**
- Consumes: `SaveData` (Task 2), `RunSnapshot` (Task 1), `studentKeyOf` (Task 1), store actions `startRun` (Task 3).
- Produces:
  - `toSnapshot(save: SaveData, now: string): RunSnapshot | null` — `null` without `runId` or `student`; drops `savedProgram`
  - `PENDING_KEY = 'agroblocks:sync-pending:v1'`
  - `interface RunSync { schedule(save: SaveData): void; resumePending(save: SaveData): void; dispose(): void }`
  - `createRunSync(options: { send: (snapshot: RunSnapshot) => Promise<boolean>; storage: Storage | null; delayMs?: number; now?: () => string }): RunSync`
  - `sendRun(snapshot: RunSnapshot): Promise<boolean>` — `POST ${import.meta.env.BASE_URL}api/runs`, `true` on 2xx, `false` on any failure
  - `<RunSync />` (no UI) mounted in `App`

- [ ] **Step 1: Write the failing tests**

`src/services/sync/toSnapshot.test.ts`:
```ts
import { assignStudent, createInitialSave, storeProgram } from '@/game/progress/progression'
import { toSnapshot } from '@/services/sync/toSnapshot'

const refs = [{ id: 'm0-training', order: 0 }]

describe('toSnapshot', () => {
  it('needs a run and a student', () => {
    expect(toSnapshot(createInitialSave(refs, 'c'), 'u')).toBeNull()
  })

  it('copies the run, computes the key and drops the program in edition', () => {
    let save = assignStudent(createInitialSave(refs, '2026-10-16T10:00:00.000Z'), { name: 'José da Silva', school: 'Escola Azul' }, 'run-0001')
    save = storeProgram(save, 'm0-training', '{"blocks":{}}')
    const snapshot = toSnapshot(save, '2026-10-16T10:05:00.000Z')
    expect(snapshot).toMatchObject({
      runId: 'run-0001',
      studentKey: 'jose da silva|escola azul',
      createdAt: '2026-10-16T10:00:00.000Z',
      updatedAt: '2026-10-16T10:05:00.000Z',
      tutorial: null,
    })
    expect(snapshot?.missions['m0-training']).not.toHaveProperty('savedProgram')
  })
})
```

`src/services/sync/runSync.test.ts`:
```ts
import { assignStudent, createInitialSave, registerHint } from '@/game/progress/progression'
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
    const send = vi.fn(() => new Promise<boolean>((resolve) => (release = resolve)))
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
})
```

`src/app/RunSync.test.tsx`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/sync src/app/RunSync.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/services/sync/toSnapshot.ts`:
```ts
import type { SaveData } from '@/game/progress/types'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { studentKeyOf } from '@/shared/student'

export function toSnapshot(save: SaveData, now: string): RunSnapshot | null {
  if (!save.runId || !save.student) return null
  const missions: RunSnapshot['missions'] = {}
  for (const [id, progress] of Object.entries(save.missions)) {
    const { savedProgram: _dropped, ...rest } = progress
    missions[id] = rest
  }
  return {
    runId: save.runId,
    student: save.student,
    studentKey: studentKeyOf(save.student),
    createdAt: save.createdAt,
    updatedAt: now,
    tutorial: save.tutorial,
    missions,
    attempts: save.attempts,
    assessments: save.assessments,
  }
}
```
If `noUnusedLocals` flags `_dropped`, replace the destructuring with `missions[id] = { status: progress.status, attempts: progress.attempts, bestResult: progress.bestResult, hintsUsed: progress.hintsUsed, errorCounts: progress.errorCounts }`.

`src/services/sync/runSync.ts`:
```ts
import type { SaveData } from '@/game/progress/types'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { toSnapshot } from '@/services/sync/toSnapshot'

export const PENDING_KEY = 'agroblocks:sync-pending:v1'

export interface RunSync {
  schedule(save: SaveData): void
  resumePending(save: SaveData): void
  dispose(): void
}

interface RunSyncOptions {
  send: (snapshot: RunSnapshot) => Promise<boolean>
  storage: Storage | null
  delayMs?: number
  now?: () => string
}

function store(storage: Storage | null, action: (target: Storage) => void) {
  try {
    if (storage) action(storage)
  } catch {
    return
  }
}

export function createRunSync({ send, storage, delayMs = 2000, now = () => new Date().toISOString() }: RunSyncOptions): RunSync {
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let queued: SaveData | null = null

  const flush = async (save: SaveData) => {
    if (inFlight) {
      queued = save
      return
    }
    const snapshot = toSnapshot(save, now())
    if (!snapshot) return
    inFlight = true
    let ok = false
    try {
      ok = await send(snapshot)
    } catch {
      ok = false
    }
    inFlight = false
    store(storage, (target) => (ok ? target.removeItem(PENDING_KEY) : target.setItem(PENDING_KEY, snapshot.runId)))
    if (queued) {
      const next = queued
      queued = null
      await flush(next)
    }
  }

  const later = (save: SaveData, ms: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void flush(save)
    }, ms)
  }

  return {
    schedule: (save) => {
      if (save.runId && save.student) later(save, delayMs)
    },
    resumePending: (save) => {
      let pending: string | null = null
      store(storage, (target) => (pending = target.getItem(PENDING_KEY)))
      if (pending && save.runId && save.student) later(save, 0)
    },
    dispose: () => {
      if (timer) clearTimeout(timer)
      timer = null
    },
  }
}

export async function sendRun(snapshot: RunSnapshot): Promise<boolean> {
  try {
    const body = JSON.stringify(snapshot)
    const response = await fetch(`${import.meta.env.BASE_URL}api/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: body.length < 60_000,
    })
    return response.ok
  } catch {
    return false
  }
}
```
`keepalive` lets a send finish while the tab closes, but browsers cap keepalive bodies at 64 KB, so it is only set for smaller snapshots.

`src/app/RunSync.tsx`:
```tsx
import { useEffect } from 'react'
import { safeStorage } from '@/services/storage/jsonStorage'
import { createRunSync, sendRun } from '@/services/sync/runSync'
import { useProgressStore } from '@/stores/progressStore'

export function RunSync() {
  useEffect(() => {
    const sync = createRunSync({ send: sendRun, storage: safeStorage() })
    sync.resumePending(useProgressStore.getState().save)
    const unsubscribe = useProgressStore.subscribe((state, previous) => {
      if (state.save !== previous.save) sync.schedule(state.save)
    })
    const online = () => sync.resumePending(useProgressStore.getState().save)
    window.addEventListener('online', online)
    return () => {
      unsubscribe()
      window.removeEventListener('online', online)
      sync.dispose()
    }
  }, [])
  return null
}
```

`src/app/App.tsx`: import `RunSync` and render `<RunSync />` next to `<MusicPlayer />`.

- [ ] **Step 4: Run tests and suite**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/sync src/app
git commit -m "feat(sync): send each run to the server two seconds after it changes"
```
