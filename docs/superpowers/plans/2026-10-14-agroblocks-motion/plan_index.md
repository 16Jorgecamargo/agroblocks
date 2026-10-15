# AgroBlocks Motion & Assets Redesign — Índice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer animações, diálogos e assets do AgroBlocks usando a biblioteca Motion em toda a interface e na cena 3D, diálogos no estilo painel de jogo e modelos 3D CC0 em GLB.

**Architecture:** Camada única de movimento em `src/motion/` (molas, easings, presets da Motion Reference) consumida por componentes de jogo em `src/components/game/`, pelas telas e pela cena R3F (via `animate()` sobre objetos Three.js). Modelos CC0 convertidos em desenvolvimento para `public/models/`, com manifesto validado e fallback procedural. Engine, interpretador, controller e dados não mudam.

**Tech Stack:** `motion` 14, React 19, R3F/drei, Zod, Vitest, Playwright, `obj2gltf`/`fbx2gltf`/`@gltf-transform`.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` · Referências: https://motion-reference.takayustudio.jp e `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`

## Ordem de execução

| Ordem | Arquivo | Entrega | Depende de |
|---|---|---|---|
| 1 | `plan_phase1_motion_foundation.md` | Motion instalado, `src/motion/`, provider global, `docs/motion.md` | — |
| 2 | `plan_phase2_ui_kit_dialogs.md` | `GameButton`, `GameToggle`, `PillTabs`, `GameDialog`; migração dos diálogos | 1 |
| 3 | `plan_phase3_screens.md` | Rotas animadas, início, mapa, resultado, avaliação | 1, 2 |
| 4 | `plan_phase4_gameplay.md` | HUD odômetro, voo da colheita, painel, console, dicas, tutorial, Blockly halo | 1–3 |
| 5 | `plan_phase5_asset_pipeline.md` | Manifesto tipado, conversão CC0 → GLB, `CREDITS.md` (**download manual pode ser necessário**) | 1 |
| 6 | `plan_phase6_scene3d.md` | Modelos na cena, robô animado, câmera, efeitos, 2D com Motion | 4, 5 |
| 7 | `plan_phase7_e2e_docs.md` | E2E, documentação, verificação visual e de desempenho | 1–6 |

Ao fim de cada fase: `npm run typecheck && npx vitest run` verdes e app executável.

## Global Constraints

- Nunca escrever comentários no código (TS, TSX, CSS, MJS, Python).
- Identificadores e arquivos em inglês; texto visível em português brasileiro.
- Toda animação usa Motion (`motion/react` ou `animate` de `motion`); proibido `@keyframes`/`transition` CSS novos para movimento (exceto `transition` de cor/hover trivial já existente).
- Molas só em `src/motion/springs.ts`; durações e easings só em `src/motion/presets.ts`/`easings.ts`.
- "Reduzir animações"/`prefers-reduced-motion`: `MotionConfig reducedMotion="always"`; confete, voos, partículas 3D e loops ambientes não montam; loops ambientes também param com "Gráficos leves".
- A velocidade de execução (0,5x–4x) escala só as molas do robô e da fazenda (`scaleSpring`).
- Animações do jogo só começam depois do evento aplicado pelo motor.
- Modelos: apenas CC0, convertidos em desenvolvimento, total ≤ 5 MB, nenhum carregamento externo em runtime; fallback procedural sempre disponível.
- Não contornar erros de certificado/rede para baixar assets; pedir download manual ao usuário.
- Acessibilidade mantida: foco, `aria-*`, alvos ≥ 44 px, estado nunca só por cor.
- Os 285 testes unitários e 9 E2E existentes continuam verdes (ajustes de seletor registrados no ledger).

## Review Focus

1. **Diálogo aberto e fechado rapidamente / navegação durante a saída** — fechar o briefing e clicar "Executar" enquanto o painel ainda sai; espera-se que o clique funcione e o diálogo não fique preso. Coberto: `dialogBackdrop.exit` sem bloquear e E2E existente do fluxo Fase 1 (Task 7.1 Step 1).
2. **Assets ausentes ou corrompidos** — `public/models` vazio, manifesto inválido ou GLB quebrado; espera-se cena funcional com modelos procedurais. Coberto: `parseManifest` (Task 5.1) e `ModelBoundary` + fallback em todo `Model` (Task 6.1); E2E de carga (Task 7.1).
3. **Mudanças rápidas de recurso (4x)** — vários decrementos por segundo; espera-se odômetro terminando no valor real. Coberto: `RollingNumber` com texto acessível do valor final (Task 4.2) e `CountUp` (Task 3.2).
4. **Colheitas em sequência** — duas colheitas antes do primeiro voo pousar; espera-se dois voos e dois "pops", contador correto. Coberto: `flightStore` com ids independentes (Task 4.1) e E2E de voo (Task 7.1).
5. **Movimento reduzido no meio de uma execução** — usuário liga "Reduzir animações" com o robô andando; espera-se snap para a posição real sem animação pendurada. Coberto: `RobotModel` reage a `reducedMotion` posicionando direto (Task 6.3) e E2E de movimento reduzido (Task 7.1).
