# Phase 5 — Teacher dashboard (Tasks 18–19)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 18: Dashboard model by world

**Files:**
- Modify: `src/features/dashboard/dashboardModel.ts`, `src/features/dashboard/demoRuns.ts`
- Test: `src/features/dashboard/dashboardModel.test.ts`, `src/features/dashboard/demoRuns.test.ts`

**Interfaces:**
- Consumes: `RunSnapshot` with per-world assessments (Task 4), `WORLDS`, `missionsOfWorld`, `scoreResponse`
- Produces (replacing `pre`, `post`, `gain`, `completedPhases` on `StudentRow` and `phases`, `schoolScores` on `DashboardModel`):
  - `interface WorldCell { completed: number; state: PlotState; attempts: number; pre: number | null; post: number | null }` (`PlotState` = existing `'empty' | 'trying' | 'done'`; `done` when all 10 missions are completed)
  - `StudentRow.worlds: Record<WorldId, WorldCell>`, `StudentRow.completedMissions: number`, `StudentRow.worldsDone: number`; `plots` stays (all missions, used by the detail)
  - `interface WorldRow { world: WorldId; name: string; conceptLabel: string; finished: number; attemptsPerStudent: number; hintsPerStudent: number; pre: number | null; post: number | null }` and `DashboardModel.worldRows: WorldRow[]`
  - `summary`: `students`, `schools`, `runs`, `avgCompletedMissions`, `avgWorldsDone`, `attempts`, `hints`, `tutorial`, `avgGain` (mean over students and worlds of `post − pre` where both exist)
  - `SortKey` gains `completedMissions` and `worldsDone`, loses `completedPhases`, `pre`, `post`, `gain`
  - Demo data: 7 students reaching different worlds (one in each of worlds 1–6 plus one who finished all), with pre and post answers for the worlds they finished and a pre for the world they are in

- [ ] **Step 1: Write the failing tests**
  - `counts missions per world and marks finished worlds` — a run with all garden missions completed and 3 cornfield missions: `worlds.garden` `{ completed: 10, state: 'done' }`, `worlds.cornfield` `{ completed: 3, state: 'trying' }`, `worldsDone` 1, `completedMissions` 13.
  - `scores the tests of each world` — garden pre 4/10, post 9/10 → `worlds.garden.pre` 4, `.post` 9; `worldRows[0]` pre 4, post 9; `summary.avgGain` 5.
  - Keep the grouping-by-accents test.
  - `demo runs are valid snapshots and reach every world` — every demo run passes `runSnapshotSchema`; `worldRows.every((row) => row.finished > 0 || row.world === 'homestead')`.
- [ ] **Step 2–4:** run `npx vitest run src/features/dashboard`, implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(dashboard): model grouped by world"`

### Task 19: Dashboard views and CSV by world

**Files:**
- Modify: `src/features/dashboard/ClassField.tsx`, `src/features/dashboard/Insights.tsx`, `src/features/dashboard/DashboardPage.tsx`, `src/features/dashboard/StudentDetail.tsx`, `src/features/dashboard/dashboardCsv.ts`, `src/features/dashboard/DashboardPage.css`
- Test: `src/features/dashboard/DashboardPage.test.tsx`, `src/features/dashboard/StudentDetail.test.tsx`, `src/features/dashboard/dashboardCsv.test.ts`, `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: Task 18 model

Copy and structure (exact):
- Class field columns: `Aluno`, `Treino`, then one per world with header `name` and sub-line `conceptLabel`; each cell is the plot (empty / trying / done) with the visible text `` `${completed}/10` ``; footer `Concluíram` shows `` `${finished} de ${students}` `` per world; numeric columns `Missões` (`completedMissions`), `Tentativas`, `Dicas`, `Jogadas`, `Último acesso`. Cells carry `data-col` = world id, `missions`, `attempts`, `hints`, `runs`, `last`.
- Summary groups: `Alunos`, `Missões concluídas` (`avgCompletedMissions` de 60, note `em média, por aluno`), `Tutorial`, `Provas` (`avgGain` as `ganho médio de X acertos por mundo`, or `Ninguém fez as provas ainda.`).
- "Pré-teste e pós-teste por escola" becomes `Prova inicial e prova final por mundo` (one row per world, label `name`).
- "Tentativas e dicas por fase" becomes `Tentativas e dicas por mundo`.
- Student detail: per run, a section per world reached (heading `` `${name} · ${completed} de 10` ``) with that world's 10 plot buttons (the per-mission detail of today), then `Prova inicial: X de 10` / `Prova final: X de 10` expandable answers, or `não feita`.
- CSV: students columns `nome, escola, jogadas, tutorial, missoes_concluidas, mundos_concluidos, tentativas, dicas, erros, ultimo_acesso` + per world `<id>_missoes, <id>_pre, <id>_pos`; attempts columns add `mundo, missao_numero` after `missao`; assessments columns `nome, escola, jogada, mundo, forma, item, habilidade, resposta, correta`.

- [ ] **Step 1: Write the failing tests**
  - Dashboard page: table `Alunos` has a header cell `Milharal`; demo row of the student who finished everything shows `10/10` in `[data-col="garden"]`; section `Prova inicial e prova final por mundo` lists `Horta`.
  - Detail: `Bruno` (demo) shows heading `Horta · 10 de 10` and text `Prova inicial: ` with a score.
  - CSV: `studentsCsv` header contains `garden_missoes,garden_pre,garden_pos`; `assessmentsCsv` rows carry `garden` and `pre`.
  - `tests/e2e/dashboard.spec.ts`: replace `[data-col="phases"]` with `[data-col="missions"]` and `[data-col="m1-first-harvest"]` with `[data-col="garden"]`.
- [ ] **Step 2–4:** run `npx vitest run src/features/dashboard`, implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(dashboard): class field, tests and exports by world"`
