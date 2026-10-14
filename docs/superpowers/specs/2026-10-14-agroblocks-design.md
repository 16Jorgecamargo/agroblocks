# AgroBlocks — Especificação de Design

Data: 2026-10-14
Status: aprovado em conversa, aguardando revisão da spec escrita

## 1. Entendimento compartilhado

### Objetivo
Jogo web educativo em que estudantes do Ensino Médio programam um robô agrícola com blocos visuais (Blockly) para automatizar uma fazenda. Inspirado na progressão de *The Farmer Was Replaced* e na programação em blocos do Scratch. Projeto acadêmico: apoiar e investigar a aprendizagem de lógica de programação.

### Ciclo central
Missão → analisar mapa → montar algoritmo → executar → observar robô → feedback → corrigir → concluir → aprender conceito.

### Decisões tomadas com o usuário
| Tema | Decisão |
|---|---|
| Coleta de dados | Cada aluno no próprio navegador. Progresso e registros por navegador. CSV exportado por máquina. Código de participante anônimo opcional para o professor juntar CSVs. |
| Renderização do mapa | Three.js via `@react-three/fiber` + `@react-three/drei`. |
| Modelos 3D | Low-poly procedural gerado em código. Zero assets 3D externos. |
| Repositórios de referência | Claude-Code-Game-Studios: não instalado, só referência. ACE-Step 1.5: ferramenta offline para gerar trilhas sonoras (opcional). Ubisoft CHORD: descartado (licença research-only, conflita com estilo low-poly). |
| Pré/pós-teste | Dentro do app, correção automática por conceito, incluído no CSV. |
| Erro durante execução | Interrompe execução, destaca bloco culpado, console explica com pista. |
| Motor de execução | AST próprio + interpretador com generators. Sem `eval`/`new Function`. |

### Premissas
- Um usuário por navegador, sem perfis nem login.
- Crescimento determinístico por ticks (cada ação do robô = 1 tick).
- Edição de blocos priorizada para desktop/tablet; celular visualiza e navega.
- Interface e conteúdo em PT-BR. Código (identificadores, arquivos) em inglês, sem comentários no código.

### Critérios de sucesso
- Aluno inicia missão, monta programa com blocos, executa, robô segue instruções reais, mapa muda, objetivo validado, feedback explicativo.
- Repetições, condicionais, variáveis e procedimentos funcionam.
- Pausa, continuar, parar, reiniciar, passo a passo funcionam sem execução duplicada.
- Fases 0–6 jogáveis, cada uma com solução de referência testada.
- Progresso salvo e recuperado após recarregar.
- Painel usa somente registros reais (ou demo explicitamente rotulado).
- Pré/pós-teste funcionais, CSV exportável.
- `tsc`, Vitest, Playwright e build verdes.

## 2. Stack

- React + TypeScript (strict) + Vite
- react-router (HashRouter, compatível com hospedagem estática)
- Zustand (estado), Zod (validação de dados persistidos)
- Blockly (editor visual)
- three, @react-three/fiber, @react-three/drei (cena 3D)
- CSS moderno com tokens (sem framework CSS)
- Vitest (unitário), @playwright/test (E2E)
- Sem backend, sem rede em runtime, LocalStorage

## 3. Arquitetura

### Camadas
```
UI (React + R3F + Blockly)
   ↓ lê estado / envia comandos
Stores (Zustand): gameSession, progress (persistido), settings (persistido)
   ↓
Execution controller: loop de ticks, pausa, passo, velocidade, runId
   ↓
Interpreter: generators sobre AST
   ↓
Engine puro: world, robot, rules, sensors, mission validation
   ↑
Data: missões declarativas, itens de avaliação
```

Regra: `src/game/` e `src/blocks/interpreter`, `src/blocks/pseudocode` não importam React, Three.js nem Blockly. Funções puras e estado imutável.

### Estrutura de pastas
```
src/
  app/            App.tsx, routes.tsx
  game/
    world/        types, grid parsing, cell helpers
    entities/     robot
    rules/        move, farm actions, growth, resources
    sensors/
    missions/     objective and constraint validation, efficiency
    execution/    controller
  blocks/
    definitions/  custom blocks, theme
    toolbox/      toolbox builder per mission
    serializer/   workspace → AST + validation
    interpreter/  AST → generator
    pseudocode/   AST → texto PT-BR
  render/         FarmScene, Robot, Plot, Plant, Obstacle, Reservoir, SeedDepot, effects, Grid2DFallback
  features/       home, mission-select, gameplay, results, tutorial, dashboard, assessment, settings, how-to-play
  components/     layout, hud, feedback, ui
  data/           missions/, assessment/
  services/       storage, export, audio
  stores/
  styles/         tokens.css, global.css
tests/
  e2e/
docs/
  decisions/
public/audio/
```

## 4. Motor e regras da simulação

### Robô
`{ x, y, facing: 'N' | 'E' | 'S' | 'W' }`. Ações agrícolas e sensores de canteiro atuam na célula onde o robô está. Sensor de obstáculo olha a célula à frente. Eixo: `x` cresce para Leste, `y` cresce para Sul.

### Célula
```ts
type Terrain = 'soil' | 'obstacle' | 'blocked' | 'reservoir' | 'seedDepot'
type PlotState = 'untilled' | 'tilled' | 'seeded' | 'growing' | 'mature' | 'harvested'
type Moisture = 'dry' | 'wet'
interface Cell { terrain: Terrain; plot: PlotState; moisture: Moisture; growth: number }
```
`plot`, `moisture` e `growth` só têm significado em `soil`. `reservoir` e `seedDepot` são transitáveis. `obstacle` e `blocked` não são.

### Transições e custos
| Ação | Pré-condição | Efeito | Custo |
|---|---|---|---|
| `moveForward` | célula à frente dentro do mapa e transitável | robô avança 1 | 1 energia |
| `turnLeft` / `turnRight` | — | gira 90° | 0 |
| `prepareSoil` | soil em `untilled` ou `harvested` | `tilled` | 1 energia |
| `plant` | soil em `tilled`, sementes ≥ 1 | `seeded`, `growth = 0` | 1 semente, 1 energia |
| `water` | soil, água ≥ 1 | `moisture = wet` | 1 água, 1 energia |
| `harvest` | soil em `mature` | `harvested`, `+1 harvested` | 1 energia |
| `collectResources` | robô em `reservoir` ou `seedDepot` | recarrega água ou sementes até capacidade | 1 energia |

Energia é verificada antes de toda ação com custo > 0.

### Crescimento
Após cada ação aplicada com sucesso, `tickWorld` roda: toda célula `seeded` ou `growing` com `moisture = wet` ganha `growth + 1`. Ao atingir `growTicks` da missão: `seeded → growing` ou `growing → mature`, `growth = 0`, `moisture = dry`. Solo seco: planta não cresce e não morre.

### Recursos
`seeds`, `water`, `energy`, `harvested`. Missão define valores iniciais e capacidade de `seeds` e `water`. `null` significa ilimitado (HUD exibe ∞). Todo valor exibido participa das regras.

### Erros
Códigos: `OUT_OF_BOUNDS`, `HIT_OBSTACLE`, `PLOT_OCCUPIED`, `SOIL_NOT_READY`, `PLANT_NOT_MATURE`, `NOTHING_TO_HARVEST`, `NO_SEEDS`, `NO_WATER`, `NO_ENERGY`, `NOT_AT_SUPPLY`, `NOT_SOIL`, `WATER_WASTED`, `STEP_LIMIT`.

Mapeamento:
- `plant` em `seeded|growing|mature` → `PLOT_OCCUPIED`; em `untilled|harvested` → `SOIL_NOT_READY`.
- `harvest` em `seeded|growing` → `PLANT_NOT_MATURE`; em `untilled|tilled|harvested` → `NOTHING_TO_HARVEST`.
- `prepareSoil` em `tilled|seeded|growing|mature` → `PLOT_OCCUPIED`.
- Ação agrícola fora de `soil` → `NOT_SOIL`.
- `water` em solo já `wet` com `rules.forbidWaterWet` → `WATER_WASTED`.

Todo erro interrompe a execução. Cada erro tem mensagem padrão + pista em PT-BR; a missão pode sobrescrever via `commonMistakes`.

### Contrato puro
```ts
applyAction(state: GameState, action: ActionType, mission: MissionRules): ActionResult
interface ActionResult { state: GameState; events: GameEvent[]; error?: GameError }
evaluateSensor(state: GameState, sensor: SensorType): boolean
tickWorld(state: GameState, growTicks: number): GameState
validateMission(state: GameState, mission: MissionDefinition): MissionValidation
```

### Sensores
`isPlotEmpty` (plot em `untilled|tilled|harvested`), `isSoilDry`, `isPlantMature`, `isObstacleAhead` (fora do mapa também conta como obstáculo), `hasSeeds`.

### Limite de passos
Cada nó executado (ação, avaliação de condição, iteração de laço, chamada) conta 1 passo. Padrão 2000, sobrescrevível por missão. Excedido → `STEP_LIMIT` com mensagem sobre laço que não termina.

### Fim de execução
Programa termina → `validateMission`. Sucesso ou falha explicada ("O programa terminou, mas ainda faltam 2 plantas para colher").

## 5. Blocos, AST, interpretador e controller

### Blockly
- Bloco chapéu `when_run` ("Quando executar"), um por workspace (`maxInstances: 1`), não deletável. Só blocos encaixados nele executam. Blocos soltos ficam esmaecidos com aviso.
- Blocos custom PT-BR com tooltip:
  - Movimento: `robot_move_forward`, `robot_turn_left`, `robot_turn_right`
  - Agricultura: `farm_prepare_soil`, `farm_plant`, `farm_water`, `farm_harvest`, `farm_collect`
  - Sensores (output `Boolean`): `sensor_plot_empty`, `sensor_soil_dry`, `sensor_plant_mature`, `sensor_obstacle_ahead`, `sensor_has_seeds`
  - Controle: `controls_repeat_ext`, `controls_whileUntil` (só `WHILE`), `controls_if` (mutator else habilitado por missão)
  - Lógica: `logic_compare`, `logic_operation`, `logic_negate`, `logic_boolean`
  - Números/variáveis: `math_number`, `variables_get`, `variables_set`, `math_change`, `math_arithmetic` (só `+` e `-`)
  - Procedimentos: `procedures_defnoreturn`, `procedures_callnoreturn` (sem parâmetros)
- `check` de tipos impede encaixes inválidos.
- Toolbox gerada a partir de `allowedBlocks` da missão.
- Tema custom: cores por categoria, fonte Inter.

### AST
```ts
type Stmt =
  | { kind: 'action'; action: ActionType; blockId: string }
  | { kind: 'repeat'; times: Expr; body: Stmt[]; blockId: string }
  | { kind: 'while'; cond: Expr; body: Stmt[]; blockId: string }
  | { kind: 'if'; cond: Expr; then: Stmt[]; else?: Stmt[]; blockId: string }
  | { kind: 'setVar'; name: string; value: Expr; blockId: string }
  | { kind: 'changeVar'; name: string; delta: Expr; blockId: string }
  | { kind: 'call'; name: string; blockId: string }

type Expr =
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'var'; name: string }
  | { kind: 'sensor'; sensor: SensorType; blockId: string }
  | { kind: 'compare'; op: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE'; left: Expr; right: Expr }
  | { kind: 'logic'; op: 'AND' | 'OR'; left: Expr; right: Expr }
  | { kind: 'not'; value: Expr }
  | { kind: 'arith'; op: 'ADD' | 'MINUS'; left: Expr; right: Expr }

interface Program { main: Stmt[]; procedures: Record<string, Stmt[]> }
```

### Serializer
Workspace Blockly → `Program`. Validação antes de executar:
- Slot obrigatório vazio → erro com `blockId` ("O bloco 'se' está sem condição").
- Chamada a procedimento inexistente.
- Recursão (direta ou indireta) proibida.
- Variável usada antes de definida → valor 0 com aviso no console.
Erro de validação destaca o bloco e não executa.

### Interpretador
```ts
function* interpret(program: Program, ctx: InterpreterContext): Generator<ExecStep, ExecOutcome, ActionFeedback>
type ExecStep =
  | { type: 'action'; action: ActionType; blockId: string }
  | { type: 'check'; blockId: string; label: string; result: boolean }
  | { type: 'loop'; blockId: string; iteration: number }
  | { type: 'call'; blockId: string; name: string }
```
- Sensores leem o estado atual via `ctx.read()`.
- Ao `yield` de ação, o controller aplica a ação no engine e devolve `ActionFeedback` (sucesso ou erro). Erro encerra o generator.
- Contador de passos em `ctx`; excedido encerra com `STEP_LIMIT`.
- Repetições com contagem: valor avaliado uma vez, arredondado, negativo vira 0, máximo 1000.

### Controller
Estados: `idle`, `running`, `paused`, `finished`, `failed`.
```
idle --run--> running --pause--> paused --resume--> running
paused --step--> paused (avança 1 ExecStep)
idle --step--> paused (inicia e avança 1)
running|paused --stop--> idle (estado inicial restaurado)
* --reset--> idle (estado inicial da fase, novo generator)
running --fim--> finished | failed
```
- Cada execução recebe `runId`; timers verificam `runId` atual, descartando ticks obsoletos.
- Cada `ExecStep` é um passo visível (inclusive condições, com resultado no console: "O solo está seco? → sim").
- Velocidades 0,5x / 1x / 2x / 4x, delay base 500 ms. Animações usam a mesma duração.
- Destaque: `workspace.highlightBlock(id)`. Erro: bloco com estilo de erro + `setWarningText`.
- Contador de comandos = ações aplicadas com sucesso.
- Workspace fica somente leitura durante `running`/`paused`.

### Pseudocódigo
`AST → string` PT-BR indentado, atualizado ao vivo:
```
quando executar:
    repita 3 vezes:
        se solo está seco:
            regar
        mover para frente
```

## 6. UI, renderização e telas

### Referência visual obrigatória
Arquivo: `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`. O jogo deve assumir esta identidade: fazenda low-poly isométrica rica em detalhes, cromo de interface verde-escuro com cartões claros arredondados, blocos estilo Scratch com ícones.

### Cena 3D
- Câmera ortográfica isométrica fixa; botões girar 90° e zoom.
- Grade da missão cercada por cenário decorativo procedural determinístico (semente = id da missão): árvores low-poly (copas facetadas em verdes variados), cercas de madeira, pedras cinza, gramado em blocos com variação de tom, galpão/celeiro, moinho/silo. Decoração fica fora da grade e não participa das regras.
- Canteiros: blocos de terra elevados com bordas de madeira; tom marrom claro (seco) / escuro (molhado) + brilho azul; sulcos em `tilled`; broto / planta média / planta madura com frutos vermelhos/alaranjados; colhido (palha); obstáculo = rocha facetada; bloqueado = arbusto denso/cerca; reservatório = tanque azul com estrutura; depósito de sementes = caixa/silo com sacos; marcadores de objetivo.
- Robô: corpo branco arredondado em caixa, visor escuro com dois olhos ciano, antena curta, duas rodas grandes escuras; seta azul no chão indica direção.
- Estado não depende só de cor: forma, altura, ícones flutuantes (gota, check de maduro), legenda.
- Animações disparadas por eventos do engine já aplicados: tween de posição/rotação, scale-in de planta, partículas de água, item voando para o HUD na colheita, shake + ícone de erro.
- Configuração "gráficos leves": sem sombras, sem partículas, sem decoração densa, DPR 1.
- Sem WebGL ou modo 2D escolhido: mensagem + `Grid2DFallback` em CSS Grid usando o mesmo estado.
- Painel textual acessível descrevendo robô e célula atual.

### Layout de gameplay (desktop)
```
┌ HUD escuro: logo │ Fase N - Título / objetivo │ Sementes │ Água │ Energia │ Colheita │ ? │ ⚙ │ Sair ┐
│ Categorias │ Flyout + workspace Blockly │ Cena 3D                     │ Execução                │
│ (quadrado  │                            │                             │ [▶ Executar]            │
│  colorido  │                            │                             │ [⏸ Pausar/Continuar]    │
│  + nome)   │                            │                             │ Passo a passo (toggle)  │
│            │                            │                             │  + [Próximo passo]      │
│            │                            │                             │ Velocidade (slider 4)   │
│            │                            │                             │ [■ Parar] [↺ Reiniciar] │
│            │                            │                             │ Abas: Console·Dicas·    │
│            │                            │                             │       Pseudocódigo      │
└────────────┴────────────────────────────┴─────────────────────────────┴─────────────────────────┘
```
- HUD: chips de recurso com ícone + rótulo + valor; botão vermelho "Sair" volta ao mapa de missões.
- Contador de comandos e bloco atual ficam no topo do console.
- Tablet: abas Programa / Fazenda / Execução. Celular (< 768 px): aviso de experiência ideal em telas maiores; visualização e execução permitidas.

### Telas
- **Início:** cena 3D de fazenda em tela cheia (celeiro vermelho, moinho, silo, árvores, robô em primeiro plano); logo "AgroBlocks" com folha, "Automatize. Programe. Cultive.", texto de apresentação; botões à esquerda: Iniciar nova fazenda (verde), Continuar missão (escuro, mostra "Fase N - título"; desabilitado sem progresso), Como jogar, Configurações.
- **Missões ("Seus desafios"):** mapa 3D isométrico com trilha/rio ligando nós hexagonais numerados (concluída = check verde, disponível = destaque azul, bloqueada = cadeado cinza); cartão lateral com miniatura, número, título, objetivo, conceito, dificuldade em estrelas, melhor resultado e "Iniciar fase". Lista acessível equivalente por teclado/leitor de tela; em telas pequenas a lista substitui o mapa.
- **Gameplay:** briefing em modal antes de começar (conceito + objetivo + demonstração opcional).
- **Resultado:** modal sobre cena de celebração (robô com caixa de colheita, confetes) — ver seção 7; painel "Como funciona?" com os blocos da solução em miniatura, passos numerados "O que o robô fez?" e caixa "Dica".
- **Tutorial (Fase 0):** balão de fala sobre a cena + indicador "n/6" com pontos + botões ← / Próximo / →. Passos que pedem ação real (arrastar, remover, executar, pausar, continuar, corrigir) desabilitam "Próximo" até o evento acontecer.
- **Configurações:** modal com abas laterais Geral (idioma — apenas Português (Brasil), tema), Som (música, efeitos), Visual (reduzir animações, gráficos leves, modo 2D/3D), Controles (velocidade padrão, atalhos), Dados (código de participante, reiniciar progresso com confirmação).
- **Painel educativo**, **Avaliação**, **Como jogar**: mesmo cromo (cartões claros sobre fundo verde-escuro).

### Design system
- Tokens CSS: `#183D2D`, `#358653`, `#B9DCA8`, `#F5F7F0`, `#806044`, `#4185D6`, `#F2C14E`, `#15221C`; cromo de jogo escuro por padrão com cartões claros; modo escuro completo.
- Cores das categorias de blocos (como na referência): Movimento azul `#4C8DF6`, Agricultura verde `#3FA34D`, Sensores amarelo `#E0A526`, Controle roxo `#8E5BE8`, Variáveis laranja `#F07C2A`, Procedimentos rosa `#E0508F`, Números teal `#3D9AA3`, chapéu "quando executar" amarelo com ícone ▶.
- Blocos com ícones SVG próprios (seta para movimento, broto/gota/cesto para agricultura).
- Fonte Inter. Foco visível 3 px amarelo. Alvos ≥ 44 px. Contraste AA nos textos de interface (blocos amarelos usam tom escurecido para legibilidade).
- Atalhos: Ctrl+Enter executar, Espaço pausar/continuar, `.` passo, Esc parar.
- `prefers-reduced-motion` respeitado + opção manual.

### Áudio
SFX sintetizados via Web Audio API. Trilhas geradas offline com ACE-Step 1.5 em `public/audio/`, opcionais, carregadas sob demanda, desligáveis. Jogo funciona sem os arquivos.

## 7. Missões, dicas, resultados e progresso

### Definição declarativa
```ts
interface MissionDefinition {
  id: string
  order: number
  title: string
  concept: Concept
  difficulty: 1 | 2 | 3
  briefing: { conceptIntro: string; goalText: string; demo?: Program }
  map: { cells: string[] }
  robot: { x: number; y: number; facing: Facing }
  resources: { seeds: number | null; water: number | null; energy: number | null; seedCapacity: number | null; waterCapacity: number | null }
  growTicks: number
  rules: { forbidWaterWet?: boolean; stepLimit?: number }
  allowedBlocks: BlockType[]
  initialProgram?: Program
  objectives: Objective[]
  constraints?: Constraint[]
  efficiency: { referenceActions: number; referenceBlocks: number }
  hints: [string, string, string, string]
  solutionExplanation: string
  referenceSolution: Program
  commonMistakes?: Partial<Record<ErrorCode, string>>
}
```
Mapa: cada linha é uma string de tokens separados por espaço, um token por célula. Primeiro caractere: `.` untilled, `t` tilled, `s` seeded, `g` growing, `m` mature, `h` harvested, `#` obstacle, `X` blocked, `R` reservoir, `S` seedDepot. Sufixo opcional `w` em células de solo = `wet` (padrão `dry`). Exemplo: `". tw g mw # R"`. Parser rejeita linhas de larguras diferentes e tokens inválidos.

Objetivos: `harvestAtLeast(n)`, `cellsInState(cells, state)`, `allSoilInState(state)`, `robotAt(x, y)`, `cellsWet(cells)`. Restrições: `maxWaterUsed(n)`, `maxSeedsUsed(n)`, `maxEnergyUsed(n)`.

### Fases
| # | Nome | Conceito | Desafio |
|---|---|---|---|
| 0 | Treinamento | interface | tutorial guiado em mapa pequeno |
| 1 | Primeira colheita | sequenciamento | 5×5, planta madura a 3 casas + 1 curva; blocos mover, virar, colher |
| 2 | Plantação em série | repetição | fileira de 6 canteiros: preparar, plantar, mover; introduz repetir N |
| 3 | Irrigação inteligente | condicionais | fileira com solos secos e molhados fixos; `forbidWaterWet`; introduz se/senão e sensor solo seco |
| 4 | Colheita automatizada | sensores + enquanto | 2 fileiras com plantas maduras e imaturas; colher só maduras, percorrer até obstáculo |
| 5 | Recursos limitados | variáveis | água e sementes limitadas, reservatório e depósito no mapa; contar uso com variável, reabastecer |
| 6 | Fazenda eficiente | laços aninhados, procedimentos, depuração | grade 4×4 ciclo completo; começa com programa pré-carregado contendo bug |

### Avaliação de resultado
- **Correção:** objetivos + restrições atendidos → concluída.
- **Eficiência** (só se correta): ações vs `referenceActions`, blocos vs `referenceBlocks`, recursos consumidos → 1 a 3 estrelas rotuladas "Eficiência". Solução correta nunca é reprovada.

### Dicas graduais
Botão "Pedir dica" revela níveis 1 → 4 em ordem: conceitual, condição a verificar, categoria de bloco, exemplo parcial. Nível 4 só após 2 tentativas falhas. Uso registrado.
Detector de padrão (Fase 2+): mesma sequência de ≥ 2 comandos repetida ≥ 3 vezes consecutivas → dica contextual sobre laço.

### Tela de resultado
Mensagem, objetivo alcançado, ações executadas, tentativas, recursos consumidos, dicas usadas, conceito, explicação da solução, pseudocódigo do aluno, comparação com melhor resultado anterior do próprio aluno, botões Examinar algoritmo / Melhorar solução / Próxima fase.

### Progresso persistido
```ts
interface SaveData {
  version: 1
  participantCode?: string
  missions: Record<string, {
    status: 'locked' | 'available' | 'completed'
    attempts: number
    bestResult?: { actions: number; blocks: number; resources: ResourceUsage; efficiencyStars: 1 | 2 | 3 }
    hintsUsed: number
    errorCounts: Partial<Record<ErrorCode, number>>
    savedProgram?: string
  }>
  attempts: AttemptRecord[]
  assessments: { pre?: AssessmentResponse; post?: AssessmentResponse }
}
```
- Chave `agroblocks:v1`. Validado com Zod na leitura; inválido → estado limpo (backup do bruto em `agroblocks:corrupt`).
- Fase N+1 desbloqueia ao concluir N. Fase 0 e 1 disponíveis no início.
- Workspace salvo automaticamente por missão (debounce).
- "Continuar" abre a menor fase disponível não concluída, ou a última.
- Resetar progresso exige confirmação.

## 8. Avaliação da aprendizagem e painel

### Banco de itens
- Conceitos: sequenciamento, repetição, condicionais, identificação de erros, interpretação de algoritmos.
- Forma A (pré) e forma B (pós), 2 itens por conceito cada, 10 itens por forma. Itens pareados com mesma estrutura e dificuldade, cenários diferentes.
- Tipos: múltipla escolha; localizar linha com erro em pseudocódigo; prever posição final do robô em mini grade; ordenar passos.
- Pré-teste oferecido antes da Fase 1 (pular é registrado). Pós-teste liberado após concluir Fase 6.
- Sem feedback de acerto durante o teste. Resultado por conceito exibido ao final do pós-teste.

### Painel educativo
- Banner: "Dados registrados neste navegador. Não constituem resultados de pesquisa até serem coletados e analisados."
- Sem dados → estado vazio explícito.
- "Carregar dados de demonstração": mantido em memória, nunca persistido nem exportado, exibido com faixa DEMO.
- Cards: fases concluídas, taxa de conclusão, tentativas totais, dicas usadas.
- Gráficos SVG próprios: tentativas por missão, erros mais frequentes, pré × pós por conceito.
- Tabela por missão.

### Exportação CSV
UTF-8 com BOM, separador `;`, escaping de aspas.
- `tentativas.csv`: participante, missão, conceito, tentativa, timestamp, resultado, código de erro, ações, blocos, sementes, água, energia, dicas.
- `missoes.csv`: resumo por missão.
- `avaliacao.csv`: participante, forma, item, conceito, resposta, correta.

Sem dados pessoais, sem rede, sem rastreamento.

### Documentação
- `README.md`: instalação, scripts, arquitetura, decisões técnicas, build, deploy estático (GitHub Pages, Netlify, Vercel), limitações (mobile, WebGL).
- `docs/metodologia.md`: lacuna investigada, objetivos pedagógicos, instrumentos, indicadores, dados de uso × evidências de aprendizagem, limitações, ética (TCLE/TALE, autorização institucional).
- `docs/decisions/`: ADRs curtos (AST + generator, Three.js procedural, LocalStorage, HashRouter, Zustand).
- `docs/audio.md`: como gerar trilhas com ACE-Step offline.

## 9. Testes

### Unitários (Vitest, sem DOM)
- Movimento, rotação, limites, obstáculos, custo de energia.
- Cada transição válida e cada erro da tabela; consumo e recarga de recursos.
- Crescimento: molhado avança, seco não, solo seca após avanço, limiar.
- Sensores verdadeiro/falso.
- Interpretador: sequência, repeat (número e variável), while, if/else, variáveis, procedimentos, `STEP_LIMIT` com e sem ações.
- Serializer com Blockly headless: AST esperado, slot vazio, blocos soltos, recursão.
- Controller: pause/resume/step, stop, reset, `runId` descarta ticks obsoletos, falha.
- Missões: solução de referência de cada fase passa; programa incorreto falha com erro esperado.
- Progresso: salvar/carregar, corrompido, versão, desbloqueio.
- Pseudocódigo: snapshots.
- CSV: escaping, BOM.

### E2E (Playwright, Chromium)
1. Home → nova fazenda → missões → Fase 1.
2. Montar programa → executar → colheita → resultado.
3. Programa errado → mensagem educativa + bloco destacado.
4. Passo a passo avança um passo por clique.
5. Avançar para Fase 2.
6. Recarregar → progresso e programa persistem; Continuar habilitado.
7. Painel vazio sem dados; números reais após jogar.

WebGL headless via SwiftShader; se instável, E2E força `Grid2DFallback`.

### Gate de conclusão
`tsc --noEmit`, `vitest run`, `playwright test`, `vite build` verdes + smoke manual das fases com solução de referência.

## 10. Fora de escopo (v1)
Backend, contas, multiusuário no mesmo navegador, sincronização remota, editor de missões, parâmetros em procedimentos, texturas PBR, modelos glTF, internacionalização além de PT-BR.
