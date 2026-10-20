# Phase 6 — End-to-end and documentation (Task 20)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 20: End-to-end flows and docs

**Files:**
- Create: `tests/e2e/worlds.spec.ts`, `docs/decisions/0012-concept-worlds.md`
- Modify: `tests/e2e/helpers.ts`, `tests/e2e/agroblocks.spec.ts`, `tests/e2e/dashboard.spec.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/tutorial.spec.ts` (any old mission id or `/avaliacao/pre`), `README.md`, `docs/metodologia.md`

**Interfaces:**
- Consumes: everything above
- Produces in `tests/e2e/helpers.ts`:
  - `takeWorldTest(page: Page, world: WorldId, form: 'pre' | 'post'): Promise<void>` — asserts the URL `/#/avaliacao/<world>/<pre|pos>`, answers the 10 questions waiting for `Questão n de 10` and exactly 4 radios before each answer, then clicks the next link
  - `withWorldTests(save: SaveData, worlds: WorldId[], forms: ('pre' | 'post')[]): SaveData` — stores empty-answer responses
  - `takePreTest` is removed; `withStudent` stops adding the global pre-test

- [ ] **Step 1: Write the tests** in `tests/e2e/worlds.spec.ts`:
  - `a new student goes from the training to the Horta pre-test and its first mission` — register, skip the tutorial, open `/#/missoes`, see `Mundo 1: Horta`, click the pre-test node, `Fazer a prova`, `takeWorldTest(page, 'garden', 'pre')`, land on `/#/jogar/garden-01`.
  - `finishing the Horta post-test opens the Milharal` — seed a save with garden missions completed and garden pre stored, go to `/#/missoes`, the card of the post-test shows `Fazer a prova`, take it, back on `/#/missoes` click `Próximo mundo`, see `Mundo 2: Milharal` without the veil.
  - `a closed world shows the lock message` — fresh registered save, `Próximo mundo` shows `Conclua o mundo Horta para abrir este`.
  Update the other specs to the new ids (`garden-04` replaces `m1-first-harvest`, `cornfield-02` replaces `m2-row-planting`, and so on per the Task 1 table) and to the world tests.
- [ ] **Step 2: Run** the E2E command — Expected: all pass.
- [ ] **Step 3: Write the docs**
  - README: replace the phases/avaliação text with the six worlds (table name, concept), 10 missions each, prova inicial e final por mundo, and the dashboard by world.
  - `docs/metodologia.md`: provas por mundo (10 itens pareados, 4 montar, 3 prever, 3 consertar), aplicadas antes da primeira e depois da décima missão de cada mundo; análise de ganho por conceito; remove the single pre/post description and the session plan tied to 6 phases.
  - `docs/decisions/0012-concept-worlds.md`: context (one mission per concept was too little practice; one global test mixed concepts), decision (6 worlds × 10 missions, per-world paired tests, save version 2, themed 3D farms), consequences (60 missions and 120 items to maintain; old saves restart progress; snapshots in the old format are rejected).
- [ ] **Step 4: Verify everything**
```bash
npx tsc --noEmit -p . && npx vitest run --maxWorkers=2 && npm run build
grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts server api --include='*.ts' --include='*.tsx' --include='*.mjs'
```
Expected: tsc clean, all unit tests pass, build OK, grep prints nothing.
- [ ] **Step 5: Commit** `git commit -m "test(e2e): world flow; docs: worlds, per-world tests and methodology"`
