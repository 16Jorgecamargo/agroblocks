# Phase 4 — Student flow (Tasks 9–11)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 9: StudentDialog

**Files:**
- Create: `src/features/student/StudentDialog.tsx`, `src/features/student/StudentDialog.css`
- Test: `src/features/student/StudentDialog.test.tsx`

**Interfaces:**
- Consumes: `validateStudent`, `cleanText`, `StudentInfo` (Task 1); `recentSchools`, `rememberSchool` (Task 3); `GameDialog`, `DialogSection`, `GameButton`.
- Produces: `StudentDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: (student: StudentInfo) => void })` — dialog title "Quem está jogando?", labels "Nome completo" and "Escola", buttons "Cancelar" and "Começar"; confirming cleans both fields and remembers the school.

- [ ] **Step 1: Write the failing test**

`src/features/student/StudentDialog.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { StudentDialog } from '@/features/student/StudentDialog'
import { recentSchools, rememberSchool, SCHOOLS_KEY } from '@/services/storage/schoolHistory'

function setup() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<StudentDialog open onCancel={onCancel} onConfirm={onConfirm} />)
  const name = screen.getByLabelText('Nome completo')
  const school = screen.getByLabelText('Escola')
  return { onConfirm, onCancel, name, school, start: screen.getByRole('button', { name: 'Começar' }) }
}

describe('StudentDialog', () => {
  beforeEach(() => window.localStorage.removeItem(SCHOOLS_KEY))

  it('explains what is sent to the teacher', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toHaveTextContent('serão enviados ao professor')
  })

  it('keeps Começar disabled until the name and school are valid and shows errors after leaving a field', () => {
    const { name, school, start } = setup()
    expect(start).toBeDisabled()
    fireEvent.change(name, { target: { value: 'Ana' } })
    fireEvent.blur(name)
    expect(screen.getByText('Digite seu nome completo (nome e sobrenome).')).toBeInTheDocument()
    fireEvent.change(name, { target: { value: 'Ana Souza' } })
    fireEvent.change(school, { target: { value: 'Escola Azul' } })
    expect(start).toBeEnabled()
  })

  it('confirms a cleaned student and remembers the school', () => {
    const { name, school, start, onConfirm } = setup()
    fireEvent.change(name, { target: { value: '  Ana   Souza ' } })
    fireEvent.change(school, { target: { value: ' Escola  Azul ' } })
    fireEvent.click(start)
    expect(onConfirm).toHaveBeenCalledWith({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(recentSchools(window.localStorage)[0]).toBe('Escola Azul')
  })

  it('suggests schools used before on this computer', () => {
    rememberSchool(window.localStorage, 'Escola Verde')
    setup()
    expect(document.querySelector('datalist option[value="Escola Verde"]')).not.toBeNull()
  })

  it('cancels without confirming', () => {
    const { onCancel, onConfirm } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/student`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/features/student/StudentDialog.tsx`:
```tsx
import { useEffect, useId, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { recentSchools, rememberSchool } from '@/services/storage/schoolHistory'
import { safeStorage } from '@/services/storage/jsonStorage'
import { cleanText, validateStudent, type StudentInfo } from '@/shared/student'
import './StudentDialog.css'

interface StudentDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (student: StudentInfo) => void
}

export function StudentDialog({ open, onCancel, onConfirm }: StudentDialogProps) {
  const listId = useId()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [touched, setTouched] = useState({ name: false, school: false })
  const [schools, setSchools] = useState<string[]>([])
  const errors = validateStudent({ name, school })
  const valid = errors.name === null && errors.school === null

  useEffect(() => {
    if (!open) return
    setSchools(recentSchools(safeStorage()))
    setTouched({ name: false, school: false })
  }, [open])

  const confirm = () => {
    if (!valid) return
    const student = { name: cleanText(name), school: cleanText(school) }
    rememberSchool(safeStorage(), student.school)
    onConfirm(student)
  }

  return (
    <GameDialog open={open} title="Quem está jogando?" icon="flag" tone="info" onClose={onCancel}>
      <DialogSection>
        <form
          className="student-dialog"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            confirm()
          }}
        >
          <label className="field">
            <span className="field__label">Nome completo</span>
            <input value={name} maxLength={80} autoComplete="name" autoFocus onChange={(event) => setName(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, name: true }))} aria-invalid={touched.name && errors.name !== null} />
            {touched.name && errors.name && <span className="student-dialog__error">{errors.name}</span>}
          </label>
          <label className="field">
            <span className="field__label">Escola</span>
            <input value={school} maxLength={120} list={listId} onChange={(event) => setSchool(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, school: true }))} aria-invalid={touched.school && errors.school !== null} />
            {touched.school && errors.school && <span className="student-dialog__error">{errors.school}</span>}
          </label>
          <datalist id={listId}>
            {schools.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <p className="student-dialog__notice">
            Seu nome, sua escola, seu progresso nas missões e suas respostas das avaliações serão enviados ao professor para acompanhamento da atividade.
          </p>
          <div className="game-dialog__actions">
            <GameButton tone="secondary" onClick={onCancel}>
              Cancelar
            </GameButton>
            <GameButton tone="primary" type="submit" icon="play" disabled={!valid}>
              Começar
            </GameButton>
          </div>
        </form>
      </DialogSection>
    </GameDialog>
  )
}
```

`src/features/student/StudentDialog.css`:
```css
.student-dialog {
  display: grid;
  gap: var(--space-3);
}

.student-dialog .field input {
  width: 100%;
}

.student-dialog__error {
  color: #b3261e;
  font-size: 0.9rem;
  font-weight: 600;
}

.student-dialog__notice {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: 10px;
  background: #eef5ff;
  color: #24323d;
  font-size: 0.92rem;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/student`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/student
git commit -m "feat(student): ask for full name and school"
```

### Task 10: Home and Settings flows

**Files:**
- Modify: `src/features/home/HomePage.tsx`, `src/features/settings/SettingsDialog.tsx`, `tests/e2e/agroblocks.spec.ts` (first test), `tests/e2e/helpers.ts`
- Test: `src/features/home/HomePage.test.tsx`, `src/features/settings/SettingsDialog.test.tsx`

**Interfaces:**
- Consumes: `StudentDialog` (Task 9); store `startRun`, `registerStudent` (Task 3).
- Produces: e2e helper `registerStudent(page: Page, name?: string, school?: string): Promise<void>` that fills the StudentDialog and clicks "Começar".

Flows (spec §1):
- "Iniciar nova fazenda" without progress → StudentDialog → `startRun` → `/jogar/m0-training`.
- With progress → "Começar uma nova fazenda?" → "Apagar e começar" → StudentDialog → `startRun` → training. Cancel at any step keeps everything.
- "Continuar missão" without `save.student` → StudentDialog → `registerStudent` → mission; with student → mission directly.
- Settings "Sim, apagar tudo" → `startRun(save.student)` when a student exists, otherwise `resetProgress()`.

- [ ] **Step 1: Write the failing tests**

In `src/features/home/HomePage.test.tsx` add the helper and replace the two flow tests:
```tsx
function register(name = 'Ana Souza', school = 'Escola Azul') {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('Escola'), { target: { value: school } })
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
}
```
```tsx
  it('asks who is playing before starting a new farm', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toBeInTheDocument()
    register()
    expect(screen.getByText('jogando')).toBeInTheDocument()
    expect(useProgressStore.getState().save.student).toEqual({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(useProgressStore.getState().save.runId).not.toBeNull()
  })

  it('asks before wiping progress, then asks who is playing', () => {
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toBeInTheDocument()
    register()
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('keeps everything when the student cancels the registration', () => {
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(screen.queryByText('jogando')).not.toBeInTheDocument()
  })

  it('registers an old save before continuing without losing progress', () => {
    useProgressStore.getState().recordAttempt(success('m0-training'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Continuar missão/ }))
    register()
    expect(screen.getByText('jogando')).toBeInTheDocument()
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(useProgressStore.getState().save.student?.name).toBe('Ana Souza')
  })

  it('continues directly when the student is known', () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    useProgressStore.getState().recordAttempt(success('m0-training'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Continuar missão/ }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })
```

In `src/features/settings/SettingsDialog.test.tsx` add:
```tsx
  it('starts a new run for the same student when progress is reset', async () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    const runId = useProgressStore.getState().save.runId
    useProgressStore.getState().registerHint('m1-first-harvest')
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: 'Reiniciar progresso' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, apagar tudo' }))
    const save = useProgressStore.getState().save
    expect(save.student?.name).toBe('Ana Souza')
    expect(save.runId).not.toBe(runId)
    expect(save.missions['m1-first-harvest'].hintsUsed).toBe(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/home src/features/settings`
Expected: FAIL — no "Quem está jogando?" dialog; settings reset clears the student.

- [ ] **Step 3: Implement**

`src/features/home/HomePage.tsx`:
- import `StudentDialog` from `@/features/student/StudentDialog` and `type StudentInfo` from `@/shared/student`
- replace `resetProgress` selector with `const startRun = useProgressStore((store) => store.startRun)` and `const registerStudent = useProgressStore((store) => store.registerStudent)`
- add `const [registerFor, setRegisterFor] = useState<'new' | 'continue' | null>(null)`
- `startNew`: `if (hasProgress(save)) { setConfirmNew(true); return } setRegisterFor('new')`
- continue button `onClick`: `() => { if (!continueMission) return; if (save.student) navigate(\`/jogar/${continueMission.id}\`); else setRegisterFor('continue') }`
- "Apagar e começar" `onClick`: `() => { setConfirmNew(false); setRegisterFor('new') }`
- before `</div>` closing the page add:
```tsx
      <StudentDialog
        open={registerFor !== null}
        onCancel={() => setRegisterFor(null)}
        onConfirm={(student: StudentInfo) => {
          const target = registerFor
          setRegisterFor(null)
          if (target === 'new') {
            startRun(student)
            navigate(`/jogar/${TRAINING_ID}`)
            return
          }
          registerStudent(student)
          if (continueMission) navigate(`/jogar/${continueMission.id}`)
        }}
      />
```

`src/features/settings/SettingsDialog.tsx`: add `const student = useProgressStore((store) => store.save.student)` and `const startRun = useProgressStore((store) => store.startRun)`; in "Sim, apagar tudo" replace `resetProgress()` with `if (student) startRun(student)\n                          else resetProgress()`.

`tests/e2e/helpers.ts` — add:
```ts
export async function registerStudent(page: Page, name = 'Ana Souza', school = 'Escola Azul'): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Quem está jogando?' })
  await dialog.getByLabel('Nome completo').fill(name)
  await dialog.getByLabel('Escola').fill(school)
  await dialog.getByRole('button', { name: 'Começar' }).click()
}
```

`tests/e2e/agroblocks.spec.ts` first test — after clicking "Iniciar nova fazenda" add `await registerStudent(page)` (import it from `./helpers`).

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/home src/features/settings tests/e2e
git commit -m "feat(home): register the student when starting or continuing a farm"
```

### Task 11: Tutorial outcome recorded

**Files:**
- Modify: `src/features/tutorial/TutorialOverlay.tsx`, `src/features/gameplay/GameplayPage.tsx`
- Test: `src/features/tutorial/TutorialOverlay.test.tsx`, `src/features/gameplay/GameplayPage.test.tsx`

**Interfaces:**
- Consumes: store `recordTutorial(status, step)` (Task 3).
- Produces: `TutorialOverlayProps.onExit: (outcome: { status: 'completed' | 'skipped'; step: number }) => void` — `step` is `progress.index + 1`.

- [ ] **Step 1: Write the failing tests**

In `src/features/tutorial/TutorialOverlay.test.tsx`:
- in `runs the whole tutorial from welcome to the missions` change the last assertion to `expect(onExit).toHaveBeenCalledWith({ status: 'completed', step: 15 })`
- in `asks before skipping the tutorial` change the last assertion to `expect(onExit).toHaveBeenCalledWith({ status: 'skipped', step: 2 })`

In `src/features/gameplay/GameplayPage.test.tsx` add (reuse the file's existing render helper for a mission route; the training id is `m0-training`):
```tsx
  it('records a skipped tutorial on the run', async () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    renderGameplay('m0-training')
    fireEvent.click(await screen.findByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    fireEvent.click(within(screen.getAllByRole('dialog', { name: 'Sair do treinamento?' }).at(-1) as HTMLElement).getByRole('button', { name: 'Sair do treinamento' }))
    expect(useProgressStore.getState().save.tutorial).toMatchObject({ status: 'skipped', step: 2 })
  })
```
If the file's helper has another name, use it; import `within` and `useProgressStore` if missing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/tutorial/TutorialOverlay.test.tsx src/features/gameplay/GameplayPage.test.tsx`
Expected: FAIL — `onExit` called without arguments; tutorial stays `null`.

- [ ] **Step 3: Implement**

`src/features/tutorial/TutorialOverlay.tsx`:
- `onExit: (outcome: { status: 'completed' | 'skipped'; step: number }) => void`
- "Ir para as missões": `onClick={() => onExit({ status: 'completed', step: progress.index + 1 })}`
- "Sair do treinamento": `onClick={() => onExit({ status: 'skipped', step: progress.index + 1 })}`

`src/features/gameplay/GameplayPage.tsx`: add `const recordTutorial = useProgressStore((store) => store.recordTutorial)` (import the store if not imported) and pass
```tsx
          onExit={(outcome) => {
            recordTutorial(outcome.status, outcome.step)
            navigate('/missoes')
          }}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --maxWorkers=2 && npx tsc --noEmit -p .`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial src/features/gameplay
git commit -m "feat(tutorial): record whether the training was completed or skipped"
```
