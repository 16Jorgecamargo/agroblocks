# Phase 5 — E2E, docs, verification and final review

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Read `plan_index.md` first (Global Constraints).

**Spec:** section 8 and success criteria 1–6.

### Task 5.1: End-to-end tutorial run

**Files:**
- Create: `tests/e2e/tutorial.spec.ts`
- Modify: `tests/e2e/agroblocks.spec.ts` (the two tutorial tests at the top), `tests/e2e/helpers.ts`

**Interfaces:**
- Consumes: everything from Phases 1–4; helpers `seedStorage(page, options)`, `openMission(page, missionId)` (clicks the first button whose name contains "Começar"; the welcome button "Começar treinamento" matches).
- Produces: `dragFromToolbox(page, category: string, label: string, dropBelow: 'hat' | number): Promise<void>` in `tests/e2e/helpers.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/e2e/helpers.ts`:
```ts
export async function dragFromToolbox(page: Page, category: string, label: string, dropBelow: 'hat' | number): Promise<void> {
  await page.getByRole('treeitem', { name: new RegExp(category) }).click()
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: label }).first()
  const anchor =
    dropBelow === 'hat'
      ? page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: 'quando executar' }).first()
      : page.locator('.blocklyBlockCanvas > .blocklyDraggable .blocklyDraggable').nth(dropBelow)
  const from = await source.boundingBox()
  const to = await anchor.boundingBox()
  if (!from || !to) throw new Error('blocks not visible')
  const targetY = dropBelow === 'hat' ? to.y + 62 : to.y + 40
  await page.mouse.move(from.x + 12, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + 36, targetY, { steps: 20 })
  await page.mouse.up()
}
```

If the `nth(dropBelow)` selector does not find the stacked block (Blockly nests the next block inside the previous block's `<g>`), use instead `page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: /^mover para frente$/ }).last()` measured by its own `<path>`: `anchor.locator('> .blocklyPath').first().boundingBox()`, and drop at `to.y + to.height + 6`. Record the working selector as a ledger ruling.

`tests/e2e/tutorial.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test'
import { dragFromToolbox, openMission, seedStorage } from './helpers'

async function progress(page: Page, value: string) {
  await expect(page.getByTestId('tutorial-progress')).toHaveText(value)
}

async function practise(page: Page, title: string) {
  const dialog = page.getByRole('dialog', { name: title })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.howto-hand')).toBeVisible()
  await dialog.getByRole('button', { name: 'Praticar' }).click()
  await expect(dialog).toBeHidden()
}

async function calloutClearOfTarget(page: Page, target: string) {
  const callout = await page.locator('.tutorial-callout').boundingBox()
  const area = await page.locator(`[data-tutorial="${target}"]`).boundingBox()
  if (!callout || !area) throw new Error('missing boxes')
  const overlapX = Math.min(callout.x + callout.width, area.x + area.width) - Math.max(callout.x, area.x)
  const overlapY = Math.min(callout.y + callout.height, area.y + area.height) - Math.max(callout.y, area.y)
  expect(overlapX <= 0 || overlapY <= 0).toBe(true)
}

test('the training teaches every part of the screen with real actions', async ({ page }) => {
  test.setTimeout(120_000)
  await seedStorage(page, { settings: { motion: 'reduced' } })
  await openMission(page, 'm0-training')
  await progress(page, '2/15')
  await calloutClearOfTarget(page, 'hud-goal')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await progress(page, '3/15')
  await calloutClearOfTarget(page, 'farm')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await progress(page, '4/15')
  await practise(page, 'Como adicionar um bloco')
  await calloutClearOfTarget(page, 'editor')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 'hat')
  await progress(page, '5/15')
  await practise(page, 'Como encaixar blocos')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 0)
  await progress(page, '6/15')

  await practise(page, 'Como apagar um bloco')
  const last = page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: /^mover para frente$/ }).last()
  await last.click()
  await page.keyboard.press('Delete')
  await progress(page, '7/15')

  await practise(page, 'Como ver o pseudocódigo')
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await progress(page, '8/15')

  await practise(page, 'Como executar e parar')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 0)
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.getByRole('button', { name: 'Parar' }).click()
  await progress(page, '9/15')

  await practise(page, 'Como usar o passo a passo')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await page.locator('.execution-panel').getByRole('button', { name: 'Próximo' }).click()
  await progress(page, '10/15')
  await page.locator('.execution-panel').getByRole('button', { name: 'Parar' }).click()
  await page.getByRole('switch', { name: 'Passo a passo' }).click()

  await practise(page, 'Como pedir uma dica')
  await page.getByRole('tab', { name: 'Dicas' }).click()
  await page.getByRole('button', { name: /Pedir dica/ }).click()
  await progress(page, '11/15')

  await practise(page, 'Experimento: andar demais')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 1)
  await dragFromToolbox(page, 'Agricultura', 'colher planta', 2)
  await page.getByRole('button', { name: 'Executar' }).click()
  await progress(page, '12/15')
  await expect(page.getByRole('tab', { name: 'Console' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('log')).toContainText('pedra')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await practise(page, 'Como corrigir o programa')
  const third = page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: /^mover para frente/ }).nth(2)
  await third.locator('> .blocklyPath').first().click()
  await page.keyboard.press('Delete')
  await page.getByRole('button', { name: 'Executar' }).click()
  await progress(page, '14/15')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await expect(page.getByRole('dialog', { name: 'Treinamento concluído!' })).toBeVisible()
  await page.getByRole('button', { name: 'Ir para as missões' }).click()
  await expect(page).toHaveURL(/#\/missoes$/)
})

test('the spotlight blocks clicks outside the current area', async ({ page }) => {
  await seedStorage(page, {})
  await openMission(page, 'm0-training')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('dialog', { name: 'Como adicionar um bloco' }).getByRole('button', { name: 'Praticar' }).click()
  const run = await page.getByRole('button', { name: 'Executar' }).boundingBox()
  if (!run) throw new Error('missing run button')
  await page.mouse.click(run.x + run.width / 2, run.y + run.height / 2)
  await expect(page.getByRole('button', { name: 'Executar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Parar' })).toHaveCount(0)
  await progress(page, '4/15')
})
```

Note the reduced-motion seed keeps the robot fast and the how-to stage still (frames) so screenshots and timing are stable; the "Praticar" path is identical.

Rewrite the two tutorial tests at the top of `tests/e2e/agroblocks.spec.ts`:
- First test: replace `await page.getByRole('button', { name: 'Começar' }).click()` and `await expect(page.getByText('1/6')).toBeVisible()` with
```ts
  await expect(page.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeVisible()
  await page.getByRole('button', { name: 'Começar treinamento' }).click()
  await expect(page.getByTestId('tutorial-progress')).toHaveText('2/15')
```
- Second test (`builds a program by dragging a real block into the editor`): delete it; `tests/e2e/tutorial.spec.ts` covers dragging real blocks, and the pseudocode panel is covered there at step 7.

- [ ] **Step 2: Run to verify they fail, then pass**

Run:
```bash
pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test tests/e2e/tutorial.spec.ts tests/e2e/agroblocks.spec.ts
```
Expected: PASS. On failure, open the trace (`npx playwright show-trace`) and fix the selector or the app, never loosen the assertion; ledger every selector change.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): walk the guided tutorial with real editor actions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5.2: Docs, visual verification, gate, final review

**Files:**
- Modify: `README.md`
- Create: `docs/decisions/0010-guided-tutorial-howto.md`

- [ ] **Step 1: Docs**

`README.md` line with "Treinamento guiado por ações reais": replace by
`- Treinamento guiado em 15 etapas: holofote na área real da tela com balão apontando, e antes de cada ação uma animação mostra como fazer (adicionar, encaixar e apagar blocos, executar e parar, passo a passo, dicas, console, pseudocódigo e corrigir erro) + 6 fases (sequência, repetição, condicionais, sensores, variáveis, depuração e eficiência).`

`docs/decisions/0010-guided-tutorial-howto.md`:
```markdown
# 0010 — Tutorial guiado com animações de demonstração

**Contexto:** o balão central do treinamento cobria a fazenda, não apontava para nada e não mostrava como fazer as ações.

**Decisão:** roteiro de 15 etapas em dados, máquina de estados pura alimentada por sinais do jogo, holofote que recorta as áreas reais (`data-tutorial`) e animações de demonstração feitas com uma réplica do editor em HTML e uma mão animada, descritas como roteiros de batidas no tempo.

**Consequências:** o aluno vê cada gesto antes de praticar; as animações não dependem do Blockly e são testadas sem navegador; mudanças visuais do editor real exigem ajustar a réplica à mão.
```

- [ ] **Step 2: Visual verification (required)**

Dev server on 5179 (`npx vite --port 5179 --strictPort`). With a Playwright script at 1440×900, capture `#/jogar/m0-training` at: welcome dialog; step 2 (callout below the HUD, arrow pointing up at the goal); step 3; step 4 how-to dialog mid-animation (hand dragging a block); step 4 practice (editor lit, rest dimmed, callout right of the editor); step 6 how-to with the three tabs; step 8 while running (layout shift: holes follow the editor and execution panel); step 12 (Console selected); outro. Check: no callout covers its target; arrow points at the target; the hand and blocks are inside the stage; dimming never covers a dialog. Repeat steps 4 and 6 with "Reduzir animações" on (frames + arrows, no loop). Ledger each adjustment as a ruling.

- [ ] **Step 3: Full gate**

```bash
npx tsc --noEmit -p .
npx vitest run --maxWorkers=2
pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test
npm run build
grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts --include='*.ts' --include='*.tsx' --include='*.mjs'
```
Expected: all green; the last command prints nothing.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/decisions/0010-guided-tutorial-howto.md
git commit -m "docs: document the guided tutorial with how-to animations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Final review**

Follow the executor skill's Final Review: review package from the spec commit (`git log --oneline | grep "spec for guided tutorial"`) to HEAD; reviewer on the most capable model with the Review Focus of `plan_index.md` and the ledger's `Ruling:` lines; one RED→GREEN fix pass for Critical/Important; minors to the ledger; then `superpowers:finishing-a-development-branch`.
