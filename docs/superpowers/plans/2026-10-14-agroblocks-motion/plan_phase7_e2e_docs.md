# AgroBlocks Motion — Fase 7: Testes de interface, documentação e verificação final

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrir com Playwright o fechamento de diálogo com retorno de foco, o carregamento dos GLB sem requisições externas, o modo de movimento reduzido e o halo do bloco em execução; atualizar documentação e fazer a verificação visual final.

**Architecture:** Novos testes em `tests/e2e/motion.spec.ts` usando os helpers existentes. Documentação em `README.md`, `docs/decisions/` e `docs/motion.md`.

**Tech Stack:** @playwright/test, Markdown.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 6)

Leia `plan_index.md` antes de começar.

---

### Task 7.1: E2E de movimento, diálogos e assets

**Files:**
- Create: `tests/e2e/motion.spec.ts`
- Modify: `tests/e2e/agroblocks.spec.ts` (somente se seletores mudaram)

**Interfaces:**
- Consumes: `seedStorage`, `saveWithProgram`, `openMission`, `getMission`.

- [ ] **Step 1: Rodar a suíte E2E atual**

Run: `npx playwright test > /tmp/e2e-before.log 2>&1; tail -5 /tmp/e2e-before.log`
Expected: 9 passed. Se algum falhar por mudança de marcação desta reformulação (ex.: botão dentro de `motion`, diálogo ainda saindo), ajuste apenas o seletor ou a espera (`await expect(...).toBeHidden()` antes do próximo clique) e registre no ledger.

- [ ] **Step 2: Escrever `tests/e2e/motion.spec.ts`**

```ts
import { expect, test } from '@playwright/test'
import { getMission } from '@/data/missions'
import { openMission, saveWithProgram, seedStorage } from './helpers'

const firstHarvest = getMission('m1-first-harvest')
if (!firstHarvest) throw new Error('mission missing')

test('a game dialog closes, leaves the DOM and returns focus to its opener', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full' } })
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Configurações' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.game-dialog__ribbon')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('the 3D farm loads local GLB models without external requests or errors', async ({ page }) => {
  const errors: string[] = []
  const external: string[] = []
  const models: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/models/') && url.endsWith('.glb')) models.push(url)
    const local = url.startsWith('http://localhost:4173') || url.startsWith('data:') || url.startsWith('blob:')
    const font = url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')
    if (!local && !font) external.push(url)
  })
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(2500)
  expect(errors).toEqual([])
  expect(external).toEqual([])
  expect(models.length).toBeGreaterThan(0)
})

test('reduced motion starts screens without transform animations and without confetti', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'reduced' }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await page.goto('/')
  const transform = await page.locator('.home__tagline').evaluate((element) => getComputedStyle(element).transform)
  expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await expect(page.locator('.confetti__piece')).toHaveCount(0)
})

test('the running block glows and the harvest flies to the counter in full motion', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full', renderMode: '2d', defaultSpeed: 0.5 }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect
    .poll(async () => page.locator('.blocklyBlockCanvas .blocklyPath').evaluateAll((paths) => paths.some((path) => (path as SVGElement).style.filter.includes('drop-shadow'))))
    .toBe(true)
  await expect(page.locator('.harvest-flight')).toHaveCount(1, { timeout: 20_000 })
  await expect(page.getByRole('group', { name: 'Colheita: 1' })).toBeVisible({ timeout: 20_000 })
})
```

- [ ] **Step 3: Rodar**

Run: `npx playwright test > /tmp/e2e.log 2>&1; grep -E "passed|failed|✘" /tmp/e2e.log`
Expected: 13 passed. Para falhas reais, escrever primeiro um teste unitário que reproduza o defeito na camada certa, corrigir e rodar `npx vitest run && npx playwright test` de novo.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): cover dialog focus return, local GLB loading, reduced motion and running block halo"
```

---

### Task 7.2: Documentação

**Files:**
- Modify: `README.md`, `docs/decisions/0002-procedural-three-scene.md`
- Create: `docs/decisions/0006-motion-everywhere.md`, `docs/decisions/0007-cc0-glb-assets.md`

- [ ] **Step 1: Atualizar `README.md`**

Acrescentar após a seção "Arquitetura":
````markdown
## Movimento e assets

- **Animações:** toda animação usa [Motion](https://motion.dev) — `motion/react` na interface e `animate()` sobre objetos Three.js na cena 3D. Molas, durações e easings ficam em `src/motion/` e seguem a [Motion Reference](https://motion-reference.takayustudio.jp). Tabela completa em `docs/motion.md`.
- **Modelos 3D:** pacotes CC0 (Kenney Nature Kit, Quaternius Ultimate Crops e Animated Robot) convertidos para GLB em `public/models/`. Créditos em `CREDITS.md`. Se um modelo faltar ou falhar, a cena usa a versão procedural.

Regenerar os modelos (só em desenvolvimento):

```bash
# coloque nature-kit.zip, crops.zip e robot.zip em assets-src/
npm run assets:inspect
# ajuste scripts/assets/assets.config.json se trocar de modelo
npm run assets:build
```
````
Na seção "Decisões técnicas", acrescentar os itens 6 e 7: "Motion como camada única de animação" e "Assets CC0 em GLB com fallback procedural".

- [ ] **Step 2: Criar os ADRs**

`docs/decisions/0006-motion-everywhere.md`:
```markdown
# 0006 — Motion como camada única de animação

**Contexto:** a primeira versão misturava CSS keyframes, `useFrame` manual e transições ad hoc; o resultado foi considerado fraco pelo usuário, que pediu Motion em tudo que fosse possível.

**Decisão:** `motion/react` para interface (variants, `AnimatePresence`, `layout`, `useAnimate`) e `animate()` de `motion` sobre objetos Three.js e `MotionValue`s na cena 3D. Valores nomeados em `src/motion/` a partir da Motion Reference.

**Consequências:** linguagem de movimento única; "Reduzir animações" vale para tudo via `MotionConfig`; dependência a mais (~40 KB gzip).
```

`docs/decisions/0007-cc0-glb-assets.md`:
```markdown
# 0007 — Assets CC0 em GLB com fallback procedural

**Contexto:** os modelos procedurais ficaram abaixo da qualidade desejada.

**Decisão:** usar pacotes CC0 (Kenney, Quaternius), convertidos e otimizados em tempo de desenvolvimento por `scripts/assets/`, versionados em `public/models/` com manifesto validado (Zod) e orçamento de 5 MB. Cada modelo tem fallback procedural via error boundary.

**Consequências:** qualidade visual muito maior, funcionamento offline, licença livre inclusive comercial; o download dos pacotes é manual quando a rede bloqueia os sites de origem.
```

Em `docs/decisions/0002-procedural-three-scene.md`, acrescentar ao fim: `**Status:** substituída parcialmente pela decisão 0007 (os modelos procedurais viraram fallback).`

- [ ] **Step 3: Commit**

```bash
git add README.md docs/decisions
git commit -m "docs: document Motion system and CC0 asset pipeline"
```

---

### Task 7.3: Verificação final

- [ ] **Step 1: Gate completo**

```bash
npm run typecheck
npx vitest run
npx playwright test
npm run build
```
Expected: tudo verde.

- [ ] **Step 2: Sem comentários e sem números de animação soltos**

Run: `grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts '--include=*.ts' '--include=*.tsx' '--include=*.mjs'`
Expected: nenhuma linha.

Run: `grep -rnE "stiffness:|damping:" src '--include=*.tsx' '--include=*.ts' | grep -v "src/motion/"`
Expected: nenhuma linha (molas só em `src/motion/springs.ts`).

- [ ] **Step 3: Orçamento e desempenho**

Run: `du -ch public/models/*.glb | tail -1`
Expected: ≤ 5 MB.

No navegador (DevTools › Performance, 10 s na Fase 4 executando a 2x, gráficos normais): FPS médio ≥ 55. Se ficar abaixo, ativar `Instances` para canteiros/cercas e reduzir sombras (`shadow-mapSize` 512) e registrar.

- [ ] **Step 4: Verificação visual contra a referência**

Capturar screenshots (1440×900) de: início, mapa de missões, briefing, configurações, gameplay parado, gameplay com erro, colheita em voo, resultado. Comparar com `reference/AgroBlocks_ Fazenda Inteligente em Ação.png` e com a spec (diálogos com fita, modelos CC0, animações listadas). Corrigir divergências antes de concluir.

- [ ] **Step 5: Critérios de aceite da spec**

Marcar cada critério da seção 6 da spec com o teste ou screenshot que o comprova. Item sem comprovação vira correção + teste.

- [ ] **Step 6: Commit final**

```bash
git status
git add -A
git commit -m "chore: final verification for motion and assets redesign"
```
Use `git add -A` só depois de confirmar no `git status` que não há `assets-src/`, `test-results/`, `playwright-report/` ou `.playwright-mcp/`.
