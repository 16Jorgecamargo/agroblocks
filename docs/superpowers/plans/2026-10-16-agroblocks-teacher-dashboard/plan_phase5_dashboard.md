# Phase 5 — Teacher dashboard (Tasks 12–16)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 12: Teacher API client and password gate

**Files:**
- Create: `src/services/teacher/teacherApi.ts`, `src/features/dashboard/TeacherGate.tsx`
- Modify: `src/app/routes.tsx` (`/painel` → `<TeacherGate />`)
- Test: `src/services/teacher/teacherApi.test.ts`, `src/features/dashboard/TeacherGate.test.tsx`

**Interfaces:**
- Consumes: `RunSnapshot` (Task 1); `/api/teacher/*` contract (Task 5).
- Produces:
  - `TOKEN_KEY = 'agroblocks:teacher-token'`
  - `readToken(): string | null` (null when missing or expired), `saveToken(token: string, expiresAt: number): void`, `clearToken(): void` — `sessionStorage`, guarded with try/catch
  - `type Failure = 'unauthorized' | 'not-configured' | 'offline'`
  - `login(password: string): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; reason: 'wrong-password' | 'not-configured' | 'offline' }>`
  - `fetchRuns(token: string): Promise<{ ok: true; runs: RunSnapshot[] } | { ok: false; reason: Failure }>`
  - `deleteRun(token: string, runId: string): Promise<{ ok: true } | { ok: false; reason: Failure }>`
  - `TeacherGate()` — renders `PasswordDialog` until a token exists, then `<DashboardPage token onUnauthorized onLogout />` (DashboardPage props defined in Task 15; until then render a placeholder `<DashboardPage />` call compiled against Task 15's props — implement Task 12's gate with the final props and a temporary `DashboardPage` signature `({ token, onUnauthorized, onLogout }: { token: string; onUnauthorized: () => void; onLogout: () => void })` that ignores them)

- [ ] **Step 1: Write the failing tests**

`src/services/teacher/teacherApi.test.ts`:
```ts
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
```

`src/features/dashboard/TeacherGate.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TeacherGate } from '@/features/dashboard/TeacherGate'
import { TOKEN_KEY } from '@/services/teacher/teacherApi'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/painel']}>
      <Routes>
        <Route path="/" element={<p>inicio</p>} />
        <Route path="/painel" element={<TeacherGate />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeacherGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.removeItem(TOKEN_KEY)
  })

  it('asks for the password and refuses a wrong one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'wrong-password' })))
    renderGate()
    expect(screen.getByRole('dialog', { name: 'Senha do professor' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Senha incorreta.')).toBeInTheDocument()
  })

  it('opens the dashboard with the right password', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).endsWith('login') ? json(200, { token: 't', expiresAt: Date.now() + 60_000 }) : json(200, { runs: [] }))))
    renderGate()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'dashboard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Painel do professor' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Senha do professor' })).not.toBeInTheDocument()
  })

  it('explains a server without configuration and goes back home', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(503, { error: 'not-configured' })))
    renderGate()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'dashboard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Painel indisponível: servidor não configurado.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('inicio')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/teacher src/features/dashboard/TeacherGate.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/services/teacher/teacherApi.ts`:
```ts
import type { RunSnapshot } from '@/shared/runSnapshot'

export const TOKEN_KEY = 'agroblocks:teacher-token'

export type Failure = 'unauthorized' | 'not-configured' | 'offline'

const base = () => `${import.meta.env.BASE_URL}api/teacher`

function session(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function saveToken(token: string, expiresAt: number): void {
  try {
    session()?.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }))
  } catch {
    return
  }
}

export function clearToken(): void {
  try {
    session()?.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

export function readToken(): string | null {
  try {
    const raw = session()?.getItem(TOKEN_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as { token?: unknown; expiresAt?: unknown }
    if (typeof value.token !== 'string' || typeof value.expiresAt !== 'number' || value.expiresAt <= Date.now()) return null
    return value.token
  } catch {
    return null
  }
}

function failure(status: number): Failure {
  return status === 401 ? 'unauthorized' : status === 503 ? 'not-configured' : 'offline'
}

export async function login(password: string): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; reason: 'wrong-password' | 'not-configured' | 'offline' }> {
  try {
    const response = await fetch(`${base()}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) })
    if (response.status === 401) return { ok: false, reason: 'wrong-password' }
    if (!response.ok) return { ok: false, reason: response.status === 503 ? 'not-configured' : 'offline' }
    const body = (await response.json()) as { token: string; expiresAt: number }
    return { ok: true, token: body.token, expiresAt: body.expiresAt }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}

export async function fetchRuns(token: string): Promise<{ ok: true; runs: RunSnapshot[] } | { ok: false; reason: Failure }> {
  try {
    const response = await fetch(`${base()}/runs`, { headers: { authorization: `Bearer ${token}` } })
    if (!response.ok) return { ok: false, reason: failure(response.status) }
    return { ok: true, runs: ((await response.json()) as { runs: RunSnapshot[] }).runs }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}

export async function deleteRun(token: string, runId: string): Promise<{ ok: true } | { ok: false; reason: Failure }> {
  try {
    const response = await fetch(`${base()}/runs?id=${encodeURIComponent(runId)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
    return response.ok ? { ok: true } : { ok: false, reason: failure(response.status) }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}
```

`src/features/dashboard/TeacherGate.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { clearToken, login, readToken, saveToken } from '@/services/teacher/teacherApi'

const MESSAGES = {
  'wrong-password': 'Senha incorreta.',
  'not-configured': 'Painel indisponível: servidor não configurado.',
  offline: 'Sem conexão com o servidor.',
} as const

function PasswordDialog({ onToken }: { onToken: (token: string) => void }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!password || busy) return
    setBusy(true)
    const result = await login(password)
    setBusy(false)
    if (!result.ok) {
      setMessage(MESSAGES[result.reason])
      return
    }
    saveToken(result.token, result.expiresAt)
    onToken(result.token)
  }

  return (
    <div className="chrome-page">
      <GameDialog open title="Senha do professor" icon="lock" tone="info" onClose={() => navigate('/')}>
        <DialogSection>
          <form
            className="teacher-gate"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <label className="field">
              <span className="field__label">Senha</span>
              <input type="password" value={password} autoFocus autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
            </label>
            {message && (
              <p className="teacher-gate__error" role="alert">
                {message}
              </p>
            )}
            <div className="game-dialog__actions">
              <GameButton tone="secondary" icon="back" onClick={() => navigate('/')}>
                Voltar
              </GameButton>
              <GameButton tone="primary" type="submit" icon="lock" disabled={!password || busy}>
                Entrar
              </GameButton>
            </div>
          </form>
        </DialogSection>
      </GameDialog>
    </div>
  )
}

export function TeacherGate() {
  const [token, setToken] = useState<string | null>(() => readToken())
  const signOut = () => {
    clearToken()
    setToken(null)
  }
  if (!token) return <PasswordDialog onToken={setToken} />
  return <DashboardPage token={token} onUnauthorized={signOut} onLogout={signOut} />
}
```
Add to `src/features/dashboard/DashboardPage.css`:
```css
.teacher-gate {
  display: grid;
  gap: var(--space-3);
}

.teacher-gate__error {
  margin: 0;
  color: #b3261e;
  font-weight: 700;
}
```

Temporary until Task 15: change `DashboardPage`'s signature to `export function DashboardPage(_props: { token: string; onUnauthorized: () => void; onLogout: () => void })` and its `PageHeader` title to `"Painel do professor"`; if `noUnusedParameters` complains, destructure nothing and use `export function DashboardPage(props: DashboardPageProps)` with `void props`. Update `src/features/dashboard/DashboardPage.test.tsx` to render `<DashboardPage token="t" onUnauthorized={vi.fn()} onLogout={vi.fn()} />`.

`src/app/routes.tsx`: `{ path: '/painel', element: <TeacherGate /> }` with the import.

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/teacher src/features/dashboard src/app/routes.tsx
git commit -m "feat(dashboard): teacher API client and password gate"
```

### Task 13: Dashboard model

**Files:**
- Create: `src/features/dashboard/dashboardModel.ts`
- Test: `src/features/dashboard/dashboardModel.test.ts`

**Interfaces:**
- Consumes: `RunSnapshot`, `validSnapshot` (Task 1); `studentKeyOf`, `normalizeKey`, `TutorialRecord` (Task 1); `itemsForForm` (`@/data/assessment/items`); `ERROR_TEXT` (`@/game/rules/errors`); `MissionDefinition` (`@/game/missions/missionTypes`).
- Produces:
  - `interface DashboardFilters { school: string | null; search: string; from: string | null; to: string | null }` (`from`/`to` are `YYYY-MM-DD`, inclusive) and `EMPTY_FILTERS`
  - `scoreAssessment(response: RunSnapshot['assessments']['pre']): number | null` — correct answers 0–10; `null` when missing or skipped
  - `tutorialLabel(record: TutorialRecord | null, total = 15): string` — "Concluído" | "Pulado na etapa N de 15" | "Não terminado"
  - `interface StudentRow { key: string; name: string; school: string; runs: RunSnapshot[]; runCount: number; tutorial: TutorialRecord | null; completedPhases: number; attempts: number; hints: number; errors: number; pre: number | null; post: number | null; gain: number | null; lastSeen: string }`
  - `interface PhaseRow { missionId: string; title: string; completed: number; attemptsPerStudent: number; hintsPerStudent: number; stars: [number, number, number] }`
  - `interface DashboardModel { students: StudentRow[]; schools: string[]; summary: { students: number; schools: number; runs: number; avgCompletedPhases: number; attempts: number; hints: number; tutorial: { completed: number; skipped: number; unfinished: number }; avgPre: number | null; avgPost: number | null; avgGain: number | null }; phases: PhaseRow[]; topErrors: { code: string; label: string; count: number }[]; schoolScores: { school: string; pre: number | null; post: number | null }[] }`
  - `buildDashboard(runs: RunSnapshot[], missions: MissionDefinition[], filters: DashboardFilters): DashboardModel`

Rules: group by `studentKeyOf(run.student)`; runs newest first by `updatedAt`; displayed name/school from the newest run; `completedPhases` = max over runs of non-tutorial missions with status `completed`; `attempts`/`errors` (outcome ≠ `success`)/`hints` (sum of `missions[*].hintsUsed`) summed over runs; `tutorial` and `pre`/`post` from the newest run that has one (`pre`/`post` ignore skipped); `gain = post − pre` when both exist; `schools` lists every school in `runs` (unfiltered), sorted with `localeCompare('pt-BR')`; filters apply to runs before grouping; averages rounded to one decimal; `topErrors` top 6 by count with `ERROR_TEXT[code]?.message ?? code`; `phases` follow mission `order`; `stars` counts students by their best `bestResult.efficiencyStars` on that mission.

- [ ] **Step 1: Write the failing test**

`src/features/dashboard/dashboardModel.test.ts`:
```ts
import { itemsForForm } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS, scoreAssessment, tutorialLabel } from '@/features/dashboard/dashboardModel'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { validSnapshot } from '@/shared/snapshotFixture'

function answers(form: 'pre' | 'post', correct: number) {
  return Object.fromEntries(itemsForForm(form).map((item, index) => [item.id, index < correct ? item.correctIndex : item.correctIndex + 1]))
}

function run(overrides: Partial<RunSnapshot>): RunSnapshot {
  return { ...validSnapshot, ...overrides }
}

const failed = { ...validSnapshot.attempts[0], id: 'f', missionId: 'm1-first-harvest', outcome: 'error' as const, errorCode: 'HIT_OBSTACLE', efficiencyStars: null }

const runs: RunSnapshot[] = [
  run({
    runId: 'run-a1',
    student: { name: 'José da Silva', school: 'Escola Azul' },
    updatedAt: '2026-10-10T10:00:00.000Z',
    tutorial: { status: 'skipped', step: 3, at: 't' },
    attempts: [failed],
    assessments: { pre: { form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 4) }, post: null },
  }),
  run({
    runId: 'run-a2',
    student: { name: 'jose  da SILVA', school: 'escola azul' },
    updatedAt: '2026-10-12T10:00:00.000Z',
    tutorial: { status: 'completed', step: 15, at: 't' },
    missions: {
      ...validSnapshot.missions,
      'm1-first-harvest': { status: 'completed', attempts: 2, bestResult: { actions: 8, blocks: 8, usage: { seeds: 0, water: 0, energy: 8 }, efficiencyStars: 2 }, hintsUsed: 1, errorCounts: { HIT_OBSTACLE: 1 } },
    },
    assessments: { pre: null, post: { form: 'post', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('post', 9) } },
  }),
  run({ runId: 'run-b1', student: { name: 'Bia Lima', school: 'Escola Verde' }, updatedAt: '2026-10-11T10:00:00.000Z', tutorial: null }),
]

describe('dashboard model', () => {
  it('scores assessments and labels tutorial outcomes', () => {
    expect(scoreAssessment({ form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 7) })).toBe(7)
    expect(scoreAssessment({ form: 'pre', startedAt: 's', completedAt: 'c', skipped: true, answers: {} })).toBeNull()
    expect(scoreAssessment(null)).toBeNull()
    expect(tutorialLabel({ status: 'completed', step: 15, at: 't' })).toBe('Concluído')
    expect(tutorialLabel({ status: 'skipped', step: 3, at: 't' })).toBe('Pulado na etapa 3 de 15')
    expect(tutorialLabel(null)).toBe('Não terminado')
  })

  it('groups runs of the same student across accents, case and spaces', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.students).toHaveLength(2)
    const jose = model.students.find((row) => row.runCount === 2)
    expect(jose).toMatchObject({ name: 'jose da SILVA', school: 'escola azul', completedPhases: 1, attempts: 2, errors: 1, hints: 1, pre: 4, post: 9, gain: 5 })
    expect(jose?.tutorial?.status).toBe('completed')
    expect(jose?.runs.map((item) => item.runId)).toEqual(['run-a2', 'run-a1'])
  })

  it('summarizes, filters and lists schools', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.schools).toHaveLength(3)
    expect(model.schools).toContain('Escola Verde')
    expect(model.summary).toMatchObject({ students: 2, runs: 3, attempts: 2, tutorial: { completed: 1, skipped: 0, unfinished: 1 }, avgGain: 5 })
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, search: 'BIA' }).students.map((row) => row.name)).toEqual(['Bia Lima'])
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, school: 'Escola Verde' }).summary.students).toBe(1)
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, from: '2026-10-11', to: '2026-10-11' }).summary.runs).toBe(1)
  })

  it('computes phases, stars and the most common errors', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    const first = model.phases.find((row) => row.missionId === 'm1-first-harvest')
    expect(first).toMatchObject({ completed: 1, stars: [0, 1, 0] })
    expect(model.topErrors[0]).toMatchObject({ code: 'HIT_OBSTACLE', count: 1 })
    expect(model.topErrors[0].label).toMatch(/obstáculo|pedra|bateu/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/dashboardModel.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/features/dashboard/dashboardModel.ts`:
```ts
import { itemsForForm } from '@/data/assessment/items'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { normalizeKey, studentKeyOf, type TutorialRecord } from '@/shared/student'

export interface DashboardFilters {
  school: string | null
  search: string
  from: string | null
  to: string | null
}

export const EMPTY_FILTERS: DashboardFilters = { school: null, search: '', from: null, to: null }

export interface StudentRow {
  key: string
  name: string
  school: string
  runs: RunSnapshot[]
  runCount: number
  tutorial: TutorialRecord | null
  completedPhases: number
  attempts: number
  hints: number
  errors: number
  pre: number | null
  post: number | null
  gain: number | null
  lastSeen: string
}

export interface PhaseRow {
  missionId: string
  title: string
  completed: number
  attemptsPerStudent: number
  hintsPerStudent: number
  stars: [number, number, number]
}

export interface DashboardModel {
  students: StudentRow[]
  schools: string[]
  summary: {
    students: number
    schools: number
    runs: number
    avgCompletedPhases: number
    attempts: number
    hints: number
    tutorial: { completed: number; skipped: number; unfinished: number }
    avgPre: number | null
    avgPost: number | null
    avgGain: number | null
  }
  phases: PhaseRow[]
  topErrors: { code: string; label: string; count: number }[]
  schoolScores: { school: string; pre: number | null; post: number | null }[]
}

export function scoreAssessment(response: RunSnapshot['assessments']['pre']): number | null {
  if (!response || response.skipped) return null
  return itemsForForm(response.form).filter((item) => response.answers[item.id] === item.correctIndex).length
}

export function tutorialLabel(record: TutorialRecord | null, total = 15): string {
  if (!record) return 'Não terminado'
  return record.status === 'completed' ? 'Concluído' : `Pulado na etapa ${record.step} de ${total}`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function average(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null)
  return present.length === 0 ? null : round(present.reduce((sum, value) => sum + value, 0) / present.length)
}

function matches(run: RunSnapshot, filters: DashboardFilters): boolean {
  if (filters.school && run.student.school !== filters.school) return false
  if (filters.search && !normalizeKey(run.student.name).includes(normalizeKey(filters.search))) return false
  const day = run.updatedAt.slice(0, 10)
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  return true
}

function firstWith<T>(runs: RunSnapshot[], pick: (run: RunSnapshot) => T | null): T | null {
  for (const run of runs) {
    const value = pick(run)
    if (value !== null) return value
  }
  return null
}

function studentRow(key: string, runs: RunSnapshot[], phaseIds: Set<string>): StudentRow {
  const ordered = [...runs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const newest = ordered[0]
  const attempts = ordered.flatMap((run) => run.attempts)
  const pre = firstWith(ordered, (run) => scoreAssessment(run.assessments.pre))
  const post = firstWith(ordered, (run) => scoreAssessment(run.assessments.post))
  return {
    key,
    name: newest.student.name,
    school: newest.student.school,
    runs: ordered,
    runCount: ordered.length,
    tutorial: firstWith(ordered, (run) => run.tutorial),
    completedPhases: Math.max(...ordered.map((run) => Object.entries(run.missions).filter(([id, progress]) => phaseIds.has(id) && progress.status === 'completed').length)),
    attempts: attempts.length,
    hints: ordered.reduce((sum, run) => sum + Object.values(run.missions).reduce((inner, progress) => inner + progress.hintsUsed, 0), 0),
    errors: attempts.filter((attempt) => attempt.outcome !== 'success').length,
    pre,
    post,
    gain: pre !== null && post !== null ? post - pre : null,
    lastSeen: newest.updatedAt,
  }
}

export function buildDashboard(runs: RunSnapshot[], missions: MissionDefinition[], filters: DashboardFilters): DashboardModel {
  const schools = [...new Set(runs.map((run) => run.student.school))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const filtered = runs.filter((run) => matches(run, filters))
  const groups = new Map<string, RunSnapshot[]>()
  for (const run of filtered) {
    const key = studentKeyOf(run.student)
    groups.set(key, [...(groups.get(key) ?? []), run])
  }
  const phaseIds = new Set(missions.filter((mission) => !mission.tutorial).map((mission) => mission.id))
  const students = [...groups.entries()].map(([key, group]) => studentRow(key, group, phaseIds)).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
  const count = Math.max(1, students.length)

  const phases: PhaseRow[] = [...missions]
    .sort((a, b) => a.order - b.order)
    .map((mission) => {
      const stars: [number, number, number] = [0, 0, 0]
      let completed = 0
      let attempts = 0
      let hints = 0
      for (const student of students) {
        const progress = student.runs.map((run) => run.missions[mission.id]).filter((item) => item !== undefined)
        if (progress.some((item) => item.status === 'completed')) completed += 1
        attempts += student.runs.reduce((sum, run) => sum + run.attempts.filter((attempt) => attempt.missionId === mission.id).length, 0)
        hints += progress.reduce((sum, item) => sum + item.hintsUsed, 0)
        const best = Math.max(0, ...progress.map((item) => item.bestResult?.efficiencyStars ?? 0))
        if (best > 0) stars[best - 1] += 1
      }
      return { missionId: mission.id, title: mission.title, completed, attemptsPerStudent: round(attempts / count), hintsPerStudent: round(hints / count), stars }
    })

  const errorCounts = new Map<string, number>()
  for (const run of filtered) for (const attempt of run.attempts) if (attempt.errorCode) errorCounts.set(attempt.errorCode, (errorCounts.get(attempt.errorCode) ?? 0) + 1)
  const topErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, total]) => ({ code, label: ERROR_TEXT[code as keyof typeof ERROR_TEXT]?.message ?? code, count: total }))

  const bySchool = new Map<string, StudentRow[]>()
  for (const student of students) bySchool.set(student.school, [...(bySchool.get(student.school) ?? []), student])

  return {
    students,
    schools,
    summary: {
      students: students.length,
      schools: bySchool.size,
      runs: filtered.length,
      avgCompletedPhases: round(students.reduce((sum, student) => sum + student.completedPhases, 0) / count),
      attempts: students.reduce((sum, student) => sum + student.attempts, 0),
      hints: students.reduce((sum, student) => sum + student.hints, 0),
      tutorial: {
        completed: students.filter((student) => student.tutorial?.status === 'completed').length,
        skipped: students.filter((student) => student.tutorial?.status === 'skipped').length,
        unfinished: students.filter((student) => student.tutorial === null).length,
      },
      avgPre: average(students.map((student) => student.pre)),
      avgPost: average(students.map((student) => student.post)),
      avgGain: average(students.map((student) => student.gain)),
    },
    phases,
    topErrors,
    schoolScores: [...bySchool.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
      .map(([school, group]) => ({ school, pre: average(group.map((student) => student.pre)), post: average(group.map((student) => student.post)) })),
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/dashboard/dashboardModel.test.ts && npx tsc --noEmit -p .`
Expected: PASS (4 tests); tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/dashboardModel.ts src/features/dashboard/dashboardModel.test.ts
git commit -m "feat(dashboard): model grouping runs by student with filters and statistics"
```

### Task 14: Demo runs and CSV exports; remove the local dashboard code

**Files:**
- Create: `src/features/dashboard/demoRuns.ts`, `src/features/dashboard/dashboardCsv.ts`
- Delete: `src/features/dashboard/demoData.ts`, `src/features/dashboard/dashboardStats.ts`, `src/features/dashboard/dashboardStats.test.ts`
- Modify: `src/services/export/csv.ts` (keep only `toCsv` and `downloadText`), `src/services/export/csv.test.ts` (keep only `toCsv` tests)
- Test: `src/features/dashboard/demoRuns.test.ts`, `src/features/dashboard/dashboardCsv.test.ts`

**Interfaces:**
- Consumes: `buildDashboard`, `StudentRow`, `tutorialLabel`, `scoreAssessment` (Task 13); `toCsv` (existing); `runSnapshotSchema` (Task 1).
- Produces:
  - `createDemoRuns(missions: MissionDefinition[]): RunSnapshot[]` — 8 runs, 7 students, 3 schools, deterministic, all valid against `runSnapshotSchema`
  - `studentsCsv(rows: StudentRow[]): string` — headers `nome;escola;jogadas;tutorial;fases_concluidas;tentativas;dicas;erros;pre;pos;ganho;ultimo_acesso`
  - `attemptsCsv(rows: StudentRow[], missions: MissionDefinition[]): string` — headers `nome;escola;jogada;missao;fase;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;dicas;eficiencia;pseudocodigo`
  - `assessmentsCsv(rows: StudentRow[]): string` — headers `nome;escola;jogada;forma;item;conceito;resposta;correta` (skipped forms produce one row with `item` empty and `correta` = `pulado`)

The temporary `DashboardPage` from Task 12 imports `computeDashboard`, `createDemoSave` and the old CSV functions; in this task replace its body with a minimal placeholder so the build stays green until Task 15:
```tsx
export function DashboardPage(props: DashboardPageProps) {
  void props
  return (
    <div className="chrome-page">
      <PageHeader title="Painel do professor" backTo="/" />
    </div>
  )
}
```
and delete `DashboardPage.test.tsx` tests that asserted the old local panel (Task 15 writes the new ones).

- [ ] **Step 1: Write the failing tests**

`src/features/dashboard/demoRuns.test.ts`:
```ts
import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { runSnapshotSchema } from '@/shared/runSnapshot'

describe('demo runs', () => {
  it('are valid snapshots of seven students in three schools', () => {
    const runs = createDemoRuns(MISSIONS)
    expect(runs).toHaveLength(8)
    for (const run of runs) expect(runSnapshotSchema.safeParse(run).success).toBe(true)
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.summary.students).toBe(7)
    expect(model.schools).toHaveLength(3)
    expect(model.summary.tutorial.completed).toBeGreaterThan(0)
    expect(model.summary.tutorial.skipped).toBeGreaterThan(0)
    expect(model.summary.avgGain).not.toBeNull()
  })
})
```

`src/features/dashboard/dashboardCsv.test.ts`:
```ts
import { MISSIONS } from '@/data/missions'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'

const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students

describe('dashboard CSV', () => {
  it('exports one line per student', () => {
    const lines = studentsCsv(rows).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe('nome;escola;jogadas;tutorial;fases_concluidas;tentativas;dicas;erros;pre;pos;ganho;ultimo_acesso')
    expect(lines).toHaveLength(rows.length + 1)
  })

  it('exports every attempt with the student and run', () => {
    const lines = attemptsCsv(rows, MISSIONS).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe('nome;escola;jogada;missao;fase;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;dicas;eficiencia;pseudocodigo')
    expect(lines.length - 1).toBe(rows.reduce((sum, row) => sum + row.attempts, 0))
  })

  it('exports assessment answers with correctness', () => {
    const csv = assessmentsCsv(rows)
    expect(csv).toContain('nome;escola;jogada;forma;item;conceito;resposta;correta')
    expect(csv).toMatch(/;sim\r\n|;nao\r\n/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/dashboard/demoRuns.test.ts src/features/dashboard/dashboardCsv.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/features/dashboard/demoRuns.ts`:
```ts
import { itemsForForm } from '@/data/assessment/items'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { studentKeyOf } from '@/shared/student'

const PEOPLE = [
  { name: 'Ana Souza', school: 'E.E. Monteiro Lobato', reached: 6, pre: 4, post: 8, tutorial: 'completed' },
  { name: 'Bruno Lima', school: 'E.E. Monteiro Lobato', reached: 4, pre: 3, post: 6, tutorial: 'completed' },
  { name: 'Carla Mendes', school: 'E.E. Monteiro Lobato', reached: 2, pre: 5, post: null, tutorial: 'skipped' },
  { name: 'Diego Rocha', school: 'Colégio Estadual Rio Verde', reached: 5, pre: 2, post: 7, tutorial: 'completed' },
  { name: 'Eduarda Alves', school: 'Colégio Estadual Rio Verde', reached: 3, pre: 6, post: 7, tutorial: null },
  { name: 'Felipe Costa', school: 'Escola Técnica Agrícola', reached: 6, pre: 7, post: 10, tutorial: 'completed' },
  { name: 'Gabriela Nunes', school: 'Escola Técnica Agrícola', reached: 1, pre: null, post: null, tutorial: 'skipped' },
] as const

const ERRORS = ['HIT_OBSTACLE', 'PLOT_OCCUPIED', 'WATER_WASTED', 'PLANT_NOT_MATURE', 'NO_WATER']

function answers(form: 'pre' | 'post', correct: number): Record<string, number> {
  return Object.fromEntries(itemsForForm(form).map((item, index) => [item.id, index < correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
}

function demoRun(person: (typeof PEOPLE)[number], index: number, missions: MissionDefinition[], runIndex: number): RunSnapshot {
  const ordered = [...missions].sort((a, b) => a.order - b.order)
  const day = String(10 + index).padStart(2, '0')
  const at = (hour: number) => `2026-09-${day}T${String(8 + hour).padStart(2, '0')}:00:00.000Z`
  const attempts: RunSnapshot['attempts'] = []
  const progress: RunSnapshot['missions'] = {}
  ordered.forEach((mission, position) => {
    const done = position <= person.reached
    const failures = done ? (index + position) % 3 : 1
    for (let attempt = 0; attempt < failures; attempt += 1) {
      attempts.push({
        id: `demo-${index}-${runIndex}-${mission.id}-${attempt}`,
        missionId: mission.id,
        attemptNumber: attempt + 1,
        timestamp: at(position),
        outcome: 'error',
        errorCode: ERRORS[(index + position + attempt) % ERRORS.length],
        actions: 4 + attempt,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 4 },
        hintsUsed: position % 2,
        efficiencyStars: null,
        pseudocode: 'quando executar:\n    mover para frente\n    mover para frente',
      })
    }
    const stars = (((index + position) % 3) + 1) as 1 | 2 | 3
    if (done) {
      attempts.push({
        id: `demo-${index}-${runIndex}-${mission.id}-ok`,
        missionId: mission.id,
        attemptNumber: failures + 1,
        timestamp: at(position),
        outcome: 'success',
        errorCode: null,
        actions: 6,
        blocks: 5,
        usage: { seeds: 1, water: 1, energy: 6 },
        hintsUsed: position % 2,
        efficiencyStars: stars,
        pseudocode: 'quando executar:\n    mover para frente\n    colher planta',
      })
    }
    progress[mission.id] = {
      status: done ? 'completed' : position === person.reached + 1 ? 'available' : 'locked',
      attempts: failures + (done ? 1 : 0),
      bestResult: done ? { actions: 6, blocks: 5, usage: { seeds: 1, water: 1, energy: 6 }, efficiencyStars: stars } : null,
      hintsUsed: position % 2,
      errorCounts: {},
    }
  })
  const response = (form: 'pre' | 'post', correct: number | null) =>
    correct === null ? null : { form, startedAt: at(0), completedAt: at(0), skipped: false, answers: answers(form, correct) }
  return {
    runId: `demo-run-${index}-${runIndex}`,
    student: { name: person.name, school: person.school },
    studentKey: studentKeyOf(person),
    createdAt: at(0),
    updatedAt: at(9 + runIndex),
    tutorial: person.tutorial ? { status: person.tutorial, step: person.tutorial === 'completed' ? 15 : 3 + index, at: at(1) } : null,
    missions: progress,
    attempts,
    assessments: { pre: response('pre', person.pre), post: response('post', person.post) },
  }
}

export function createDemoRuns(missions: MissionDefinition[]): RunSnapshot[] {
  const runs = PEOPLE.map((person, index) => demoRun(person, index, missions, 0))
  runs.push(demoRun({ ...PEOPLE[1], reached: 1, post: null, tutorial: 'skipped' }, 1, missions, 1))
  return runs
}
```
If `tutorial: 'skipped'` step exceeds 15 (`3 + index` stays ≤ 9), fine. If TypeScript narrows `PEOPLE[1]` spread types, annotate `PEOPLE` as `readonly { name: string; school: string; reached: number; pre: number | null; post: number | null; tutorial: 'completed' | 'skipped' | null }[]` instead of `as const`.

`src/features/dashboard/dashboardCsv.ts`:
```ts
import { itemsForForm } from '@/data/assessment/items'
import { ASSESSMENT_CONCEPT_LABELS } from '@/game/assessment/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { toCsv } from '@/services/export/csv'

const OUTCOME = { success: 'sucesso', objectiveFailed: 'objetivo_nao_cumprido', error: 'erro' } as const

export function studentsCsv(rows: StudentRow[]): string {
  return toCsv(
    ['nome', 'escola', 'jogadas', 'tutorial', 'fases_concluidas', 'tentativas', 'dicas', 'erros', 'pre', 'pos', 'ganho', 'ultimo_acesso'],
    rows.map((row) => [row.name, row.school, row.runCount, tutorialLabel(row.tutorial), row.completedPhases, row.attempts, row.hints, row.errors, row.pre, row.post, row.gain, row.lastSeen]),
  )
}

export function attemptsCsv(rows: StudentRow[], missions: MissionDefinition[]): string {
  const byId = new Map(missions.map((mission) => [mission.id, mission]))
  return toCsv(
    ['nome', 'escola', 'jogada', 'missao', 'fase', 'tentativa', 'data_hora', 'resultado', 'codigo_erro', 'comandos', 'blocos', 'dicas', 'eficiencia', 'pseudocodigo'],
    rows.flatMap((row) =>
      row.runs.flatMap((run) =>
        run.attempts.map((attempt) => [
          row.name,
          row.school,
          run.runId,
          attempt.missionId,
          byId.get(attempt.missionId)?.order ?? null,
          attempt.attemptNumber,
          attempt.timestamp,
          OUTCOME[attempt.outcome],
          attempt.errorCode,
          attempt.actions,
          attempt.blocks,
          attempt.hintsUsed,
          attempt.efficiencyStars,
          attempt.pseudocode,
        ]),
      ),
    ),
  )
}

export function assessmentsCsv(rows: StudentRow[]): string {
  const lines: (string | number | null)[][] = []
  for (const row of rows) {
    for (const run of row.runs) {
      for (const response of [run.assessments.pre, run.assessments.post]) {
        if (!response) continue
        if (response.skipped) {
          lines.push([row.name, row.school, run.runId, response.form, null, null, null, 'pulado'])
          continue
        }
        for (const item of itemsForForm(response.form)) {
          const answer = response.answers[item.id]
          lines.push([row.name, row.school, run.runId, response.form, item.id, ASSESSMENT_CONCEPT_LABELS[item.concept], answer ?? null, answer === item.correctIndex ? 'sim' : 'nao'])
        }
      }
    }
  }
  return toCsv(['nome', 'escola', 'jogada', 'forma', 'item', 'conceito', 'resposta', 'correta'], lines)
}
```

`src/services/export/csv.ts`: delete `OUTCOME_LABELS`, `attemptsCsv`, `missionsCsv`, `assessmentCsv` and the now-unused imports; keep `toCsv` and `downloadText`. In `csv.test.ts` delete the tests of the removed functions and keep the `toCsv` ones.

Delete `demoData.ts`, `dashboardStats.ts`, `dashboardStats.test.ts`; apply the `DashboardPage` placeholder above.

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add -A src/features/dashboard src/services/export
git commit -m "feat(dashboard): demo runs and CSV exports over all students"
```

### Task 15: Dashboard page

**Files:**
- Modify: `src/features/dashboard/DashboardPage.tsx` (rewrite), `src/features/dashboard/DashboardPage.css` (rewrite keeping `.bar-chart*` and `.teacher-gate*` rules)
- Create: `src/features/dashboard/StudentTable.tsx`
- Test: `src/features/dashboard/DashboardPage.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `fetchRuns`, `deleteRun` (Task 12); `buildDashboard`, `EMPTY_FILTERS`, `DashboardFilters`, `StudentRow`, `tutorialLabel` (Task 13); `createDemoRuns`, `studentsCsv`, `attemptsCsv`, `assessmentsCsv` (Task 14); `downloadText`; `BarChart`; `MISSIONS`.
- Produces:
  - `DashboardPage({ token, onUnauthorized, onLogout }: { token: string; onUnauthorized: () => void; onLogout: () => void })`
  - `type SortKey = 'name' | 'school' | 'runCount' | 'tutorial' | 'completedPhases' | 'attempts' | 'hints' | 'errors' | 'pre' | 'post' | 'gain' | 'lastSeen'`
  - `sortStudents(rows: StudentRow[], key: SortKey, direction: 'asc' | 'desc'): StudentRow[]` (nulls last in both directions)
  - `StudentTable({ rows, onOpen }: { rows: StudentRow[]; onOpen: (row: StudentRow) => void })` — caption "Alunos", sortable headers are `<button>`s inside `<th aria-sort>`; each row has a "Ver detalhes de <nome>" button

Page layout (spec §5): `PageHeader` title "Painel do professor", subtitle "Todos os alunos que jogaram." and actions **Atualizar**, **Demonstração** (toggle; when on shows `DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado`), **Exportar CSV** (downloads `agroblocks_alunos_<data>.csv`, `agroblocks_tentativas_<data>.csv`, `agroblocks_avaliacoes_<data>.csv` of the filtered rows; disabled with no rows), **Sair** (calls `onLogout`). Filters: select "Escola" ("Todas as escolas" + `model.schools`), search "Buscar aluno", dates "De" / "Até", button "Limpar filtros". Summary cards (`role="group"` with `aria-label` equal to the visible title): "Alunos", "Escolas", "Jogadas", "Fases concluídas (média)", "Tentativas", "Dicas", "Tutorial" (`<concluíram> concluíram · <pularam> pularam · <não terminaram> não terminaram`), "Avaliação pré × pós" (`<pre> → <post> (ganho <gain>)` with "—" for null). Charts: "Conclusão por fase", "Tentativas e dicas por fase", "Erros mais comuns", "Pré × pós por escola", "Estrelas por fase". States: "Carregando dados…" (`role="status"`), error card with "Tentar de novo", empty card "Nenhum aluno enviou dados ainda.". A 401 from the server calls `onUnauthorized`.

- [ ] **Step 1: Write the failing tests**

`src/features/dashboard/DashboardPage.test.tsx`:
```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MISSIONS } from '@/data/missions'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { sortStudents } from '@/features/dashboard/StudentTable'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function renderPage(onUnauthorized = vi.fn()) {
  render(
    <MemoryRouter>
      <DashboardPage token="t" onUnauthorized={onUnauthorized} onLogout={vi.fn()} />
    </MemoryRouter>,
  )
  return { onUnauthorized }
}

describe('DashboardPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the empty state when nobody sent data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    renderPage()
    expect(await screen.findByText('Nenhum aluno enviou dados ainda.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
  })

  it('lists students from the server with summary and tutorial column', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    const table = await screen.findByRole('table', { name: 'Alunos' })
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(screen.getByRole('group', { name: 'Alunos' })).toHaveTextContent('7')
    expect(within(table).getByText('Ana Souza').closest('tr')).toHaveTextContent('Concluído')
  })

  it('filters by school and search', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.change(screen.getByLabelText('Escola'), { target: { value: 'Escola Técnica Agrícola' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(3)
    fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'felipe' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(8)
  })

  it('sorts by a column when its header is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    const table = await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.click(within(table).getByRole('button', { name: 'Nome' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ana Souza')
    fireEvent.click(within(table).getByRole('button', { name: 'Nome' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Gabriela Nunes')
  })

  it('keeps null scores last whatever the direction', () => {
    const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students
    expect(sortStudents(rows, 'post', 'asc').at(-1)?.post).toBeNull()
    expect(sortStudents(rows, 'post', 'desc').at(-1)?.post).toBeNull()
  })

  it('switches to clearly labelled demo data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    renderPage()
    await screen.findByText('Nenhum aluno enviou dados ainda.')
    fireEvent.click(screen.getByRole('button', { name: 'Demonstração' }))
    expect(screen.getByText('DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Alunos' })).toBeInTheDocument()
  })

  it('asks for the password again when the token is refused', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'unauthorized' })))
    const { onUnauthorized } = renderPage()
    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1))
  })

  it('offers a retry when the server is unreachable', async () => {
    const fetchMock = vi.fn(async () => Promise.reject(new TypeError('offline')))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/dashboard/DashboardPage.test.tsx`
Expected: FAIL — placeholder page has no table / `StudentTable` module missing.

- [ ] **Step 3: Implement**

`src/features/dashboard/StudentTable.tsx`:
```tsx
import { useState } from 'react'
import { tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'

export type SortKey = 'name' | 'school' | 'runCount' | 'tutorial' | 'completedPhases' | 'attempts' | 'hints' | 'errors' | 'pre' | 'post' | 'gain' | 'lastSeen'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'school', label: 'Escola' },
  { key: 'runCount', label: 'Jogadas' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'completedPhases', label: 'Fases' },
  { key: 'attempts', label: 'Tentativas' },
  { key: 'hints', label: 'Dicas' },
  { key: 'errors', label: 'Erros' },
  { key: 'pre', label: 'Pré' },
  { key: 'post', label: 'Pós' },
  { key: 'gain', label: 'Ganho' },
  { key: 'lastSeen', label: 'Último acesso' },
]

function value(row: StudentRow, key: SortKey): string | number | null {
  if (key === 'tutorial') return tutorialLabel(row.tutorial)
  return row[key]
}

export function sortStudents(rows: StudentRow[], key: SortKey, direction: 'asc' | 'desc'): StudentRow[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = value(a, key)
    const right = value(b, key)
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
    return String(left).localeCompare(String(right), 'pt-BR') * factor
  })
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const show = (score: number | null) => (score === null ? '—' : String(score))

export function StudentTable({ rows, onOpen }: { rows: StudentRow[]; onOpen: (row: StudentRow) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'lastSeen', direction: 'desc' })
  const sorted = sortStudents(rows, sort.key, sort.direction)
  const toggle = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  return (
    <div className="card dashboard__table-wrap">
      <table className="dashboard__table">
        <caption>Alunos</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="dashboard__sort" onClick={() => toggle(column.key)}>
                  {column.label}
                </button>
              </th>
            ))}
            <th scope="col">
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.name}</th>
              <td>{row.school}</td>
              <td>{row.runCount}</td>
              <td>{tutorialLabel(row.tutorial)}</td>
              <td>{row.completedPhases}</td>
              <td>{row.attempts}</td>
              <td>{row.hints}</td>
              <td>{row.errors}</td>
              <td>{show(row.pre)}</td>
              <td>{show(row.post)}</td>
              <td>{row.gain === null ? '—' : row.gain > 0 ? `+${row.gain}` : String(row.gain)}</td>
              <td>{formatDate(row.lastSeen)}</td>
              <td>
                <button type="button" className="button" onClick={() => onOpen(row)} aria-label={`Ver detalhes de ${row.name}`}>
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```
Note: the header row counts in `getAllByRole('row')`, so 7 students → 8 rows.

`src/features/dashboard/DashboardPage.tsx`:
```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { BarChart } from '@/features/dashboard/BarChart'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS, type DashboardFilters, type StudentRow } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { StudentDetail } from '@/features/dashboard/StudentDetail'
import { StudentTable } from '@/features/dashboard/StudentTable'
import { downloadText } from '@/services/export/csv'
import { deleteRun, fetchRuns } from '@/services/teacher/teacherApi'
import type { RunSnapshot } from '@/shared/runSnapshot'
import './DashboardPage.css'

interface DashboardPageProps {
  token: string
  onUnauthorized: () => void
  onLogout: () => void
}

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; runs: RunSnapshot[] }

const dash = (value: number | null) => (value === null ? '—' : String(value))

export function DashboardPage({ token, onUnauthorized, onLogout }: DashboardPageProps) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [demo, setDemo] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const demoRuns = useMemo(() => createDemoRuns(MISSIONS), [])

  const refresh = useCallback(async () => {
    setLoad({ state: 'loading' })
    const result = await fetchRuns(token)
    if (result.ok) {
      setLoad({ state: 'ready', runs: result.runs })
      return
    }
    if (result.reason === 'unauthorized') {
      onUnauthorized()
      return
    }
    setLoad({ state: 'error' })
  }, [token, onUnauthorized])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const runs = demo ? demoRuns : load.state === 'ready' ? load.runs : []
  const model = useMemo(() => buildDashboard(runs, MISSIONS, filters), [runs, filters])
  const open = model.students.find((row) => row.key === openKey) ?? null
  const stamp = new Date().toISOString().slice(0, 10)

  const exportAll = () => {
    downloadText(`agroblocks_alunos_${stamp}.csv`, studentsCsv(model.students))
    downloadText(`agroblocks_tentativas_${stamp}.csv`, attemptsCsv(model.students, MISSIONS))
    downloadText(`agroblocks_avaliacoes_${stamp}.csv`, assessmentsCsv(model.students))
  }

  const removeRun = async (runId: string) => {
    if (demo) return
    const result = await deleteRun(token, runId)
    if (!result.ok && result.reason === 'unauthorized') {
      onUnauthorized()
      return
    }
    await refresh()
  }

  const phaseMax = Math.max(1, ...model.phases.map((row) => Math.max(row.attemptsPerStudent, row.hintsPerStudent)))
  const showData = demo || (load.state === 'ready' && load.runs.length > 0)

  return (
    <div className="chrome-page">
      <PageHeader
        title="Painel do professor"
        subtitle="Todos os alunos que jogaram."
        backTo="/"
        actions={
          <div className="dashboard__actions">
            <button type="button" className="button" onClick={() => void refresh()} disabled={demo}>
              Atualizar
            </button>
            <button type="button" className="button" aria-pressed={demo} onClick={() => setDemo((value) => !value)}>
              Demonstração
            </button>
            <button type="button" className="button button--primary" onClick={exportAll} disabled={model.students.length === 0}>
              Exportar CSV
            </button>
            <button type="button" className="button button--ghost" onClick={onLogout}>
              Sair
            </button>
          </div>
        }
      />
      <main className="dashboard">
        {demo && <p className="dashboard__demo">DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado</p>}
        {!demo && load.state === 'loading' && (
          <p className="card" role="status">
            Carregando dados…
          </p>
        )}
        {!demo && load.state === 'error' && (
          <section className="card dashboard__empty">
            <h2>Não foi possível carregar os dados.</h2>
            <button type="button" className="button" onClick={() => void refresh()}>
              Tentar de novo
            </button>
          </section>
        )}
        {!demo && load.state === 'ready' && load.runs.length === 0 && (
          <section className="card dashboard__empty">
            <h2>Nenhum aluno enviou dados ainda.</h2>
            <p>Os alunos aparecem aqui assim que se cadastram e começam a jogar.</p>
          </section>
        )}
        {showData && (
          <>
            <section className="card dashboard__filters" aria-label="Filtros">
              <label className="field">
                <span className="field__label">Escola</span>
                <select value={filters.school ?? ''} onChange={(event) => setFilters({ ...filters, school: event.target.value || null })}>
                  <option value="">Todas as escolas</option>
                  {model.schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Buscar aluno</span>
                <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">De</span>
                <input type="date" value={filters.from ?? ''} onChange={(event) => setFilters({ ...filters, from: event.target.value || null })} />
              </label>
              <label className="field">
                <span className="field__label">Até</span>
                <input type="date" value={filters.to ?? ''} onChange={(event) => setFilters({ ...filters, to: event.target.value || null })} />
              </label>
              <button type="button" className="button" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpar filtros
              </button>
            </section>

            <section className="dashboard__cards" aria-label="Resumo">
              {[
                ['Alunos', String(model.summary.students)],
                ['Escolas', String(model.summary.schools)],
                ['Jogadas', String(model.summary.runs)],
                ['Fases concluídas (média)', `${model.summary.avgCompletedPhases} de ${model.phases.length - 1}`],
                ['Tentativas', String(model.summary.attempts)],
                ['Dicas', String(model.summary.hints)],
                ['Tutorial', `${model.summary.tutorial.completed} concluíram · ${model.summary.tutorial.skipped} pularam · ${model.summary.tutorial.unfinished} não terminaram`],
                ['Avaliação pré × pós', `${dash(model.summary.avgPre)} → ${dash(model.summary.avgPost)} (ganho ${dash(model.summary.avgGain)})`],
              ].map(([label, text]) => (
                <div key={label} className="card dashboard__metric" role="group" aria-label={label}>
                  <span>{label}</span>
                  <strong>{text}</strong>
                </div>
              ))}
            </section>

            <section className="dashboard__charts">
              <div className="card">
                <BarChart
                  title="Conclusão por fase"
                  description="Quantos alunos concluíram cada fase."
                  series={model.phases.map((row) => ({ label: row.title, values: [{ name: 'alunos', value: row.completed, tone: 'primary' }] }))}
                  max={Math.max(1, model.summary.students)}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Tentativas e dicas por fase"
                  description="Média por aluno de tentativas e dicas em cada fase."
                  series={model.phases.map((row) => ({
                    label: row.title,
                    values: [
                      { name: 'tentativas', value: row.attemptsPerStudent, tone: 'primary' },
                      { name: 'dicas', value: row.hintsPerStudent, tone: 'secondary' },
                    ],
                  }))}
                  max={phaseMax}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Erros mais comuns"
                  description="Os erros que mais interromperam os programas."
                  series={model.topErrors.map((error) => ({ label: error.label, values: [{ name: 'ocorrências', value: error.count, tone: 'secondary' }] }))}
                  max={Math.max(1, ...model.topErrors.map((error) => error.count))}
                />
                {model.topErrors.length === 0 && <p>Nenhum erro registrado.</p>}
              </div>
              <div className="card">
                <BarChart
                  title="Pré × pós por escola"
                  description="Média de acertos (0 a 10) no pré-teste e no pós-teste."
                  series={model.schoolScores.map((row) => ({
                    label: row.school,
                    values: [
                      { name: 'pré', value: row.pre, tone: 'secondary' },
                      { name: 'pós', value: row.post, tone: 'primary' },
                    ],
                  }))}
                  max={10}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Estrelas por fase"
                  description="Quantos alunos ganharam 1, 2 ou 3 estrelas de eficiência."
                  series={model.phases.map((row) => ({
                    label: row.title,
                    values: [
                      { name: '1 estrela', value: row.stars[0], tone: 'secondary' },
                      { name: '2 estrelas', value: row.stars[1], tone: 'secondary' },
                      { name: '3 estrelas', value: row.stars[2], tone: 'primary' },
                    ],
                  }))}
                  max={Math.max(1, model.summary.students)}
                />
              </div>
            </section>

            <StudentTable rows={model.students} onOpen={(row: StudentRow) => setOpenKey(row.key)} />
          </>
        )}
      </main>
      <StudentDetail student={open} demo={demo} onClose={() => setOpenKey(null)} onDeleteRun={removeRun} />
    </div>
  )
}
```
`StudentDetail` is created in Task 16; for this task create a stub `src/features/dashboard/StudentDetail.tsx` exporting `StudentDetail(_props: { student: StudentRow | null; demo: boolean; onClose: () => void; onDeleteRun: (runId: string) => Promise<void> }) { return null }` (use `void _props` if `noUnusedParameters` complains) so the page compiles.

`src/features/dashboard/DashboardPage.css` — replace the old `.dashboard__banner`, `.dashboard__toolbar`, `.dashboard__empty`-specific rules with (keep `.bar-chart*`, `.dashboard__cards`, `.dashboard__metric*`, `.dashboard__charts`, `.dashboard__table*`, `.dashboard__demo`, `.teacher-gate*`):
```css
.dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.dashboard__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-3);
}

.dashboard__filters .field {
  min-width: 180px;
}

.dashboard__table-wrap {
  overflow-x: auto;
}

.dashboard__sort {
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
}

.dashboard__table th[aria-sort='ascending'] .dashboard__sort::after {
  content: ' ▲';
}

.dashboard__table th[aria-sort='descending'] .dashboard__sort::after {
  content: ' ▼';
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard
git commit -m "feat(dashboard): full teacher dashboard with filters, charts and sortable students"
```

### Task 16: Student detail and run deletion

**Files:**
- Modify: `src/features/dashboard/StudentDetail.tsx` (replace stub), `src/features/dashboard/DashboardPage.css`
- Test: `src/features/dashboard/StudentDetail.test.tsx`, append to `src/features/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `StudentRow`, `tutorialLabel`, `scoreAssessment` (Task 13); `formatDate` (Task 15); `itemsForForm`; `MISSIONS`; `GameDialog`, `DialogSection`, `GameButton`; `ERROR_TEXT`.
- Produces: `StudentDetail({ student, demo, onClose, onDeleteRun }: { student: StudentRow | null; demo: boolean; onClose: () => void; onDeleteRun: (runId: string) => Promise<void> })` — a `GameDialog` (size `xl`, title = student name, tone `info`) listing, for each run (newest first, heading "Jogada de <data>"): tutorial line, a phases table (Fase, Situação, Tentativas, Melhor, Estrelas), an attempts list (date, phase, result, error message, `<details><summary>Pseudocódigo</summary><pre>…</pre></details>`), pre/post answers per item with "✓"/"✗", and a **Apagar jogada** button (hidden in demo) that asks "Apagar esta jogada? Esta ação não pode ser desfeita." with "Cancelar"/"Apagar" before calling `onDeleteRun(runId)`.

- [ ] **Step 1: Write the failing tests**

`src/features/dashboard/StudentDetail.test.tsx`:
```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { StudentDetail } from '@/features/dashboard/StudentDetail'

const students = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students
const bruno = students.find((row) => row.name === 'Bruno Lima')

describe('StudentDetail', () => {
  it('shows every run with tutorial, phases, attempts and answers', () => {
    if (!bruno) throw new Error('demo student missing')
    render(<StudentDetail student={bruno} demo={false} onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    const dialog = screen.getByRole('dialog', { name: 'Bruno Lima' })
    expect(within(dialog).getAllByRole('heading', { name: /^Jogada de / })).toHaveLength(2)
    expect(dialog).toHaveTextContent('Tutorial: Concluído')
    expect(dialog).toHaveTextContent(/Tutorial: Pulado na etapa \d+ de 15/)
    expect(within(dialog).getAllByText('Pseudocódigo').length).toBeGreaterThan(0)
    expect(dialog).toHaveTextContent('Avaliação pré')
    expect(within(dialog).getAllByText('✓').length).toBeGreaterThan(0)
  })

  it('confirms before deleting a run', async () => {
    if (!bruno) throw new Error('demo student missing')
    const onDeleteRun = vi.fn(async () => undefined)
    render(<StudentDetail student={bruno} demo={false} onClose={vi.fn()} onDeleteRun={onDeleteRun} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Apagar jogada' })[0])
    expect(screen.getByText('Apagar esta jogada? Esta ação não pode ser desfeita.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    await vi.waitFor(() => expect(onDeleteRun).toHaveBeenCalledWith(bruno.runs[0].runId))
  })

  it('hides deletion for demo data and renders nothing without a student', () => {
    if (!bruno) throw new Error('demo student missing')
    const { rerender } = render(<StudentDetail student={bruno} demo onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    expect(screen.queryByRole('button', { name: 'Apagar jogada' })).not.toBeInTheDocument()
    rerender(<StudentDetail student={null} demo onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

Append to `src/features/dashboard/DashboardPage.test.tsx`:
```tsx
  it('opens a student and deletes one of their runs on the server', async () => {
    const runs = createDemoRuns(MISSIONS)
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => (init?.method === 'DELETE' ? new Response(null, { status: 204 }) : json(200, { runs })))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Felipe Costa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar jogada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => init?.method === 'DELETE' && String(url).includes('demo-run-5-0'))).toBe(true))
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/dashboard`
Expected: FAIL — stub renders nothing.

- [ ] **Step 3: Implement**

`src/features/dashboard/StudentDetail.tsx`:
```tsx
import { useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { itemsForForm } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { scoreAssessment, tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { formatDate } from '@/features/dashboard/StudentTable'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { RunSnapshot } from '@/shared/runSnapshot'

interface StudentDetailProps {
  student: StudentRow | null
  demo: boolean
  onClose: () => void
  onDeleteRun: (runId: string) => Promise<void>
}

const STATUS = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const
const OUTCOME = { success: 'Sucesso', objectiveFailed: 'Objetivo não cumprido', error: 'Erro' } as const
const ordered = [...MISSIONS].sort((a, b) => a.order - b.order)
const titleOf = (missionId: string) => MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId

function Answers({ response, label }: { response: RunSnapshot['assessments']['pre']; label: string }) {
  if (!response) return <p>{label}: não respondida.</p>
  if (response.skipped) return <p>{label}: pulada.</p>
  return (
    <div>
      <h4>
        {label} — {scoreAssessment(response)} de 10
      </h4>
      <ol className="student-detail__answers">
        {itemsForForm(response.form).map((item) => {
          const answer = response.answers[item.id]
          return (
            <li key={item.id}>
              <span>{item.prompt}</span> <strong>{answer === undefined ? 'sem resposta' : item.options[answer] ?? String(answer)}</strong> <span aria-label={answer === item.correctIndex ? 'correta' : 'errada'}>{answer === item.correctIndex ? '✓' : '✗'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function RunSection({ run, demo, onDelete }: { run: RunSnapshot; demo: boolean; onDelete: () => void }) {
  return (
    <section className="student-detail__run">
      <h3>Jogada de {formatDate(run.createdAt)}</h3>
      <p>
        Tutorial: {tutorialLabel(run.tutorial)}
        {run.tutorial && ` (${formatDate(run.tutorial.at)})`}
      </p>
      <table className="dashboard__table">
        <caption>Fases</caption>
        <thead>
          <tr>
            <th scope="col">Fase</th>
            <th scope="col">Situação</th>
            <th scope="col">Tentativas</th>
            <th scope="col">Melhor</th>
            <th scope="col">Estrelas</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((mission) => {
            const progress = run.missions[mission.id]
            return (
              <tr key={mission.id}>
                <th scope="row">{mission.title}</th>
                <td>{progress ? STATUS[progress.status] : '—'}</td>
                <td>{progress?.attempts ?? 0}</td>
                <td>{progress?.bestResult ? `${progress.bestResult.actions} comandos` : '—'}</td>
                <td>{progress?.bestResult ? '★'.repeat(progress.bestResult.efficiencyStars) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <h4>Tentativas</h4>
      {run.attempts.length === 0 ? (
        <p>Nenhuma tentativa.</p>
      ) : (
        <ol className="student-detail__attempts">
          {run.attempts.map((attempt) => (
            <li key={attempt.id}>
              <span>
                {formatDate(attempt.timestamp)} · {titleOf(attempt.missionId)} · {OUTCOME[attempt.outcome]}
                {attempt.errorCode && ` · ${ERROR_TEXT[attempt.errorCode as keyof typeof ERROR_TEXT]?.message ?? attempt.errorCode}`}
              </span>
              <details>
                <summary>Pseudocódigo</summary>
                <pre>{attempt.pseudocode || '(vazio)'}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
      <Answers response={run.assessments.pre} label="Avaliação pré" />
      <Answers response={run.assessments.post} label="Avaliação pós" />
      {!demo && (
        <GameButton tone="danger" icon="trash" onClick={onDelete}>
          Apagar jogada
        </GameButton>
      )}
    </section>
  )
}

export function StudentDetail({ student, demo, onClose, onDeleteRun }: StudentDetailProps) {
  const [confirm, setConfirm] = useState<string | null>(null)
  return (
    <>
      <GameDialog open={student !== null} title={student?.name ?? ''} icon="chart" tone="info" size="xl" onClose={onClose}>
        <DialogSection className="student-detail">
          {student && (
            <>
              <p>
                {student.school} · {student.runCount} {student.runCount === 1 ? 'jogada' : 'jogadas'}
              </p>
              {student.runs.map((run) => (
                <RunSection key={run.runId} run={run} demo={demo} onDelete={() => setConfirm(run.runId)} />
              ))}
            </>
          )}
        </DialogSection>
      </GameDialog>
      <GameDialog open={confirm !== null} title="Apagar jogada" icon="trash" tone="danger" onClose={() => setConfirm(null)}>
        <DialogSection>
          <p>Apagar esta jogada? Esta ação não pode ser desfeita.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirm(null)}>
            Cancelar
          </GameButton>
          <GameButton
            tone="danger"
            onClick={() => {
              const runId = confirm
              setConfirm(null)
              if (runId) void onDeleteRun(runId)
            }}
          >
            Apagar
          </GameButton>
        </DialogSection>
      </GameDialog>
    </>
  )
}
```
If the "Apagar jogada" dialog title collides with the button name in tests (`getAllByRole('button', { name: 'Apagar jogada' })`), the dialog title is a heading, not a button, so it does not.

Add to `src/features/dashboard/DashboardPage.css`:
```css
.student-detail {
  display: grid;
  gap: var(--space-4);
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}

.student-detail__run {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid #d6d9d2;
}

.student-detail__attempts,
.student-detail__answers {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 1.2em;
}

.student-detail pre {
  margin: 4px 0 0;
  padding: 8px;
  border-radius: 8px;
  background: #eef1ec;
  white-space: pre-wrap;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard
git commit -m "feat(dashboard): student detail with runs, attempts, answers and run deletion"
```
