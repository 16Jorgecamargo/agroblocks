# Phase 3 — Student flow (Tasks 12–13)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 12: Assessment pages per world

**Files:**
- Modify: `src/app/routes.tsx`, `src/features/assessment/AssessmentPage.tsx`, `src/features/assessment/AssessmentPage.css` (only if needed)
- Test: `src/features/assessment/AssessmentPage.test.tsx`

**Interfaces:**
- Consumes: `itemsFor`, `scoreResponse`, `scoreBySkill`, `SKILL_LABELS` (Task 3); `storeAssessment(save, response, missions)`, `worldStep`, `isWorldOpen`, `missionsOfWorld` (Tasks 1–2)
- Produces:
  - Route `/avaliacao/:world/:form` with `form` slug `pre` | `pos`; unknown world or slug → `<Navigate to="/missoes" replace />`; old route `/avaliacao/:form` → `<Navigate to="/missoes" replace />`
  - `function assessmentPath(world: WorldId, form: AssessmentForm): string` exported from `src/features/assessment/assessmentPath.ts` (`/avaliacao/garden/pre`, `/avaliacao/garden/pos`)

Page copy (exact):
- Titles: `` `Prova inicial · ${world.name}` `` and `` `Prova final · ${world.name}` ``
- Intro list for pre: `É normal não saber várias respostas: marque a que achar mais certa.`; for post: `Você terminou as 10 missões deste mundo. Vamos ver o quanto aprendeu.`; both: `Não vale nota e não há tempo limite.`, `Você não verá se acertou durante a prova.`, `Suas respostas vão para o seu professor, junto com o seu nome.`
- Locked post (missions not done): heading `Ainda não disponível`, text `` `Conclua as 10 missões de ${world.name} para fazer a prova final.` ``, link `Ver missões`
- Locked world (not open): redirect to `/missoes`
- Done screen: heading `Obrigado!`, text `Suas respostas foram salvas e enviadas ao seu professor.`; after post also the comparison table by skill (caption `` `Acertos por habilidade · ${world.name}` ``, rows Montar/Prever/Consertar, columns Prova inicial/Prova final); next link: pre → `` `Começar ${world.name}` `` to `/jogar/<first mission of the world>`; post → `` `Ir para ${nextWorld.name}` `` to `/missoes` (or `Ver missões` after the last world)
- Already answered form: shows the done screen

- [ ] **Step 1: Write the failing tests**
  - `runs the cornfield pre-test and opens its first mission` — store with garden post done; render `/avaliacao/cornfield/pre`; answer 10; expect link `Começar Milharal` with href `/jogar/cornfield-01`; `save.assessments.cornfield.pre.answers` has 10 keys.
  - `locks the post-test until the ten missions are done` — render `/avaliacao/garden/pos` on a fresh save; expect `Conclua as 10 missões de Horta para fazer a prova final.`
  - `opens the next world after the post-test` — garden missions done + pre stored; answer post; expect link `Ir para Milharal` and `isWorldOpen(save, 'cornfield', REFS)` true.
  - `sends unknown worlds back to the missions` — `/avaliacao/moon/pre` renders the `/missoes` route.
- [ ] **Step 2–4:** run `npx vitest run src/features/assessment`, implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(assessment): pre-test and post-test pages for each world"`

### Task 13: Flow guards, results, home and labels

**Files:**
- Modify: `src/features/gameplay/GameplayPage.tsx`, `src/features/results/resultsLogic.ts`, `src/features/home/HomePage.tsx`, `src/features/gameplay/components/GameHud.tsx`, `src/features/gameplay/components/BriefingDialog.tsx`, `src/features/gameplay/useGameplaySession.ts` (repetition tip condition), `src/features/mission-select/unlocks.ts`
- Test: `src/features/gameplay/GameplayPage.test.tsx`, `src/features/results/resultsLogic.test.ts` (create if missing), `src/features/home/HomePage.test.tsx`

**Interfaces:**
- Consumes: `worldStep`, `assessmentPath`, `missionLabel`, `getWorld`
- Produces:
  - GameplayPage guard: a registered student opening a world mission whose world has no pre-test goes to `assessmentPath(world, 'pre')`; the training never redirects; a completed mission never redirects (replay).
  - `nextStep(mission, save)` → next mission of the same world (`Próxima missão`); after slot 10 with post missing → `{ label: 'Fazer a prova final', to: assessmentPath(world, 'post') }`; otherwise `{ label: 'Voltar às missões', to: '/missoes' }`.
  - Home: the "Avaliação" link is removed; the continue button subtitle uses `missionLabel`; when `currentWorld`'s step is a test, "Continuar missão" goes to that test path and its subtitle reads `` `Prova inicial · ${name}` `` / `` `Prova final · ${name}` ``.
  - HUD, briefing and results headings use `missionLabel(mission)` followed by ` - ${mission.title}` for world missions.
  - Repetition tip: shown when `mission.world` is not `null` and not `garden`.
  - `newlyUnlocked` excludes `m0-training` and `garden-01` instead of `order <= 1`.
  - The mission-select "Fazer avaliação final" header button is removed (the trail carries the tests from Task 17).

- [ ] **Step 1: Write the failing tests**
  - `sends a registered student to the world pre-test before its first mission` (`/jogar/cornfield-01` with cornfield open and no pre → renders `/avaliacao/cornfield/pre`).
  - `lets a student replay a finished mission without a test` (completed `garden-02`, garden pre stored, post stored → gameplay renders).
  - `nextStep` cases: `garden-03` → `garden-04`; `garden-10` with no post → `Fazer a prova final` to `/avaliacao/garden/pos`; `garden-10` with post → `Voltar às missões`.
  - Home: no link named `Avaliação`; with garden missions done and no post, "Continuar missão" shows `Prova final · Horta`.
- [ ] **Step 2–4:** run `npx vitest run src/features`, implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(flow): world tests in the student path and mission labels by world"`
