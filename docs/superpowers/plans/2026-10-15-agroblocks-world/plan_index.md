# AgroBlocks — Ambiente do mundo 3D completo — Índice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar fazenda do jogo, mapa de missões e tela inicial em ambientes cheios e vivos como a imagem de referência: proporções corretas, construções Quaternius vermelhas com telhado cinza, floresta, rio com ponte, caminhos, chão coberto de grama e flores, animais andando, borboletas, e uma splash de carregamento.

**Architecture:** Pipeline de assets passa a calcular escala por altura-alvo (medindo com three em Node para modelos com esqueleto) e a recolorir/comprimir texturas. Uma função pura `buildWorld` gera o mundo (terreno em polilinhas, props, pasto, animais, borboletas) para três layouts; renderizadores R3F desenham terreno em faixas curvas, props com instancing e animais com uma máquina de estados pura animada por Motion. Uma `SceneWithSplash` cobre cada canvas até o carregamento terminar.

**Tech Stack:** React 19, three 0.186, @react-three/fiber 9, drei 10, motion 14, Vitest 5, Playwright, @gltf-transform (core/functions/extensions), fbx2gltf, sharp (novo), obj2gltf.

**Spec:** `docs/superpowers/specs/2026-10-15-agroblocks-world-environment-design.md` · Referência: `reference/AgroBlocks_ Fazenda Inteligente em Ação.png` (recortes `.playwright-mcp/ref/home.png`, `map.png`, `gameplay.png`)

## Ordem de execução

| Ordem | Arquivo | Entrega | Depende de |
|---|---|---|---|
| 1 | `plan_phase1_pipeline.md` | Escala por altura-alvo, tint, WebP, ~60 modelos novos, orçamento 10 MB | — |
| 2 | `plan_phase2_world_layout.md` | Geometria, tipos, `buildWorld` (farm/map/home) | 1 (ids de modelo) |
| 3 | `plan_phase3_rendering.md` | Terreno em faixas, props com instancing, moinho girando, fazenda integrada | 1, 2 |
| 4 | `plan_phase4_life.md` | Cérebro dos animais, `Animal`/`Herd`, borboletas, vitórias-régias | 2, 3 |
| 5 | `plan_phase5_scenes_splash.md` | Splash de carregamento; mapa de missões e tela inicial com o mundo | 2–4 |
| 6 | `plan_phase6_verify.md` | Limpeza, E2E, verificação visual e de desempenho, docs, revisão final | 1–5 |

Ao fim de cada fase: `npm run typecheck && npx vitest run --maxWorkers=2` verdes. (A máquina do usuário tem pouca memória livre; feche o navegador do Playwright MCP antes de rodar a suíte inteira.)

## Global Constraints

- Nunca escrever comentários no código (TS, TSX, CSS, MJS).
- Identificadores e arquivos em inglês; texto visível em português brasileiro.
- Toda animação usa Motion (`motion/react` ou `animate` de `motion`); proibido `@keyframes`/`transition` CSS novos para movimento.
- Molas só em `src/motion/springs.ts`; durações só em `src/motion/presets.ts` (`DURATIONS`) — o teste `src/motion/noLooseDurations.test.ts` reprova `duration:`/`repeatDelay:` com número literal fora de `src/motion`.
- "Reduzir animações" ou "Gráficos leves": animais parados em pose idle, sem borboletas, sem moinho girando, sem balanço; `light` também remove grama/flores/pedrinhas e metade da floresta.
- Modelos apenas CC0, convertidos em desenvolvimento, total ≤ 10 MB (`MODEL_BUDGET_BYTES = 10 * 1024 * 1024`), nenhum carregamento externo em runtime.
- Proporções (unidade = 1 canteiro): robô 0,9 · tomateiro maduro 0,8 · vaca 1,1 · cavalo 1,5 · porco 0,6 · ovelha 0,75 · lhama 1,4 · cachorro 0,45 · árvore 2,4–3,0 · pinheiro 3,0 · macieira 2,2 · celeiro grande 4,5 · celeiro pequeno 2,6 · silo 6 · moinho 6 · caixa-d'água 5.
- Objetos com altura > 1,2 no meio-plano frontal da câmera (`x + z > 0`) ficam a ≥ 5 unidades do retângulo do grid; nenhum prop a menos de 1,2 do grid exceto as cercas do grid.
- Cenas 3D continuam `aria-hidden`; a splash usa `role="status"`.
- Os testes existentes continuam verdes (ajustes de seletor/expectativa registrados no ledger).

## Review Focus

1. **Manifesto sem algum modelo do mundo** (asset faltando ou GLB quebrado) — a cena deve renderizar terreno e o resto dos props sem travar e a splash deve sumir. Coberto: `InstancedModel` retorna `null` sem entrada; boundary por modelo (Task 3.2); teste da splash com erro de carregamento (Task 5.1).
2. **Grids de tamanhos diferentes entre missões** — nenhum prop sobre o grid nem sobre caminhos/rio para todas as missões existentes. Coberto: teste de `buildWorld` iterando `MISSIONS` (Task 2.2).
3. **Gráficos leves / movimento reduzido ligados com animais andando** — animais param no lugar, sem clipe pendurado. Coberto: `Animal` reage a `active=false` parando controles (Task 4.2) e teste do cérebro (Task 4.1).
4. **Câmera girada em quarto de volta** — objetos altos atrás podem ficar na frente; espera-se grid ainda visível nas 4 rotações. Coberto: verificação visual obrigatória nas 4 rotações (Task 6.2).
5. **Splash presa** — rede lenta, erro de GLB ou manifesto vazio; espera-se a splash sumir quando o canvas existe e o carregador está ocioso. Coberto: testes da `SceneWithSplash` (Task 5.1).
