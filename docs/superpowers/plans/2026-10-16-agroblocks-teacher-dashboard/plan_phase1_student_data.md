# Phase 1 — Student data (Tasks 1–3)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 1: Shared student helpers and snapshot schema

**Files:**
- Create: `src/shared/student.ts`, `src/shared/runSnapshot.ts`, `src/shared/snapshotFixture.ts` (test fixture reused by server and dashboard tests)
- Test: `src/shared/student.test.ts`, `src/shared/runSnapshot.test.ts`

**Interfaces:**
- Produces:
  - `interface StudentInfo { name: string; school: string }`
  - `interface TutorialRecord { status: 'completed' | 'skipped'; step: number; at: string }`
  - `cleanText(value: string): string`
  - `normalizeKey(value: string): string`
  - `studentKeyOf(student: StudentInfo): string`
  - `validateStudent(input: StudentInfo): { name: string | null; school: string | null }` (PT-BR error text or null)
  - `runSnapshotSchema` (zod) and `type RunSnapshot = z.infer<typeof runSnapshotSchema>`
  - constants `MAX_ATTEMPTS = 2000`, `MAX_PSEUDOCODE = 4000`, `MAX_BODY_BYTES = 512 * 1024`

- [ ] **Step 1: Write the failing tests**

`src/shared/student.test.ts`:
```ts
import { cleanText, normalizeKey, studentKeyOf, validateStudent } from './student.js'

describe('student helpers', () => {
  it('trims and collapses spaces', () => {
    expect(cleanText('  Ana   Maria \t Souza ')).toBe('Ana Maria Souza')
  })

  it('normalizes keys without accents, case or extra spaces', () => {
    expect(normalizeKey('  José   da SILVA ')).toBe('jose da silva')
    expect(studentKeyOf({ name: 'José da Silva', school: 'E.E. São João' })).toBe(studentKeyOf({ name: 'jose  da silva', school: 'e.e. sao joao' }))
  })

  it('requires a full name with two words of two letters', () => {
    expect(validateStudent({ name: 'Ana', school: 'Escola Azul' }).name).toBe('Digite seu nome completo (nome e sobrenome).')
    expect(validateStudent({ name: 'Ana S', school: 'Escola Azul' }).name).toBe('Digite seu nome completo (nome e sobrenome).')
    expect(validateStudent({ name: 'Ana Souza', school: 'Escola Azul' })).toEqual({ name: null, school: null })
    expect(validateStudent({ name: `Ana ${'a'.repeat(80)}`, school: 'Escola Azul' }).name).toBe('O nome pode ter até 80 caracteres.')
  })

  it('requires a school between 3 and 120 characters', () => {
    expect(validateStudent({ name: 'Ana Souza', school: ' ab ' }).school).toBe('Digite o nome da sua escola.')
    expect(validateStudent({ name: 'Ana Souza', school: 'a'.repeat(121) }).school).toBe('O nome da escola pode ter até 120 caracteres.')
  })
})
```

`src/shared/snapshotFixture.ts`:
```ts
import type { RunSnapshot } from './runSnapshot.js'

export const validSnapshot: RunSnapshot = {
  runId: '3f1c2a4e-1111-4222-8333-444455556666',
  student: { name: 'Ana Souza', school: 'Escola Azul' },
  studentKey: 'ana souza|escola azul',
  createdAt: '2026-10-16T10:00:00.000Z',
  updatedAt: '2026-10-16T10:05:00.000Z',
  tutorial: { status: 'completed', step: 15, at: '2026-10-16T10:04:00.000Z' },
  missions: {
    'm0-training': { status: 'completed', attempts: 1, bestResult: { actions: 3, blocks: 3, usage: { seeds: 0, water: 0, energy: 3 }, efficiencyStars: 3 }, hintsUsed: 0, errorCounts: {} },
  },
  attempts: [
    {
      id: 'a1',
      missionId: 'm0-training',
      attemptNumber: 1,
      timestamp: '2026-10-16T10:03:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 3,
      blocks: 3,
      usage: { seeds: 0, water: 0, energy: 3 },
      hintsUsed: 0,
      efficiencyStars: 3,
      pseudocode: 'quando executar:\n    mover para frente',
    },
  ],
  assessments: { pre: null, post: null },
}
```

`src/shared/runSnapshot.test.ts`:
```ts
import { MAX_ATTEMPTS, MAX_PSEUDOCODE, runSnapshotSchema } from './runSnapshot.js'
import { validSnapshot } from './snapshotFixture.js'

describe('runSnapshotSchema', () => {
  it('accepts a valid snapshot', () => {
    expect(runSnapshotSchema.safeParse(validSnapshot).success).toBe(true)
  })

  it('rejects too many attempts and long pseudocode', () => {
    const many = { ...validSnapshot, attempts: Array.from({ length: MAX_ATTEMPTS + 1 }, () => validSnapshot.attempts[0]) }
    expect(runSnapshotSchema.safeParse(many).success).toBe(false)
    const long = { ...validSnapshot, attempts: [{ ...validSnapshot.attempts[0], pseudocode: 'x'.repeat(MAX_PSEUDOCODE + 1) }] }
    expect(runSnapshotSchema.safeParse(long).success).toBe(false)
  })

  it('rejects an invalid student', () => {
    expect(runSnapshotSchema.safeParse({ ...validSnapshot, student: { name: 'Ana', school: 'Escola Azul' } }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/shared`
Expected: FAIL — cannot resolve `./student.js` / `./runSnapshot.js`.

- [ ] **Step 3: Implement**

`src/shared/student.ts`:
```ts
export interface StudentInfo {
  name: string
  school: string
}

export interface TutorialRecord {
  status: 'completed' | 'skipped'
  step: number
  at: string
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeKey(value: string): string {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function studentKeyOf(student: StudentInfo): string {
  return `${normalizeKey(student.name)}|${normalizeKey(student.school)}`
}

export function validateStudent(input: StudentInfo): { name: string | null; school: string | null } {
  const name = cleanText(input.name)
  const school = cleanText(input.school)
  const words = name.split(' ').filter((word) => word.replace(/[^\p{L}]/gu, '').length >= 2)
  return {
    name: name.length > 80 ? 'O nome pode ter até 80 caracteres.' : words.length < 2 ? 'Digite seu nome completo (nome e sobrenome).' : null,
    school: school.length > 120 ? 'O nome da escola pode ter até 120 caracteres.' : school.length < 3 ? 'Digite o nome da sua escola.' : null,
  }
}
```

`src/shared/runSnapshot.ts`:
```ts
import { z } from 'zod'
import { validateStudent } from './student.js'

export const MAX_ATTEMPTS = 2000
export const MAX_PSEUDOCODE = 4000
export const MAX_BODY_BYTES = 512 * 1024

const usage = z.object({ seeds: z.number(), water: z.number(), energy: z.number() })
const stars = z.union([z.literal(1), z.literal(2), z.literal(3)])

const student = z
  .object({ name: z.string(), school: z.string() })
  .refine((value) => {
    const errors = validateStudent(value)
    return errors.name === null && errors.school === null
  })

const attempt = z.object({
  id: z.string().max(64),
  missionId: z.string().max(64),
  attemptNumber: z.number().int().positive(),
  timestamp: z.string().max(40),
  outcome: z.enum(['success', 'objectiveFailed', 'error']),
  errorCode: z.string().max(40).nullable(),
  actions: z.number().int().nonnegative(),
  blocks: z.number().int().nonnegative(),
  usage,
  hintsUsed: z.number().int().min(0).max(4),
  efficiencyStars: stars.nullable(),
  pseudocode: z.string().max(MAX_PSEUDOCODE),
})

const mission = z.object({
  status: z.enum(['locked', 'available', 'completed']),
  attempts: z.number().int().nonnegative(),
  bestResult: z.object({ actions: z.number(), blocks: z.number(), usage, efficiencyStars: stars }).nullable(),
  hintsUsed: z.number().int().min(0).max(4),
  errorCounts: z.record(z.string(), z.number().int().nonnegative()),
})

const assessment = z.object({
  form: z.enum(['pre', 'post']),
  startedAt: z.string(),
  completedAt: z.string(),
  skipped: z.boolean(),
  answers: z.record(z.string(), z.number().int()),
})

export const runSnapshotSchema = z.object({
  runId: z.string().min(8).max(64),
  student,
  studentKey: z.string().max(220),
  createdAt: z.string().max(40),
  updatedAt: z.string().max(40),
  tutorial: z.object({ status: z.enum(['completed', 'skipped']), step: z.number().int().min(1).max(99), at: z.string().max(40) }).nullable(),
  missions: z.record(z.string(), mission),
  attempts: z.array(attempt).max(MAX_ATTEMPTS),
  assessments: z.object({ pre: assessment.nullable(), post: assessment.nullable() }),
})

export type RunSnapshot = z.infer<typeof runSnapshotSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/shared`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared
git commit -m "feat(shared): student validation, keys and run snapshot schema"
```

### Task 2: SaveData gains runId, student and tutorial; participant code removed

**Files:**
- Modify: `src/game/progress/types.ts`, `src/game/progress/progression.ts`, `src/services/storage/saveDataSchema.ts`, `src/services/export/csv.ts`, `src/services/export/csv.test.ts`, `src/features/dashboard/DashboardPage.tsx`, `src/features/settings/SettingsDialog.tsx`, `src/features/settings/SettingsDialog.test.tsx` (if it references the code field), `src/stores/progressStore.ts`
- Test: `src/game/progress/progression.test.ts` (append), `src/services/storage/saveStorage.test.ts` (append; create if missing)

**Interfaces:**
- Consumes: `StudentInfo`, `TutorialRecord` from `@/shared/student`.
- Produces:
  - `SaveData` = `{ version: 1; runId: string | null; student: StudentInfo | null; tutorial: TutorialRecord | null; createdAt; missions; attempts; assessments }` (no `participantCode`)
  - `assignStudent(save: SaveData, student: StudentInfo, runId: string): SaveData`
  - `recordTutorial(save: SaveData, record: TutorialRecord): SaveData`
  - removes `setParticipantCode` (function and store action)

- [ ] **Step 1: Write the failing tests**

Append to `src/game/progress/progression.test.ts` (keep existing imports, add `assignStudent`, `recordTutorial`):
```ts
describe('student and tutorial', () => {
  const refs = [{ id: 'm0-training', order: 0 }, { id: 'm1-first-harvest', order: 1 }]

  it('starts with no run, student or tutorial outcome', () => {
    const save = createInitialSave(refs, '2026-10-16T10:00:00.000Z')
    expect(save).toMatchObject({ runId: null, student: null, tutorial: null })
    expect(save).not.toHaveProperty('participantCode')
  })

  it('assigns a cleaned student and a run id', () => {
    const save = assignStudent(createInitialSave(refs, 'now'), { name: '  Ana   Souza ', school: ' Escola  Azul ' }, 'run-1')
    expect(save.student).toEqual({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(save.runId).toBe('run-1')
  })

  it('keeps completed over skipped but lets skipped become completed', () => {
    let save = createInitialSave(refs, 'now')
    save = recordTutorial(save, { status: 'skipped', step: 3, at: 't1' })
    expect(save.tutorial).toEqual({ status: 'skipped', step: 3, at: 't1' })
    save = recordTutorial(save, { status: 'completed', step: 15, at: 't2' })
    expect(save.tutorial?.status).toBe('completed')
    save = recordTutorial(save, { status: 'skipped', step: 4, at: 't3' })
    expect(save.tutorial).toEqual({ status: 'completed', step: 15, at: 't2' })
  })
})
```

Append to `src/services/storage/saveStorage.test.ts` (create with these imports if missing):
```ts
import { loadSave, SAVE_KEY } from '@/services/storage/saveStorage'

describe('legacy saves', () => {
  it('loads a save with participantCode and no run fields', () => {
    const legacy = {
      version: 1,
      participantCode: 'ALUNO-07',
      createdAt: '2026-10-14T12:00:00.000Z',
      missions: {},
      attempts: [],
      assessments: { pre: null, post: null },
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
    const save = loadSave(window.localStorage, [{ id: 'm0-training', order: 0 }], 'now')
    expect(save.createdAt).toBe('2026-10-14T12:00:00.000Z')
    expect(save).toMatchObject({ runId: null, student: null, tutorial: null })
    expect(save).not.toHaveProperty('participantCode')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/progress src/services/storage`
Expected: FAIL — `assignStudent`/`recordTutorial` not exported; legacy save loads with `participantCode` and without `runId`.

- [ ] **Step 3: Implement**

`src/game/progress/types.ts` — replace the `SaveData` interface and add the import:
```ts
import type { StudentInfo, TutorialRecord } from '@/shared/student'

export interface SaveData {
  version: 1
  runId: string | null
  student: StudentInfo | null
  tutorial: TutorialRecord | null
  createdAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: { pre: AssessmentResponse | null; post: AssessmentResponse | null }
}
```

`src/game/progress/progression.ts`:
- in `createInitialSave` replace `participantCode: null,` with `runId: null,\n    student: null,\n    tutorial: null,`
- delete `setParticipantCode`
- add:
```ts
export function assignStudent(save: SaveData, student: StudentInfo, runId: string): SaveData {
  return { ...save, runId, student: { name: cleanText(student.name), school: cleanText(student.school) } }
}

export function recordTutorial(save: SaveData, record: TutorialRecord): SaveData {
  if (save.tutorial?.status === 'completed' && record.status === 'skipped') return save
  return { ...save, tutorial: record }
}
```
with `import { cleanText, type StudentInfo, type TutorialRecord } from '@/shared/student'`.

`src/services/storage/saveDataSchema.ts` — replace the `saveDataSchema` export:
```ts
const student = z.object({ name: z.string(), school: z.string() })
const tutorial = z.object({ status: z.enum(['completed', 'skipped']), step: z.number().int(), at: z.string() })

export const saveDataSchema = z.object({
  version: z.literal(1),
  runId: z.string().nullable().default(null),
  student: student.nullable().default(null),
  tutorial: tutorial.nullable().default(null),
  createdAt: z.string(),
  missions: z.record(z.string(), missionProgress),
  attempts: z.array(attemptRecord),
  assessments: z.object({ pre: assessmentResponse.nullable(), post: assessmentResponse.nullable() }),
})
```

`src/stores/progressStore.ts` — remove `setParticipantCode` from the import, the interface and the store object.

`src/services/export/csv.ts` (temporary until Task 14 replaces it): replace every `save.participantCode` with `save.student?.name ?? null`; change header `'participante'` to `'aluno'` in the three functions; change `missionsCsv(stats, participantCode: string | null)` to `missionsCsv(stats, studentName: string | null)` and use `studentName`. Update `src/services/export/csv.test.ts` accordingly (expect `'aluno'` header and the student name instead of the participant code; build the save with `assignStudent(..., { name: 'Ana Souza', school: 'Escola Azul' }, 'run-1')`).

`src/features/dashboard/DashboardPage.tsx` (temporary until Task 15): replace `const code = realSave.participantCode ?? 'anonimo'` with `const code = realSave.student ? realSave.student.name.replace(/\s+/g, '-') : 'anonimo'` and `realSave.participantCode` in the `missionsCsv` call with `realSave.student?.name ?? null`.

`src/features/settings/SettingsDialog.tsx`: delete `participantCode`, `setParticipantCode`, `code`/`setCode` state, the `setCode('')` call, the `<label className="field">…Código de participante…</label>` block and the `<p className="settings__note">Use apenas um código…</p>` note. If `SettingsDialog.test.tsx` asserts the code field, delete that test.

- [ ] **Step 4: Run tests, types and suite**

Run: `npx tsc --noEmit -p . && npx vitest run --maxWorkers=2`
Expected: tsc clean; all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat(progress): store run id, student and tutorial outcome; drop participant code"
```

### Task 3: Store actions and school history

**Files:**
- Create: `src/services/storage/schoolHistory.ts`
- Modify: `src/stores/progressStore.ts`
- Test: `src/stores/progressStore.test.ts` (create or append), `src/services/storage/schoolHistory.test.ts`

**Interfaces:**
- Consumes: `assignStudent`, `recordTutorial` (Task 2).
- Produces:
  - store `startRun(student: StudentInfo): void` (fresh save + new `runId` + student)
  - store `registerStudent(student: StudentInfo): void` (keeps progress; keeps existing `runId` or creates one)
  - store `recordTutorial(status: 'completed' | 'skipped', step: number): void`
  - `SCHOOLS_KEY = 'agroblocks:schools:v1'`, `recentSchools(storage: Storage | null): string[]`, `rememberSchool(storage: Storage | null, school: string): void`

- [ ] **Step 1: Write the failing tests**

`src/stores/progressStore.test.ts`:
```ts
import { useProgressStore } from '@/stores/progressStore'

const ana = { name: 'Ana Souza', school: 'Escola Azul' }

describe('progress store runs', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('starts a fresh run with a new id and the student', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().startRun(ana)
    const first = useProgressStore.getState().save
    expect(first.student).toEqual(ana)
    expect(first.runId).toMatch(/^[0-9a-f-]{36}$/)
    expect(first.missions['m1-first-harvest'].hintsUsed).toBe(0)
    useProgressStore.getState().startRun(ana)
    expect(useProgressStore.getState().save.runId).not.toBe(first.runId)
  })

  it('registers a student on an existing save without losing progress', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().registerStudent(ana)
    const save = useProgressStore.getState().save
    expect(save.missions['m1-first-harvest'].hintsUsed).toBe(1)
    expect(save.runId).not.toBeNull()
    const runId = save.runId
    useProgressStore.getState().registerStudent({ name: 'Ana Maria Souza', school: 'Escola Azul' })
    expect(useProgressStore.getState().save.runId).toBe(runId)
  })

  it('records the tutorial outcome with the current time', () => {
    useProgressStore.getState().recordTutorial('skipped', 3)
    expect(useProgressStore.getState().save.tutorial).toMatchObject({ status: 'skipped', step: 3 })
  })
})
```

`src/services/storage/schoolHistory.test.ts`:
```ts
import { recentSchools, rememberSchool, SCHOOLS_KEY } from '@/services/storage/schoolHistory'

describe('school history', () => {
  beforeEach(() => window.localStorage.removeItem(SCHOOLS_KEY))

  it('keeps the ten most recent distinct schools, newest first', () => {
    for (let index = 0; index < 12; index += 1) rememberSchool(window.localStorage, `Escola ${index}`)
    rememberSchool(window.localStorage, '  Escola   3 ')
    const schools = recentSchools(window.localStorage)
    expect(schools).toHaveLength(10)
    expect(schools[0]).toBe('Escola 3')
    expect(schools.filter((school) => school === 'Escola 3')).toHaveLength(1)
  })

  it('survives broken storage data', () => {
    window.localStorage.setItem(SCHOOLS_KEY, '{bad')
    expect(recentSchools(window.localStorage)).toEqual([])
    expect(recentSchools(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/progressStore.test.ts src/services/storage/schoolHistory.test.ts`
Expected: FAIL — `startRun` is not a function; module `schoolHistory` not found.

- [ ] **Step 3: Implement**

`src/services/storage/schoolHistory.ts`:
```ts
import { z } from 'zod'
import { cleanText } from '@/shared/student'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const SCHOOLS_KEY = 'agroblocks:schools:v1'

export function recentSchools(storage: Storage | null): string[] {
  return readJson(storage, SCHOOLS_KEY, z.array(z.string())).value ?? []
}

export function rememberSchool(storage: Storage | null, school: string): void {
  const clean = cleanText(school)
  if (!clean) return
  writeJson(storage, SCHOOLS_KEY, [clean, ...recentSchools(storage).filter((item) => item !== clean)].slice(0, 10))
}
```

`src/stores/progressStore.ts` — add to the imports `assignStudent`, `recordTutorial as recordTutorialOutcome` from progression, `type StudentInfo` from `@/shared/student`; add to `ProgressState`:
```ts
  startRun: (student: StudentInfo) => void
  registerStudent: (student: StudentInfo) => void
  recordTutorial: (status: 'completed' | 'skipped', step: number) => void
```
and to the store object:
```ts
    startRun: (student) => commit(assignStudent(createInitialSave(missionRefs, new Date().toISOString()), student, crypto.randomUUID())),
    registerStudent: (student) => {
      const save = get().save
      commit(assignStudent(save, student, save.runId ?? crypto.randomUUID()))
    },
    recordTutorial: (status, step) => commit(recordTutorialOutcome(get().save, { status, step, at: new Date().toISOString() })),
```

- [ ] **Step 4: Run tests and suite**

Run: `npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores src/services/storage
git commit -m "feat(progress): start and register runs, record tutorial outcome, remember schools"
```
