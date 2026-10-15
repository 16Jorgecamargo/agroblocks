# AgroBlocks

Jogo educativo de automação agrícola e programação visual para o Ensino Médio. O estudante programa um robô agrícola com blocos (Blockly) para plantar, regar, colher e administrar recursos de uma fazenda em 3D low-poly.

> Automatize. Programe. Cultive.

## Funcionalidades

- Editor de blocos em português com liberação gradual por fase.
- Motor de execução próprio: interpreta o programa do aluno sem `eval`, com pausa, continuação, passo a passo, parada, reinício, velocidade e limite de passos.
- Simulação agrícola determinística (preparo, plantio, irrigação, crescimento, colheita, recursos e energia).
- Treinamento guiado por ações reais + 6 fases (sequência, repetição, condicionais, sensores, variáveis, depuração e eficiência).
- Feedback educativo com mensagens de erro explicativas, dicas graduais e pseudocódigo gerado dos blocos.
- Tela de resultado que separa correção de eficiência e compara soluções corretas.
- Pré-teste e pós-teste equivalentes, painel do professor e exportação CSV anônima.
- Tudo local no navegador (LocalStorage). Nenhum dado é enviado a servidores.

## Requisitos

- Node.js 20.19 ou superior (testado com Node 22) e npm 10.
- Navegador moderno com WebGL para a fazenda 3D (há modo 2D automático sem WebGL).

## Instalação e execução

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run typecheck` | checagem TypeScript estrita |
| `npm test` | testes unitários e de componentes (Vitest) |
| `npx playwright install chromium` | instala o navegador dos testes E2E (uma vez) |
| `npm run test:e2e` | testes de interface (Playwright, contra o build de produção) |
| `npm run build` | typecheck + build de produção em `dist/` |
| `npm run preview` | serve o build localmente |

## Publicação (hospedagem estática)

O build usa caminhos relativos (`base: './'`) e rotas com `#` (HashRouter), então funciona em qualquer servidor estático, inclusive em subpastas.

- **GitHub Pages:** `npm run build` e publique o conteúdo de `dist/` (por exemplo, com a action `actions/deploy-pages`).
- **Netlify:** comando `npm run build`, pasta `dist`.
- **Vercel:** framework "Vite", saída `dist`.
- **Laboratório sem internet:** copie `dist/` para qualquer servidor local (`npx serve dist`). A fonte Inter vem do Google Fonts; sem internet o navegador usa a fonte do sistema.

## Arquitetura

```
UI (React + Blockly + React Three Fiber)
   ↓ lê snapshots / envia comandos
ExecutionController (máquina de estados, runId, Scheduler injetável)
   ↓
Interpretador (generators sobre o AST)  ←  Serializer (JSON do Blockly → AST)
   ↓
Engine puro (mundo, robô, regras, sensores, objetivos)
   ↑
Dados (missões declarativas, itens de avaliação)
```

```
src/
  app/            rotas, sincronização de preferências, música
  game/           engine puro: world, entities, rules, sensors, missions, execution, progress, assessment
  blocks/         Blockly: blocos, tema, toolbox, serializer, interpretador, pseudocódigo, análise
  render/         cena 3D procedural, fallback 2D, descrições acessíveis
  features/       telas: home, mission-select, gameplay, results, tutorial, settings, how-to-play, assessment, dashboard
  components/     ícones, logo, modal, toggle, abas, cabeçalho
  data/           missões e itens de avaliação
  services/       armazenamento validado, exportação CSV, áudio
  stores/         Zustand (progresso e configurações)
tests/e2e/        Playwright
docs/             spec, plano, metodologia, decisões, áudio
reference/        referência visual
```

O engine (`src/game`) e o interpretador não importam React, Three.js nem Blockly e são testados sem interface.

## Movimento e assets

- **Animações:** toda animação usa [Motion](https://motion.dev) — `motion/react` na interface e `animate()` sobre objetos Three.js na cena 3D. Molas, durações e easings ficam em `src/motion/` e seguem a [Motion Reference](https://motion-reference.takayustudio.jp). Tabela completa em `docs/motion.md`. "Reduzir animações" (ou `prefers-reduced-motion`) desliga movimento, confete, voos e efeitos.
- **Modelos 3D:** a cena aceita pacotes CC0 (Kenney Nature Kit, Quaternius Ultimate Crops e Animated Robot) convertidos para GLB em `public/models/`, descritos em `src/render/models/manifest.generated.json` (validado com Zod, orçamento de 5 MB). Se o manifesto estiver vazio ou um modelo falhar, a cena usa os modelos procedurais.
- **Offline:** nenhum recurso é buscado de fora em tempo de execução (as imagens do Blockly ficam em `public/blockly-media/`), exceto as fontes do Google Fonts.

Os pacotes de origem (Kenney Nature Kit, Quaternius Nature Crops Pack, Animated Robot e Farm Buildings) ficam extraídos em `assets-src/` (fora do git, caminhos em `scripts/assets/sources.json`). Para regenerar os GLB (só em desenvolvimento):

```bash
npm run assets:inspect
npm run assets:build
```

`scripts/assets/assets.config.json` define qual arquivo vira cada modelo, escala, cores e clipes do robô. Créditos em `CREDITS.md`.

## Decisões técnicas

Veja `docs/decisions/`:

1. Interpretador próprio sobre AST com generators (sem `eval`).
2. Cena Three.js procedural low-poly (hoje fallback dos modelos CC0, ver 7).
3. Somente LocalStorage, com validação Zod e backup de dados corrompidos.
4. HashRouter + `base: './'` para hospedagem estática.
5. Controller como external store do React (sem store de sessão separada).
6. Motion como camada única de animação.
7. Assets CC0 em GLB com fallback procedural.

## Missões

| # | Fase | Conceito |
|---|---|---|
| 0 | Treinamento | interface (tutorial guiado) |
| 1 | Primeira colheita | sequenciamento |
| 2 | Plantação em série | repetição |
| 3 | Irrigação inteligente | condicionais |
| 4 | Colheita automatizada | sensores e laço enquanto |
| 5 | Recursos limitados | variáveis |
| 6 | Fazenda eficiente | depuração, laços aninhados, procedimentos |

Cada missão é um objeto em `src/data/missions/` com mapa, recursos, blocos permitidos, objetivos, restrições, dicas e uma solução de referência validada por teste automatizado.

## Regras da simulação (resumo)

- Cada ação do robô é um "tick": plantas em solo molhado crescem; ao mudar de estágio o solo seca.
- Mover, preparar, plantar, regar, colher e coletar gastam 1 de energia; virar não gasta.
- Plantar gasta 1 semente; regar gasta 1 de água; coletar no reservatório/depósito reabastece até a capacidade.
- Erros (obstáculo, canteiro ocupado, planta imatura, falta de recursos, laço infinito…) interrompem a execução com explicação e pista.

## Acessibilidade e dispositivos

- Navegação por teclado, foco visível, alvos de toque ≥ 44 px, estados com texto/ícone além da cor.
- Atalhos: Ctrl+Enter executar, Espaço pausar/continuar, `.` um passo, Esc parar.
- `prefers-reduced-motion` respeitado e opção "Reduzir animações".
- Edição de blocos recomendada em telas ≥ 768 px. No celular é possível navegar, ver o mapa e executar programas salvos. A navegação por teclado dentro do workspace do Blockly é limitada pela biblioteca.

## Privacidade e pesquisa

Os dados ficam apenas no navegador do aluno. O código de participante é opcional e deve ser combinado com o professor (nunca nome ou e-mail). O painel deixa claro que dados de uso não são evidência de aprendizagem. Veja `docs/metodologia.md`.

## Áudio

Efeitos sonoros são sintetizados em tempo real. A música é opcional (`public/audio/theme.ogg`); veja `docs/audio.md` para gerar uma trilha offline com ACE-Step 1.5.

## Licença e créditos

Identidade visual, modelos 3D e ícones são originais e gerados por código. Inspirado nas mecânicas de *The Farmer Was Replaced* e na programação em blocos do Scratch, sem uso de seus assets.
