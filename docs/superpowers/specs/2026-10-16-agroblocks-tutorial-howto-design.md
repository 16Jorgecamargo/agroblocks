# AgroBlocks — Tutorial guiado com animações de demonstração

**Data:** 2026-10-16 · **Branch:** `feat/agroblocks-motion` · **Missão:** `m0-training`

## 1. Contexto e objetivo

Feedback do usuário sobre o tutorial atual (`src/features/tutorial/`):

- Os balões estão errados: o balão central fica sobre a fazenda e cobre o robô, a ponta não aponta para nada, e os passos do editor aparecem longe do editor.
- O fluxo não é intuitivo: o passo "monte três mover para frente" contradiz o objetivo "duas casas" sem explicar que o erro é proposital.
- Nada mostra como fazer cada ação.

Pedido: antes de cada ação prática, um dialog mostra uma animação de alguém fazendo a ação (exemplo: apagar bloco arrastando para a lixeira, arrastando de volta para a biblioteca e apertando Delete); depois o aluno faz de verdade. O tutorial cobre tudo da tela: montar, encaixar e apagar blocos, Executar e Parar, Passo a passo, corrigir erro, Dicas, Console e Pseudocódigo, além do HUD e das ferramentas da fazenda.

Decisões tomadas com o usuário:

- Animação = réplica animada do editor desenhada em HTML/SVG com uma mão (cursor) animada via Motion. Sem vídeo, sem cursor fantasma no Blockly real.
- Dois tipos de etapa: **tour** (ilumina o elemento real com balão preso e seta) e **prática** (dialog com animação, depois ilumina a área real e espera a ação).
- Sequência de 15 etapas da seção 3, aprovada.

Restrição: só desktop (a versão mobile não será usada). Textos da interface em PT-BR; identificadores, arquivos e funções em inglês; sem comentários no código.

**Critérios de sucesso**

1. Nenhum balão cobre o elemento de que fala; todo balão aponta com seta para o alvo.
2. Toda etapa prática começa com uma animação que mostra exatamente o gesto pedido, e pode ser revista durante a prática.
3. O aluno não consegue interagir fora da área da etapa atual (exceto a barra do tutorial), e consegue fazer a ação dentro dela, inclusive arrastar blocos até a lixeira e a biblioteca.
4. O erro do robô na pedra é apresentado como experimento, não como instrução contraditória.
5. O tutorial termina com a planta colhida e leva às missões.
6. Com "Reduzir animações", as animações viram quadros estáticos navegáveis, sem movimento contínuo.

## 2. Abordagem

- **Roteiro em dados** (`tutorialScript.ts`): a lista de etapas é um array puro. Cada etapa diz o tipo, as áreas iluminadas, o texto, a animação (se prática) e a regra de conclusão.
- **Máquina pura** (`tutorialMachine.ts`, reescrita): aplica sinais ao estado `{ index, progress }` e devolve o próximo estado. Testável sem DOM.
- **Holofote** (`TutorialSpotlight.tsx`): escurece a página e recorta buracos sobre os elementos reais marcados com `data-tutorial`. O balão (`TutorialCallout.tsx`) é posicionado por uma função pura a partir do retângulo do alvo e do tamanho da janela.
- **Animações** (`HowToDialog.tsx` + `src/features/tutorial/howto/`): réplica do editor em HTML/SVG; cada animação é um roteiro em dados com batidas no tempo; uma função pura calcula o estado da réplica em um instante.
- **Integração**: `GameplayPage` emite os sinais novos quando `mission.tutorial` é verdadeiro; o overlay cobre a página inteira.

## 3. Etapas

Alvos (`data-tutorial`): `hud-goal` (título e objetivo no HUD), `hud-harvest` (chip Colheita), `hud-actions` (Ajuda, Configurações, Sair), `farm` (quadro da fazenda com ferramentas), `editor` (seção Programa inteira: categorias, flyout, área de trabalho e lixeira), `execution` (painel Execução), `side` (painel lateral com abas Console, Dicas, Pseudocódigo).

| # | id | Tipo | Alvos | Texto (resumo) | Animação | Conclui quando |
|---|---|---|---|---|---|---|
| 1 | `welcome` | intro | — | O robô agrícola segue, na ordem, as instruções do seu programa. Vamos aprender cada parte da tela. | — | botão "Começar treinamento" |
| 2 | `goal` | tour | `hud-goal`, `hud-harvest` | Aqui fica o objetivo da fase. O contador Colheita mostra quantas plantas você já colheu. | — | "Próximo" |
| 3 | `farm` | tour | `farm` | Esta é a fazenda: o robô, a planta madura e uma pedra. Use os botões para girar, aproximar e abrir a Legenda. | — | "Próximo" |
| 4 | `add` | prática | `editor` | Abra Movimento e arraste "mover para frente" para dentro de "quando executar". | `add-block` | sinal `blockAdded` |
| 5 | `snap` | prática | `editor` | Encaixe outro "mover para frente" embaixo do primeiro. | `snap-blocks` | `stackSize ≥ 2` |
| 6 | `delete` | prática | `editor` | Apague um bloco: arraste para a lixeira, arraste de volta para a biblioteca ou selecione e aperte Delete. | `delete-block` (3 trechos) | sinal `blockRemoved` |
| 7 | `pseudocode` | prática | `side` | Abra a aba Pseudocódigo: ela mostra seu programa escrito em texto. | `open-pseudocode` | `tabOpened('pseudocode')` |
| 8 | `run-stop` | prática | `editor`, `execution` | Clique em Executar e, enquanto o robô anda, clique em Parar: a fazenda volta ao início. | `run-stop` | `run` e depois `stop` |
| 9 | `step-mode` | prática | `execution` | Ligue Passo a passo e clique em Próximo: o robô faz um bloco por vez, e o bloco atual fica destacado. | `step-mode` | `stepModeOn` e depois `stepped` |
| 10 | `hints` | prática | `side` | Se travar, abra Dicas e peça uma dica. | `hints` | `tabOpened('hints')` e depois `hintRevealed` |
| 11 | `experiment` | prática | `editor`, `execution` | Experimento: e se o robô andar demais? Monte três "mover para frente" e "colher planta" e execute. | `error-experiment` | sinal `error` |
| 12 | `console` | tour | `side` | O Console explica o que aconteceu: o robô bateu na pedra. Leia sempre o Console quando algo der errado. | — | "Próximo" |
| 13 | `fix` | prática | `editor`, `execution` | Corrija: remova um "mover para frente" e execute de novo para colher a planta. | `fix` | sinal `success` |
| 14 | `hud-actions` | tour | `hud-actions` | Ajuda reabre o objetivo, Configurações ajusta som e visual, Sair volta às missões. | — | "Próximo" |
| 15 | `done` | outro | — | Treinamento concluído! Você montou, executou, parou e corrigiu um programa. | — | botão "Ir para as missões" (navega para `/missoes`) |

Regras complementares:

- Etapas com dois sinais em ordem (8, 9, 10) guardam o progresso parcial; o balão troca o texto para a segunda metade (ex.: "Agora clique em Parar"). Na etapa 8, se a execução terminar antes do Parar, o balão diz "O robô terminou antes. Execute de novo e clique em Parar enquanto ele anda." e a etapa continua esperando `run` e `stop`.
- Na etapa 12, ao entrar, o painel lateral muda para a aba Console.
- `success` antes da etapa 13 (por exemplo, o aluno já montou o programa certo na etapa 11) não pula etapas; na etapa 11, `success` mostra no balão: "Seu programa já colheu a planta! Para o experimento, monte três 'mover para frente' e execute."
- O botão "← Anterior" volta uma etapa e zera o progresso parcial; "Próximo" só existe em tour, intro e outro.
- "Pular tutorial" abre confirmação ("Sair do treinamento? Você pode voltar a ele depois.") e navega para `/missoes`; não marca o treinamento como concluído.
- O `BriefingDialog` não abre na missão de tutorial; a etapa 1 o substitui.
- A conclusão da missão (`success` registrado pelo `useGameplaySession`) continua igual; a etapa 15 aparece no lugar da celebração padrão.

## 4. Sinais

`TutorialSignal`:

- `blockAdded`, `blockRemoved` — já emitidos pelo `BlocklyEditor` (`onBlockEvent`).
- `stackSize(n)` — número de instruções encaixadas no topo de "quando executar", lido do programa serializado (`session.serialized`) a cada mudança.
- `tabOpened(tab)` — `tab ∈ { 'console', 'hints', 'pseudocode' }`, emitido quando `sideTab` muda.
- `hintRevealed` — emitido por `session.revealHint`.
- `stepModeOn` — emitido quando o toggle Passo a passo é ligado.
- `stepped` — emitido a cada `session.step()`.
- `run`, `stop`, `error`, `success` — derivados do `ExecutionSnapshot` por `statusSignal` (mantido).

A máquina expõe:

```ts
interface TutorialProgress { index: number; partial: number }
function advanceTutorial(progress: TutorialProgress, signal: TutorialSignal): TutorialProgress
function nextTutorial(progress: TutorialProgress): TutorialProgress
function previousTutorial(progress: TutorialProgress): TutorialProgress
```

Cada etapa prática declara `done: TutorialCondition[]` (sequência); `partial` conta quantas condições da sequência já foram cumpridas. Condição: `{ signal: 'blockAdded' }`, `{ signal: 'stackSize', atLeast: 2 }`, `{ signal: 'tabOpened', tab: 'hints' }` etc.

## 5. Holofote e balão

- `TutorialSpotlight` renderiza um `<svg>` fixo de tela inteira com máscara: retângulo escuro (`rgb(9 16 22 / 0.55)`) menos um retângulo arredondado (raio 14 px, margem 6 px) por alvo. Os retângulos vêm de `getBoundingClientRect` dos elementos `[data-tutorial=…]`, atualizados por `ResizeObserver` + `resize` + `requestAnimationFrame` enquanto o layout anima (o grid da gameplay muda durante a execução).
- Bloqueio de cliques: quatro faixas transparentes com `pointer-events: auto` ao redor da união dos alvos bloqueiam o resto da página; os buracos deixam passar tudo. A barra do tutorial e o balão ficam acima. Os flyouts e o arrasto do Blockly acontecem dentro do alvo `editor`, então funcionam normalmente.
- Contorno do buraco: borda dourada de 2 px com pulso suave (desligado com "Reduzir animações").
- `placeCallout(target: Rect, callout: Size, viewport: Size): { side: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number; arrow: number }` — função pura: escolhe o lado com mais espaço livre que caiba o balão inteiro, na ordem de preferência direita, esquerda, baixo, cima; mantém o balão a 16 px da borda da janela; `arrow` é a posição da seta ao longo da borda do balão apontando para o centro do alvo. Com vários alvos, usa o primeiro.
- O balão (`TutorialCallout`) tem título curto, texto, e na prática a linha "Faça a ação para continuar." e o botão "Ver animação". Ele entra com `overshoot` e troca de texto com fade.
- Etapas intro e outro usam um `GameDialog` central; tour e prática usam holofote + balão.

## 6. Animações de demonstração

### 6.1 Dialog

`HowToDialog` (`GameDialog` tamanho `lg`, ícone `eye`, tom `info`): título da etapa, palco da réplica (16:9, até 640 × 360), legenda do trecho atual abaixo do palco, indicador de trechos quando houver mais de um (ex.: ● Lixeira ○ Biblioteca ○ Delete, clicáveis), botões "Ver de novo" (reinicia) e "Praticar" (fecha e mostra o holofote). Abre automaticamente ao entrar numa etapa prática; "Ver animação" no balão o reabre.

### 6.2 Réplica

Componentes em `src/features/tutorial/howto/replica/`, com as cores e formas do jogo (blocos com as cores das categorias do tema `agroTheme` (`src/blocks/definitions/theme.ts`), fonte e cantos iguais):

- `MiniToolbox` — categorias Movimento e Agricultura; `open` mostra o flyout com "mover para frente", "virar à esquerda", "virar à direita", "colher planta".
- `MiniWorkspace` — "quando executar" com a pilha de blocos (`stack`), bloco destacado (`highlight`) e bloco selecionado (`selected`).
- `MiniBlock` — um bloco com rótulo e cor; usado também como bloco sendo arrastado.
- `MiniTrash` — lixeira com tampa que abre quando um bloco está sobre ela.
- `MiniRunPanel` — botão Executar/Parar, toggle Passo a passo, botão Próximo.
- `MiniSideTabs` — abas Console, Dicas, Pseudocódigo com conteúdo resumido (linhas do console, dica revelada, texto do pseudocódigo).
- `MiniFarmStrip` — faixa 2D de cinco casas com robô, planta madura e pedra; o robô anda, vira, colhe e mostra o X vermelho ao bater.
- `MiniKey` — tecla "Delete" que afunda quando pressionada.
- `HandCursor` — mão SVG com estados `idle`, `press` (dedo dobrado, anel de clique) e `drag`.

Cada roteiro escolhe quais peças aparecem (`parts`), para o palco mostrar só o necessário.

### 6.3 Roteiros

```ts
interface ReplicaState {
  toolboxOpen: boolean
  stack: string[]
  dragging: { label: string; x: number; y: number } | null
  trashOpen: boolean
  selected: number | null
  highlight: number | null
  keyDown: boolean
  run: 'idle' | 'running' | 'stepping'
  stepMode: boolean
  robotCell: number
  robotHit: boolean
  harvested: boolean
  tab: 'console' | 'hints' | 'pseudocode'
  consoleLines: string[]
  hintsShown: number
}
interface HowToBeat { at: number; hand: { x: number; y: number; mode: 'idle' | 'press' | 'drag' }; set?: Partial<ReplicaState> }
interface HowToSegment { label: string; caption: string; duration: number; initial: Partial<ReplicaState>; beats: HowToBeat[] }
interface HowToScript { id: HowToId; title: string; parts: ReplicaPart[]; segments: HowToSegment[] }
function replicaAt(segment: HowToSegment, timeMs: number): { state: ReplicaState; hand: HowToBeat['hand'] }
```

Coordenadas em um palco virtual de 640 × 360; a mão interpola entre batidas (easing `easeInOutSine`); `set` aplica no instante `at`. O dialog toca o trecho em loop com uma pausa de 1,2 s no fim, e segue para o próximo trecho quando houver mais de um.

Roteiros (`howtoScripts.ts`):

| id | Trechos | O que a mão faz |
|---|---|---|
| `add-block` | 1 | Clica em Movimento, o flyout abre, arrasta "mover para frente" até encaixar em "quando executar". |
| `snap-blocks` | 1 | Arrasta um segundo "mover para frente" e solta logo abaixo do primeiro; o bloco encaixa com um pequeno tranco. |
| `delete-block` | 3 | Lixeira: arrasta o último bloco até a lixeira, a tampa abre, o bloco some. Biblioteca: arrasta o bloco de volta para a área das categorias e ele some. Delete: clica no bloco (fica selecionado), a tecla Delete afunda, o bloco some. |
| `open-pseudocode` | 1 | Clica na aba Pseudocódigo; aparece "mover para frente" em texto. |
| `run-stop` | 1 | Clica em Executar, o robô anda uma casa, a mão clica em Parar, o robô volta ao início. |
| `step-mode` | 1 | Liga Passo a passo, clica em Próximo duas vezes; o robô anda uma casa por clique e o bloco atual fica destacado. |
| `hints` | 1 | Clica na aba Dicas e em "Pedir dica"; aparece a primeira dica. |
| `error-experiment` | 1 | Com três "mover para frente" e "colher planta", clica em Executar; o robô passa da planta e bate na pedra (X vermelho); o console mostra a linha de erro. |
| `fix` | 1 | Arrasta um "mover para frente" para a lixeira, clica em Executar; o robô para na planta e colhe. |

### 6.4 Reduzir animações

Com `useMotionPrefs().reduced`, o palco mostra o estado final de cada batida como quadros estáticos, com setas ← → e a legenda da batida; sem loop, sem interpolação da mão.

## 7. Integração

- `GameplayPage`: quando `mission.tutorial`, não abre o `BriefingDialog`; renderiza `TutorialOverlay` fora do quadro da fazenda (irmão do `main`, cobrindo a página); repassa `sideTab`/`setSideTab`, `stepMode`, sinais de dica e passo, e `stackSize`.
- `data-tutorial` adicionado em `GameHud` (`hud-goal`, `hud-harvest`, `hud-actions`), `FarmView` (`farm`), seção do editor (`editor`), `ExecutionPanel` (`execution`) e painel lateral (`side`).
- O `TutorialOverlay` antigo (balão central, barra sobre a fazenda) é substituído; `TutorialOverlay.css` é reescrito para holofote, balão e barra.
- Barra do tutorial: fixa embaixo, centralizada, acima do holofote: "← Anterior", "Pular tutorial", progresso "N/15" com pontos e o botão principal ("Próximo" em tour; "Ver animação" em prática).
- Durações novas em `DURATIONS` (`howtoBeatEase`, `howtoLoopPause`, `spotlightMove`, `spotlightPulse`) e sem números soltos nos componentes.

## 8. Testes

- `tutorialScript.test.ts`: 15 etapas na ordem da seção 3; toda prática tem `howTo` e pelo menos uma condição; todo tour tem alvo.
- `tutorialMachine.test.ts`: cada etapa conclui com seu sinal; condições em sequência guardam `partial`; `stackSize` abaixo do mínimo não avança; `success` antes da etapa 13 não pula; Anterior zera `partial`.
- `placeCallout.test.ts`: escolhe a direita quando cabe; cai para esquerda/baixo/cima; respeita a margem de 16 px; seta aponta para o centro do alvo; janela pequena.
- `replicaAt.test.ts`: estado inicial em t = 0; `set` aplicado no instante da batida; mão interpolada no meio do caminho; fim do trecho mantém o último estado; cada roteiro termina num estado coerente (ex.: `delete-block` termina cada trecho com a pilha menor).
- `HowToDialog.test.tsx`: abre com a legenda do primeiro trecho; clicar no indicador troca de trecho; "Ver de novo" volta ao início; com reduzir animações mostra setas e não usa loop.
- `TutorialOverlay.test.tsx` (reescrito): fluxo com sinais simulados atravessando as 15 etapas; aba Console selecionada ao entrar na etapa 12; Pular pede confirmação.
- E2E: os dois testes de tutorial de `tests/e2e/agroblocks.spec.ts` (contador "N/6") passam a usar "N/15" e o fluxo novo; novo `tests/e2e/tutorial.spec.ts` percorre o tutorial com ações reais no Blockly (arrastar, apagar com Delete), executar, parar, passo a passo, dica, erro, correção e conclusão; confere que o balão não sobrepõe o alvo.

## 9. Fora do escopo

Tutorial para celular, narração em áudio, salvar a etapa do tutorial entre visitas, tutorial para as demais missões.
