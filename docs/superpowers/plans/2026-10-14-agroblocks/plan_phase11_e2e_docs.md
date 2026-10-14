# AgroBlocks — Fase 11: Testes de interface, documentação e entrega

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Testes E2E com Playwright cobrindo o fluxo real no navegador, documentação de instalação/arquitetura/decisões/metodologia/áudio e verificação final de todos os critérios da spec.

**Architecture:** Playwright roda contra o build de produção (`vite preview`). Estado inicial é semeado via `localStorage` com as mesmas funções puras do app (`createInitialSave`, `storeProgram`, `programToWorkspaceJson`), só quando a chave ainda não existe — assim recarregar a página testa a persistência real. Um teste faz arraste real de bloco no Blockly; os demais carregam programas salvos.

**Tech Stack:** @playwright/test (Chromium), Markdown.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seções 8, 9 e critérios de sucesso)

Leia `plan_index.md` antes de começar.

---

### Task 11.1: Configuração do Playwright e helpers

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers.ts`
- Modify: `vite.config.ts` (excluir `tests/` do Vitest — já excluído pelo `include`; nenhuma mudança se `include` for `src/**`)

**Interfaces:**
- Consumes: `createInitialSave`, `recordAttempt`, `storeProgram`, `MISSIONS`, `programToWorkspaceJson`, `SAVE_KEY`, `SETTINGS_KEY`, `DEFAULT_SETTINGS`, `Program`, `SaveData`.
- Produces:
  - `seedStorage(page: Page, options: { settings?: Partial<Settings>; save?: SaveData }): Promise<void>`
  - `saveWithProgram(missionId: string, program: Program, completed?: string[]): SaveData`
  - `openMission(page: Page, missionId: string): Promise<void>` (navega, fecha o briefing com "Começar")

- [ ] **Step 1: Instalar navegador**

Run: `npx playwright install chromium`
Expected: download concluído.

- [ ] **Step 2: Criar `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
})
```

- [ ] **Step 3: Criar `tests/e2e/helpers.ts`**

```ts
import type { Page } from '@playwright/test'
import type { Program } from '@/blocks/interpreter/ast'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt, storeProgram } from '@/game/progress/progression'
import type { SaveData } from '@/game/progress/types'
import { SAVE_KEY } from '@/services/storage/saveStorage'
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from '@/services/storage/settingsStorage'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))

export function saveWithProgram(missionId: string, program: Program, completed: string[] = []): SaveData {
  let save = createInitialSave(refs, '2026-10-14T12:00:00.000Z')
  for (const id of completed) {
    save = recordAttempt(
      save,
      {
        missionId: id,
        timestamp: '2026-10-14T12:00:00.000Z',
        outcome: 'success',
        errorCode: null,
        actions: 1,
        blocks: 1,
        usage: { seeds: 0, water: 0, energy: 0 },
        efficiencyStars: 3,
        pseudocode: '',
      },
      refs,
    )
  }
  return storeProgram(save, missionId, JSON.stringify(programToWorkspaceJson(program)))
}

export async function seedStorage(page: Page, options: { settings?: Partial<Settings>; save?: SaveData }): Promise<void> {
  const settings = { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'reduced', defaultSpeed: 4, soundEnabled: false, ...options.settings }
  await page.addInitScript(
    ({ settingsKey, settingsValue, saveKey, saveValue }) => {
      if (!window.localStorage.getItem(settingsKey)) window.localStorage.setItem(settingsKey, settingsValue)
      if (saveValue && !window.localStorage.getItem(saveKey)) window.localStorage.setItem(saveKey, saveValue)
    },
    {
      settingsKey: SETTINGS_KEY,
      settingsValue: JSON.stringify(settings),
      saveKey: SAVE_KEY,
      saveValue: options.save ? JSON.stringify(options.save) : null,
    },
  )
}

export async function openMission(page: Page, missionId: string): Promise<void> {
  await page.goto(`/#/jogar/${missionId}`)
  await page.getByRole('button', { name: 'Começar' }).click()
}
```

Se o Playwright não resolver o alias `@/`, adicione `"baseUrl": "."` ao `tsconfig.json` (o Playwright usa `paths` do tsconfig) e rode de novo.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/helpers.ts tsconfig.json
git commit -m "test(e2e): configure Playwright against the production build"
```

---

### Task 11.2: Testes E2E do fluxo essencial

**Files:**
- Create: `tests/e2e/agroblocks.spec.ts`

**Interfaces:**
- Consumes: helpers da Task 11.1; builder de programas; `getMission`.

- [ ] **Step 1: Escrever `tests/e2e/agroblocks.spec.ts`**

```ts
import { expect, test } from '@playwright/test'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { getMission } from '@/data/missions'
import { openMission, saveWithProgram, seedStorage } from './helpers'

const firstHarvest = getMission('m1-first-harvest')
if (!firstHarvest) throw new Error('mission missing')

test('starts a new farm from the home screen at the guided training', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(page.getByText('1/6')).toBeVisible()
})

test('builds a program by dragging a real block into the editor', async ({ page }) => {
  await seedStorage(page, {})
  await openMission(page, 'm0-training')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByText('2/6')).toBeVisible()

  await page.getByRole('treeitem', { name: /Movimento/ }).click()
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: 'mover para frente' }).first()
  const hat = page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: 'quando executar' }).first()
  const from = await source.boundingBox()
  const to = await hat.boundingBox()
  if (!from || !to) throw new Error('blocks not visible')
  await page.mouse.move(from.x + 12, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + 40, to.y + to.height - 4, { steps: 15 })
  await page.mouse.up()

  await expect(page.getByText('3/6')).toBeVisible()
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('quando executar:\n    mover para frente')
})

test('explains an error and highlights the failing state', async ({ page }) => {
  const wrong = program([act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')])
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', wrong) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Não há planta para colher neste canteiro.')
  await expect(page.getByRole('log')).toContainText('O robô colheu no lugar errado')
  await expect(page.getByText('Execução interrompida por erro')).toBeVisible()
})

test('step mode executes one instruction per click', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await page.getByRole('button', { name: 'Próximo passo' }).click()
  await page.getByRole('button', { name: 'Próximo passo' }).click()
  await expect(page.locator('.execution-panel__status dd').nth(1)).toHaveText('2')
  await expect(page.getByRole('gridcell', { name: /coluna 1, linha 3: .*robô/ })).toBeVisible()
})

test('completes a phase, shows the result and advances to the next phase', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Missão cumprida!')
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Comandos executados' })).toContainText('8')
  await page.getByRole('link', { name: 'Próxima fase' }).click()
  await expect(page).toHaveURL(/#\/jogar\/m2-row-planting$/)
})

test('reloading the page keeps progress and the saved program', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await page.goto('/')
  await page.reload()
  const continueButton = page.getByRole('button', { name: /Continuar missão/ })
  await expect(continueButton).toBeEnabled()
  await expect(continueButton).toContainText('Fase 2 - Plantação em série')
  await page.goto('/#/jogar/m1-first-harvest')
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('virar à direita')
})

test('the dashboard shows real recorded data and the empty state before it', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await page.goto('/#/painel')
  await expect(page.getByText('Ainda não existem registros neste navegador.')).toBeVisible()
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await page.goto('/#/painel')
  await expect(page.getByRole('group', { name: 'Fases concluídas' })).toContainText('1 de 6')
})

test('renders the 3D farm without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})
```

- [ ] **Step 2: Rodar**

Run: `npx playwright test`
Expected: 8 testes PASS.

Se o teste de arraste falhar por seletor, abra `npx playwright test --debug`, inspecione o DOM do Blockly instalado e ajuste somente os seletores (`.blocklyFlyout`, `.blocklyDraggable`, categoria `treeitem`) — o comportamento verificado (bloco entra no programa, tutorial avança, pseudocódigo atualiza) não muda. Se o teste 3D falhar só por falta de WebGL no ambiente headless, rode com `--headed` para confirmar e registre a limitação no README em vez de remover o teste.

- [ ] **Step 3: Corrigir defeitos encontrados**

Para cada falha real (não de seletor), escreva primeiro um teste unitário que reproduza o defeito na camada certa (engine, controller, serializer ou componente), corrija e rode `npx vitest run && npx playwright test` de novo.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): cover start, block dragging, errors, step mode, completion, persistence and dashboard"
```

---

### Task 11.3: Documentação

**Files:**
- Create: `README.md`
- Create: `docs/metodologia.md`
- Create: `docs/audio.md`
- Create: `docs/decisions/0001-ast-generator-interpreter.md`
- Create: `docs/decisions/0002-procedural-three-scene.md`
- Create: `docs/decisions/0003-local-storage-only.md`
- Create: `docs/decisions/0004-hash-router-static-hosting.md`
- Create: `docs/decisions/0005-controller-as-external-store.md`

- [ ] **Step 1: Criar `README.md`**

````markdown
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

- Node.js 20 ou superior e npm 10.
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

## Decisões técnicas

Veja `docs/decisions/`:

1. Interpretador próprio sobre AST com generators (sem `eval`).
2. Cena Three.js procedural low-poly, sem modelos externos.
3. Somente LocalStorage, com validação Zod e backup de dados corrompidos.
4. HashRouter + `base: './'` para hospedagem estática.
5. Controller como external store do React (sem store de sessão separada).

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
````

- [ ] **Step 2: Criar `docs/metodologia.md`**

```markdown
# Metodologia de avaliação da aprendizagem — AgroBlocks

## 1. Lacuna investigada

Estudantes do Ensino Médio costumam ter dificuldade em transformar a descrição de um problema em uma sequência de instruções, em reconhecer padrões que pedem repetição e em decidir quando uma condição precisa ser verificada. Ambientes de blocos genéricos ensinam a sintaxe visual, mas raramente oferecem um contexto com consequências observáveis e recursos limitados. O AgroBlocks investiga se um jogo de automação agrícola, em que o aluno programa um robô e vê o efeito de cada instrução, apoia a construção desses conceitos.

## 2. Objetivos pedagógicos

Ao final das seis fases, espera-se que o estudante consiga:

1. Ordenar instruções para atingir um objetivo (sequenciamento).
2. Identificar padrões e representá-los com laços de contagem (repetição).
3. Usar condições para decidir entre ações (condicionais).
4. Usar sensores e laços "enquanto" para lidar com situações de tamanho desconhecido.
5. Usar variáveis para controlar recursos.
6. Localizar e corrigir erros em programas existentes (depuração) e comparar soluções corretas quanto à eficiência.

## 3. Instrumentos

| Instrumento | Onde | Conteúdo |
|---|---|---|
| Pré-teste (forma A) | `#/avaliacao/pre`, antes da Fase 1 | 10 itens: 2 por conceito |
| Pós-teste (forma B) | `#/avaliacao/pos`, após concluir a Fase 6 | 10 itens equivalentes, em pares com a forma A |
| Registros de jogo | automáticos | cada execução, erros, dicas, recursos, eficiência |

Conceitos avaliados: sequenciamento, repetição, condicionais, identificação de erros, interpretação de algoritmos. Cada item da forma A tem um par na forma B (`pairId`) com mesma estrutura e dificuldade e cenário diferente, para reduzir o efeito de memorização. Durante os testes o aluno não recebe retorno de acerto.

## 4. Indicadores coletados

Por tentativa (`tentativas.csv`): missão, fase, conceito, número da tentativa, data/hora, resultado (sucesso, objetivo não cumprido, erro), código do erro, comandos executados, blocos usados, sementes/água/energia consumidas, dicas reveladas até o momento, estrelas de eficiência.

Por missão (`missoes.csv`): estado, tentativas, sucessos, erros, dicas, melhor resultado.

Por avaliação (`avaliacao.csv`): forma, item, par, conceito, resposta e se está correta.

## 5. Procedimento sugerido

1. Obter autorização da escola e, para menores de idade, Termo de Consentimento dos responsáveis (TCLE) e Termo de Assentimento do estudante (TALE), conforme as normas do comitê de ética aplicável.
2. Combinar um código de participante por aluno (ex.: `ALUNO-07`), sem dados pessoais. O aluno o digita em Configurações › Dados.
3. Sessão 1: pré-teste + Treinamento + Fases 1–2.
4. Sessões seguintes: Fases 3–6, no ritmo da turma.
5. Última sessão: pós-teste.
6. Em cada computador, abrir `#/painel` e exportar os três CSV. Juntar as planilhas pelo campo `participante`.
7. Limpar o navegador (Configurações › Dados › Reiniciar progresso) antes de outro aluno usar a mesma máquina.

## 6. Análise

- Comparar acertos por conceito entre pré e pós (pares de itens). Para amostras pequenas, usar teste não paramétrico pareado (Wilcoxon) por conceito e relatar tamanhos de efeito.
- Cruzar dados de uso (tentativas, erros mais frequentes, dicas) com os resultados do pós-teste de forma descritiva.
- Relatar separadamente alunos que pularam o pré-teste ou não concluíram a Fase 6.

## 7. Dados de uso × evidências de aprendizagem

Dados de uso mostram **o que aconteceu no jogo** (quantas tentativas, quais erros). Eles não mostram, sozinhos, que o aluno aprendeu: concluir uma fase pode resultar de tentativa e erro ou da dica com exemplo parcial. Evidência de aprendizagem exige instrumentos independentes do jogo (pré/pós-teste) e, idealmente, comparação com um grupo que não usou o jogo. O painel do aplicativo exibe essa ressalva e marca dados de demonstração como fictícios.

## 8. Limitações

- Amostra provavelmente pequena e de conveniência.
- Sem grupo controle no desenho básico; ganhos podem vir de outras aulas ou de maturação.
- Efeito novidade do jogo pode inflar o engajamento.
- Itens de múltipla escolha capturam parte da compreensão; não avaliam produção de programas longos.
- Dados ficam no navegador: limpar o navegador apaga registros não exportados; um navegador por aluno.
- Computadores sem WebGL usam a visualização 2D, o que pode alterar a experiência.

## 9. Ética e privacidade

Nenhum dado pessoal é coletado e nada é transmitido pela rede. Ainda assim, a participação de menores em pesquisa exige autorização institucional e consentimento dos responsáveis. Os resultados só devem ser apresentados como evidência depois da coleta e análise reais; antes disso, o painel deve ser tratado como demonstração.
```

- [ ] **Step 3: Criar `docs/audio.md`**

````markdown
# Gerando a trilha sonora com ACE-Step 1.5 (opcional)

O jogo não depende de música. Se quiser uma trilha ambiente, gere offline e salve como `public/audio/theme.ogg`.

1. Instale `uv` (https://docs.astral.sh/uv/) e Python 3.11 ou 3.12.
2. Clone o projeto: `git clone https://github.com/ace-step/ACE-Step-1.5 && cd ACE-Step-1.5`
3. Instale dependências: `uv sync`
4. Inicie a interface: `uv run acestep` e abra `http://localhost:7860` (em Mac com Apple Silicon o backend MPS é usado; com pouca memória, escolha o modelo turbo e desative o LM).
5. Gere uma faixa instrumental de 90 segundos. Sugestão de descrição:
   `calm cozy farming game background music, acoustic guitar, light marimba, soft percussion, cheerful, loopable, instrumental, no vocals, 95 bpm`
6. Converta para OGG: `ffmpeg -i saida.wav -c:a libvorbis -q:a 4 theme.ogg`
7. Copie para `public/audio/theme.ogg` e ligue "Música" em Configurações › Som.

O código do ACE-Step é MIT. Antes de publicar o jogo, confira os termos dos pesos do modelo usados e registre a origem da faixa no README.
````

- [ ] **Step 4: Criar os ADRs**

`docs/decisions/0001-ast-generator-interpreter.md`:
```markdown
# 0001 — Interpretador próprio sobre AST com generators

**Contexto:** o jogo precisa executar o programa do aluno com pausa, passo a passo, destaque de bloco e limite de passos, sem executar código arbitrário.

**Decisão:** o JSON do Blockly é convertido em um AST tipado. Um interpretador `function*` percorre o AST e faz `yield` de cada passo (ação, condição, repetição, variável, chamada). O controller decide o ritmo e aplica cada ação no engine.

**Alternativas:** JS-Interpreter do Blockly (granularidade por nó JS, sem tipos, duas representações) e compilação para bytecode (mais código sem necessidade de serializar a execução).

**Consequências:** sem `eval`; o mesmo AST alimenta pseudocódigo, análise de repetição, validação das missões e testes. Um generator não é serializável — não é possível salvar a execução no meio, o que não é requisito.
```

`docs/decisions/0002-procedural-three-scene.md`:
```markdown
# 0002 — Cena Three.js procedural low-poly

**Contexto:** a referência visual pede uma fazenda 3D isométrica; o jogo roda em computadores escolares e deve funcionar offline.

**Decisão:** todos os modelos (canteiros, plantas, robô, árvores, cercas, celeiro, moinho, silo) são geometrias primitivas com sombreamento facetado, criadas em código com React Three Fiber. Decoração é gerada de forma determinística por missão.

**Consequências:** zero assets externos, bundle menor, animações simples por escala/posição. Modo "gráficos leves" e fallback 2D cobrem máquinas fracas ou sem WebGL. Texturas PBR (ex.: Ubisoft CHORD) foram descartadas pela licença research-only e pelo custo de GPU.
```

`docs/decisions/0003-local-storage-only.md`:
```markdown
# 0003 — Persistência apenas em LocalStorage

**Contexto:** sem backend, sem cadastro e sem transmissão de dados de estudantes.

**Decisão:** progresso (`agroblocks:v1`) e configurações (`agroblocks:settings:v1`) ficam no LocalStorage, versionados e validados com Zod. Dado inválido é copiado para `agroblocks:corrupt` e o jogo recomeça limpo. A pesquisa usa exportação CSV por máquina.

**Consequências:** privacidade por padrão e funcionamento offline; em contrapartida, um navegador por aluno e risco de perda se o navegador for limpo antes da exportação.
```

`docs/decisions/0004-hash-router-static-hosting.md`:
```markdown
# 0004 — HashRouter e caminhos relativos

**Contexto:** a aplicação deve ser publicada como site estático (GitHub Pages, Netlify, servidor da escola), inclusive em subpastas.

**Decisão:** `HashRouter` do react-router e `base: './'` no Vite.

**Consequências:** nenhuma configuração de servidor para rotas; URLs ficam com `#/`.
```

`docs/decisions/0005-controller-as-external-store.md`:
```markdown
# 0005 — Controller de execução como external store

**Contexto:** a spec previa uma store Zustand de sessão. O controller já mantém o estado completo da partida e precisa evitar execuções duplicadas.

**Decisão:** `ExecutionController` publica snapshots imutáveis e é assinado com `useSyncExternalStore`. Zustand fica para progresso e configurações persistidas.

**Consequências:** uma única fonte de verdade para o estado da partida; o controller é testável sem React com um `Scheduler` manual.
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs
git commit -m "docs: add README, methodology, audio guide and architecture decision records"
```

---

### Task 11.4: Verificação final contra a spec

**Files:**
- Modify: qualquer arquivo com defeito encontrado (com teste que reproduza o defeito antes da correção)

- [ ] **Step 1: Rodar o gate completo**

```bash
npm run typecheck
npx vitest run
npx playwright test
npm run build
```
Expected: tudo verde; `dist/` gerado.

- [ ] **Step 2: Verificar que o código não tem comentários**

Run: `grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests --include=*.ts --include=*.tsx`
Expected: nenhuma linha. Remova qualquer comentário encontrado.

- [ ] **Step 3: Smoke manual das fases com a solução de referência**

`npm run preview`, abra o app em modo 3D e, para cada fase 0–6, monte a solução de referência (ou use o pseudocódigo da tela de resultado como guia) e confirme: robô segue os blocos, mapa muda, recursos do HUD batem com o console, objetivo é validado, resultado aparece. Confira também: modo 2D, "Reduzir animações", "Gráficos leves", tela de 1024 px (abas Programa/Fazenda/Execução) e 390 px (aviso de tela pequena).

- [ ] **Step 4: Conferir critérios de sucesso da spec**

Marque cada item da seção "Critérios de sucesso" da spec com o arquivo/teste que o comprova. Qualquer item sem comprovação vira uma correção + teste antes de concluir.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

Use `git add -A` aqui apenas depois de conferir `git status` e garantir que não há arquivos temporários (rotas de depuração, `test-results/`, `playwright-report/`).
