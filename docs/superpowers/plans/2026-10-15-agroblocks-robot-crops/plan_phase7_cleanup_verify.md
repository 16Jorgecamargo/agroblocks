# Phase 7 — Asset cleanup, docs, verification and final review

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** sections 9, 10.

### Task 7.1: Remove robot, crop, straw and fence GLBs from the pipeline

**Files:**
- Modify: `scripts/assets/assets.config.json`, `scripts/assets/build.mjs`, `scripts/assets/sources.json`, `src/render/models/generatedModels.test.ts`
- Regenerate: `public/models/*`, `src/render/models/manifest.generated.json`

**Interfaces:**
- Consumes: Tasks 1.1, 2.1 and 3.2 already removed every code reference to these ids.

- [ ] **Step 1: Write the failing test**

Add to `src/render/models/generatedModels.test.ts`:
```ts
  it('no longer ships models that are now drawn in code', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of ['robot', 'crop-1', 'crop-2', 'crop-3', 'crop-4', 'crop-5', 'straw', 'fence', 'fence-gate']) expect(ids).not.toContain(id)
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/render/models/generatedModels.test.ts`
Expected: FAIL — `robot` is still in the generated manifest.

- [ ] **Step 3: Remove the entries and rebuild**

- `scripts/assets/assets.config.json`: delete the model objects with ids `crop-5`, `crop-1`, `crop-2`, `crop-3`, `crop-4`, `straw`, `fence`, `fence-gate` and `robot`. Keep `apple-tree` (crops pack) untouched.
- `scripts/assets/build.mjs` line 14: `const REQUIRED = ['tree-a', 'tree-b', 'tree-c', 'pine', 'rock-a', 'rock-b', 'bush']`.
- `scripts/assets/sources.json`: delete the pack whose `"id"` is `"robot"` (no model references it any more).

Run: `npm run assets:build`
Expected: completes without "scaleLike sem referência"; prints the model list without the removed ids.

Run: `du -ch public/models/*.glb | tail -1`
Expected: smaller than the previous 2.64 MB.

- [ ] **Step 4: Run tests**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A scripts public/models src/render/models
git commit -m "chore(assets): drop robot, crop, straw and fence GLBs now drawn in code

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7.2: Docs, visual and performance verification, final review

**Files:**
- Modify: `README.md`, `docs/decisions/0007-cc0-glb-assets.md`
- Create: `docs/decisions/0009-procedural-robot-crops-fences.md`

- [ ] **Step 1: Documentation**

`README.md`, in the "Mundo 3D" item, replace `Farm Animals, Stylized Nature MegaKit e Animated Robot)` with `Farm Animals e Stylized Nature MegaKit)` and append to the item: ` O robô, o tomateiro (plantado, crescendo, pronto para colher) e as cercas são desenhados em código, com animações de pose para cada ação do robô.` Add after it:
```markdown
- **Legenda:** o botão "Legenda" da fazenda abre um painel com uma página por estado do solo (vazio, preparado, molhado, plantado, crescendo, pronto para colher) e pelos elementos da fazenda, cada uma com o canteiro em 3D, o bloco que leva até ali e o próximo passo.
- **Recursos no HUD:** sementes, água, energia e colheita só aparecem nas fases que usam o recurso.
```
In "Decisões técnicas" add `9. Robô, tomateiro e cercas procedurais com poses calculadas por funções puras.`

`docs/decisions/0009-procedural-robot-crops-fences.md`:
```markdown
# 0009 — Robô, tomateiro e cercas procedurais

**Contexto:** o robô do Quaternius não lembrava o robô da referência e só tinha 4 animações; o tomate era fino e não mostrava quando estava pronto; a cerca esticada parecia errada.

**Decisão:** desenhar robô, tomateiro e cercas em código. As animações do robô são poses calculadas por `poseAt(clip, tempo)`, e o clip é escolhido por `clipForStep` a partir dos eventos do passo. O tomateiro vem de `cropShape(estágio)` com três estágios; as cercas vêm de `fencePieces` e são desenhadas com instancing.

**Consequências:** visual fiel à referência, 10 animações testáveis sem WebGL, menos megabytes de modelos; ajustes de forma passam a ser alterações de código.
```
In `docs/decisions/0007-cc0-glb-assets.md`, append the line: `Robô, plantas do canteiro e cercas deixaram de usar GLB (ver 0009).`

- [ ] **Step 2: Visual verification (required)**

Close any other browser. Dev server on 5179; Playwright MCP at 1440×900 (and 390×844 where noted). Compare with `reference/AgroBlocks_ Fazenda Inteligente em Ação.png` and `.playwright-mcp/ref/*.png`:
1. Home `#/` — reference robot idling (blinks, looks around), tomato beds with all three stages.
2. Fase 2 `#/jogar/m2-row-planting` running at 1x then 4x — till (hoe + soil burst), plant (seed bag + seed drop), move (wheels), turn (wheels opposite); at 4x every clip returns to rest before the next step; HUD shows only Sementes.
3. Fase 3 — water (watering can + splash); HUD only Água.
4. Fase 4 `#/jogar/m4-auto-harvest` — ready tomatoes unmistakable (red fruit, gold ring, spark) next to growing bushes; harvest (claw + pop); HUD only Colheita; harvest flight lands on the chip.
5. Fase 5 — collect (antenna flash); error by walking into a rock: red X eyes and red antenna while the error lasts.
6. Fase 6 — HUD shows Sementes, Água, Energia; harvest flight absent without crash.
7. Fences in the farm, home and map: dark posts, two rails, gates with crossed braces, no floating or overlapping posts; corners of the grid fence.
8. Legend: open, visit all 10 pages, 3D preview rotates; with "Reduzir animações" it stops; with renderMode 2D the 2D tile shows; mobile 390×844 list becomes a horizontal strip.
9. Success screen at 1440×900 and 390×844 (see Task 6.2 Step 6 criteria).
10. "Gráficos leves" + "Reduzir animações": robot still poses with correct eyes, no sway/spark, celebration lighter.
Every adjustment goes to the ledger as a ruling. Close the browser.

- [ ] **Step 3: Performance**

Fase 4 running at 2x for 10 s, measure frame cost as in the previous plan (render time per frame via `requestAnimationFrame` deltas and `renderer.info`). Expected: no perceptible regression versus ~2 ms render cost. If worse, first share `CropPlant` leaves through instancing per bed, then reduce celebration clutter; measure after each step and ledger.

- [ ] **Step 4: Full gate**

```bash
npm run typecheck
npx vitest run --maxWorkers=2
npx playwright test
npm run build
grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts --include='*.ts' --include='*.tsx' --include='*.mjs'
```
Expected: all green (16 E2E) and the last command prints nothing.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/decisions
git commit -m "docs: document the procedural robot, crops, fences, legend and HUD rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Final review**

Follow the executor skill's Final Review: review package from the spec commit (`git log --oneline | grep "spec for reference robot"`) to HEAD; reviewer on the most capable model with the Review Focus of `plan_index.md` and the ledger's `Ruling:` lines; one RED→GREEN fix pass for Critical/Important; minors to the ledger; then `superpowers:finishing-a-development-branch`.
