# AgroBlocks World — Fase 6: Limpeza, E2E, verificação e documentação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover a decoração procedural antiga, cobrir as três cenas no E2E, verificar visual e desempenho contra a referência e documentar.

**Spec:** seções 6, 7, 8 · Leia `plan_index.md` antes.

---

### Task 6.1: Remover decoração antiga e cobrir as cenas no E2E

**Files:**
- Delete: `src/render/farm3d/Decorations.tsx`
- Modify: `src/render/sceneLayout.ts`, `src/render/sceneLayout.test.ts`, `src/render/models/modelChoice.ts`, `src/render/models/modelChoice.test.ts`, `src/features/results/CelebrationScene.tsx`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces: `sceneLayout.ts` exporta só `WorldPoint`, `cellToWorld`, `FACING_YAW`; `modelChoice.ts` sem `decorationModelId`.

- [ ] **Step 1: Testes que falham**

Em `src/render/sceneLayout.test.ts`, remover os casos que usam `generateDecorations` e acrescentar:
```ts
import * as sceneLayout from '@/render/sceneLayout'

  it('leaves decoration to the world builder', () => {
    expect(Object.keys(sceneLayout).sort()).toEqual(['FACING_YAW', 'cellToWorld'])
  })
```
Em `src/render/models/modelChoice.test.ts`, remover o caso `'picks decoration models by kind and variant'` e o import de `decorationModelId`; acrescentar:
```ts
import * as modelChoice from '@/render/models/modelChoice'

  it('no longer maps old decoration kinds', () => {
    expect('decorationModelId' in modelChoice).toBe(false)
  })
```
Em `tests/e2e/motion.spec.ts`, acrescentar:
```ts
test('the mission map and the home screen render their 3D worlds without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await page.goto('/')
  await expect(page.locator('.home-scene canvas')).toBeVisible()
  await expect(page.locator('.home-scene .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  await page.goto('/#/missoes')
  await expect(page.locator('.map-scene canvas')).toBeVisible()
  await expect(page.locator('.mission-select__map .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  expect(errors).toEqual([])
})
```

Run: `npx vitest run src/render/sceneLayout.test.ts src/render/models/modelChoice.test.ts`
Expected: FAIL — `generateDecorations`/`DecorationKind`/`decorationModelId` ainda exportados.

- [ ] **Step 2: Remover o código antigo**

- `src/render/sceneLayout.ts`: apagar `DecorationKind`, `Decoration`, `FENCE_GAP`, `fences`, `generateDecorations` e o import de `seededRandom`.
- `src/render/models/modelChoice.ts`: apagar `TREES` e `decorationModelId` e o import de `DecorationKind`.
- `src/features/results/CelebrationScene.tsx`: trocar `import { Barn, Tree, Windmill } from '@/render/farm3d/Decorations'` por `import { Model } from '@/render/models/Model'` e cada `<Barn />`, `<Tree … />`, `<Windmill … />` por `<Model id="barn" fallback={null} />`, `<Model id="tree-a" fallback={null} />` e `<Model id="tower-windmill" fallback={null} />`, mantendo os `group` de posição; reduzir a escala dos grupos se a verificação visual mostrar construções grandes demais (agora o modelo já vem em escala de jogo).
- Apagar `src/render/farm3d/Decorations.tsx`.

Run: `grep -rn "farm3d/Decorations\|generateDecorations\|decorationModelId" src` → Expected: nenhuma linha.

- [ ] **Step 3: Rodar e ver passar**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.
Run: `npx playwright test`
Expected: 14 passed (13 atuais + o novo). O teste "loads only local assets" agora verifica `models.length > 0` com o manifesto cheio.

- [ ] **Step 4: Commit**

```bash
git add -A src tests
git commit -m "refactor(world): drop procedural decorations and cover map and home in E2E"
```

---

### Task 6.2: Verificação visual, desempenho e documentação

**Files:**
- Modify: `README.md`, `docs/decisions/0007-cc0-glb-assets.md`
- Create: `docs/decisions/0008-shared-world-builder.md`

- [ ] **Step 1: Verificação visual contra a referência (obrigatória)**

Com o dev server e o Playwright MCP (1440×900), capturar e comparar lado a lado com `.playwright-mcp/ref/*.png`:
1. Início (`#/`).
2. Mapa (`#/missoes`).
3. Fazenda Fase 1 (`#/jogar/m1-first-harvest`) nas 4 rotações de câmera (botões ↺/↻) — o grid deve estar sempre visível; se uma rotação esconder canteiros atrás de um objeto alto, afaste esse objeto em `farmLayout.ts` e registre.
4. Fazenda Fase 4 executando a 2x.
5. Gráficos leves e "Reduzir animações" ligados: menos itens, animais parados, sem borboletas.

Critérios: chão sem áreas vazias grandes; proporção robô ≈ canteiro, vaca ligeiramente maior que o robô, celeiro bem maior; celeiro vermelho com telhado cinza; nada flutuando nem enterrado (ajustar `targetHeight`/`rotationY` no `assets.config.json` + `npm run assets:build` quando preciso). Cada ajuste vai ao ledger. Fechar o navegador ao terminar.

- [ ] **Step 2: Desempenho**

No navegador, Fase 4 executando a 2x por 10 s, medir FPS com `requestAnimationFrame` (como na verificação da fase anterior). Expected: média ≥ 55. Se menor: reduzir `total` do `addClutter` da fazenda (460 → 340) e o anel de floresta (110 → 80), depois `shadow-mapSize` para 1024, nessa ordem, medindo após cada passo e registrando.

Run: `du -ch public/models/*.glb | tail -1`
Expected: ≤ 10 MB.

- [ ] **Step 3: Documentação**

`README.md`, seção "Movimento e assets", trocar o item "Modelos 3D" por:
```markdown
- **Mundo 3D:** `src/render/world/buildWorld.ts` gera, de forma determinística, o ambiente das três cenas (fazenda do jogo, mapa de missões e tela inicial): pátio com celeiros, silos e moinhos, pasto cercado com animais que passeiam, pomar, rio com ponte, caminhos de terra, floresta e chão coberto de grama e flores. Os modelos são CC0 (Kenney Nature Kit, Quaternius Nature Crops, Farm Buildings, Farm Animals, Stylized Nature MegaKit e Animated Robot), convertidos para GLB em `public/models/` (≤ 10 MB) com escala calculada pela altura real de cada objeto. Uma tela de carregamento cobre cada cena até os modelos chegarem.
```
Na lista "Decisões técnicas", acrescentar `8. Mundo compartilhado gerado por função pura, com instancing.`

`docs/decisions/0008-shared-world-builder.md`:
```markdown
# 0008 — Mundo compartilhado gerado por função pura

**Contexto:** as cenas pareciam vazias, com proporções erradas, e cada uma tinha seu próprio espalhamento de árvores.

**Decisão:** uma função pura `buildWorld({ layout, gridWidth, gridHeight, seed, density })` gera terreno (polilinhas de caminho e rio), props, pasto, animais e borboletas para `farm`, `map` e `home`, com regras testadas (grid livre e visível, caminhos e rio livres, objetos altos fora da frente da câmera). A renderização usa instancing por modelo; animais seguem uma máquina de estados pura animada com Motion.

**Consequências:** cenas cheias e coerentes com a referência, determinísticas por semente e testáveis sem WebGL; ~60 modelos e ~8–10 MB de assets; a splash de carregamento esconde o tempo de download.
```

Em `docs/decisions/0007-cc0-glb-assets.md`, trocar a linha de status por: `**Status:** aceita e implementada; escala por altura-alvo medida na conversão e orçamento ampliado para 10 MB (ver 0008).`

- [ ] **Step 4: Gate completo**

```bash
npm run typecheck
npx vitest run --maxWorkers=2
npx playwright test
npm run build
grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts --include='*.ts' --include='*.tsx' --include='*.mjs'
```
Expected: tudo verde e o último comando sem saída.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/decisions
git commit -m "docs: document the shared 3D world builder"
```

- [ ] **Step 6: Revisão final**

Seguir `superpowers:executing-plans` › Final Review: pacote de revisão desde o commit da spec (`git log --oneline | grep "spec for full 3D world"`), revisor no modelo mais capaz com o Review Focus do `plan_index.md` e as linhas `Ruling:` do ledger; um passe de correções RED→GREEN; depois `superpowers:finishing-a-development-branch`.
