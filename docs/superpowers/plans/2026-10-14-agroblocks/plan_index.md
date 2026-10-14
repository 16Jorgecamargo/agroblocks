# AgroBlocks Implementation Plan — Índice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jogo web educativo completo em que estudantes do Ensino Médio programam um robô agrícola com blocos Blockly numa fazenda 3D low-poly, com motor de execução próprio, 7 missões, feedback educativo, progresso local, avaliação pré/pós e painel do professor.

**Architecture:** Engine puro e imutável (`src/game`) + AST/interpretador com generators (`src/blocks`) + controller de execução como external store + UI React com Blockly e React Three Fiber. Missões e itens de avaliação são dados declarativos. Tudo roda no navegador; persistência em LocalStorage validada com Zod.

**Tech Stack:** React 19, TypeScript strict, Vite, react-router 7 (HashRouter), Zustand, Zod, Blockly, three + @react-three/fiber + @react-three/drei, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` · Referência visual: `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`

## Ordem de execução

| Ordem | Arquivo | Entrega | Depende de |
|---|---|---|---|
| 1 | `plan_phase01_setup.md` | Scaffold, Vitest, tokens, rota inicial | — |
| 2 | `plan_phase02_engine.md` | Mundo, robô, ações, crescimento, sensores, objetivos, eficiência | 1 |
| 3 | `plan_phase03_program.md` | AST, builder, pseudocódigo, interpretador, detector de repetição | 2 |
| 4 | `plan_phase04_blockly.md` | Blocos PT-BR, tema, toolbox, serializer ↔ AST, editor React | 3 |
| 5 | `plan_phase05_execution.md` | ExecutionController, storage seguro, configurações, hook React | 3 |
| 6 | `plan_phase06_missions_progress.md` | 7 missões com soluções verificadas, progresso persistido | 4, 5 |
| 7 | `plan_phase07_render.md` | Cena 3D low-poly, fallback 2D, FarmView | 5, 6 |
| 8 | `plan_phase08_gameplay.md` | UI compartilhada, configurações, gameplay, tutorial | 4–7 |
| 9 | `plan_phase09_screens.md` | Início, mapa de missões, resultado, como jogar, áudio | 8 |
| 10 | `plan_phase10_assessment_dashboard.md` | Pré/pós-teste, painel, CSV | 6, 9 |
| 11 | `plan_phase11_e2e_docs.md` | Playwright, README, metodologia, ADRs, verificação final | 1–10 |

Ao fim de cada fase: `npm run typecheck && npx vitest run` verdes e app executável com `npm run dev`.

## Global Constraints

- Nunca escrever comentários no código (TS, TSX, CSS, config). Explicações vão para a documentação ou nomes claros.
- Identificadores, funções, tipos e nomes de arquivo sempre em inglês; todo texto visível ao usuário em português brasileiro.
- TypeScript `strict: true`, `noUnusedLocals`, `noUnusedParameters`; nada de `any` explícito.
- Alias `@/` → `src/`; importar sempre por alias.
- `src/game/**`, `src/blocks/interpreter/**`, `src/blocks/pseudocode/**`, `src/blocks/analysis/**`, `src/blocks/serializer/**` não importam React, Three.js nem Blockly.
- Proibido `eval`, `new Function` e geração de JavaScript pelo Blockly; o programa do aluno só é executado pelo interpretador sobre o AST.
- Limite padrão de passos: 2000 (`DEFAULT_STEP_LIMIT`); `repita` limitado a 1000 (`MAX_REPEAT`); profundidade de chamadas 32.
- Erros de execução interrompem a execução e mostram mensagem + pista em PT-BR.
- Sem backend, sem rede em runtime (exceto a fonte Inter opcional), sem rastreamento, sem dados pessoais.
- Chaves de armazenamento: `agroblocks:v1` (progresso), `agroblocks:settings:v1` (configurações), `agroblocks:corrupt` (backup).
- Roteamento `HashRouter`; `base: './'` no Vite.
- Velocidades: 0,5x / 1x / 2x / 4x; atraso base 500 ms por passo.
- Cores das categorias de blocos: Movimento `#4C8DF6`, Agricultura `#3FA34D`, Sensores `#E0A526`, Controle `#8E5BE8`, Variáveis `#F07C2A`, Procedimentos `#E0508F`, Números `#3D9AA3`.
- Alvos interativos ≥ 44 px; foco visível 3 px amarelo; estado nunca indicado só por cor; respeitar `prefers-reduced-motion` e a opção manual.
- Solução correta nunca é reprovada por eficiência; eficiência é exibida à parte (1–3 estrelas).
- Dados de demonstração ficam só em memória, rotulados como fictícios, e nunca são exportados.
- Commits pequenos por tarefa; `git add` com caminhos explícitos.

## Review Focus

Casos que a spec implica, mas que os testes de cada tarefa não cobririam naturalmente. Cada um já tem teste na tarefa dona:

1. **Bloco desativado pelo menu de contexto do Blockly** — o aluno clica com o botão direito e "Desativar bloco"; espera-se que ele (e o que estiver dentro) não execute. Teste: `serializeWorkspace.test.ts` › "skips blocks disabled from the context menu" (Task 4.2).
2. **Bloco "quando executar" duplicado com copiar/colar** — espera-se erro claro no console e nenhuma execução. Teste: `serializeWorkspace.test.ts` › "rejects a duplicated hat block" (Task 4.2).
3. **Programa salvo corrompido ou incompatível** (JSON válido com bloco inexistente, ou sem o chapéu) — espera-se que o editor abra com o programa padrão e avise, sem quebrar a página. Teste: `safeLoad.test.ts` (Task 4.3) + aviso no console via `onLoadFailed` (Task 8.4).
4. **Sair da fase no meio da execução** (botão Sair, voltar do navegador) — espera-se que nenhum timer continue mudando o estado nem notificando a interface. Teste: `controller.test.ts` › "stops scheduled work and notifications after dispose" (Task 5.1).
5. **LocalStorage bloqueado ou cheio** (navegação privada, cota excedida) — espera-se que o jogo continue jogável, apenas sem salvar. Teste: `saveStorage.test.ts` › "keeps the game playable when storage is blocked" (Task 6.3) + `jsonStorage.test.ts` (Task 5.2).

## Mapa de módulos (resumo)

```
src/app            App, rotas, PreferenceSync, MusicPlayer
src/game           world, entities, rules, sensors, missions, execution, progress, assessment, testing
src/blocks         blockTypes, definitions, toolbox, serializer, interpreter, pseudocode, analysis, editor
src/render         palette, seededRandom, sceneLayout, cellDescription, hasWebGL, grid2d, farm3d, FarmView
src/features       home, mission-select, gameplay, tutorial, settings, results, how-to-play, assessment, dashboard
src/components     icons, brand, ui, layout
src/data           missions, assessment
src/services       storage, export, audio
src/stores         settingsStore, progressStore
src/hooks          useReducedMotion
tests/e2e          Playwright
```

## Critérios de conclusão (da spec)

Missão iniciável · editor monta e edita programas · blocos = comandos executáveis · robô segue o programa · mapa muda com as ações · repetição e condicionais corretas · erros explicados · pausa e passo a passo · 7 missões jogáveis · progresso salvo e recuperado · painel com registros reais · `tsc`, Vitest, Playwright e build verdes · README com instalação e publicação.
