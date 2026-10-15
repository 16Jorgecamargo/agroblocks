# AgroBlocks — Robô da referência, tomateiro legível, cercas, legenda, HUD e tela de sucesso

**Data:** 2026-10-15 · **Branch:** `feat/agroblocks-motion` · **Referência:** `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`

## 1. Contexto e objetivo

Feedback do usuário após o mundo 3D (spec `2026-10-15-agroblocks-world-environment-design.md`):

- Plantas do canteiro finas (tomate Quaternius), não condizem com o cenário; não dá para saber se estão prontas para colher.
- Cercas parecem erradas (`fence_simple` Kenney esticado ×1,9).
- Voltar ao robô antigo, igual ao da referência, com todas as animações: parado, andando, virando, preparando solo, plantando, regando, colhendo, coletando, erro, comemorando.
- Tela de sucesso fraca, não acompanha o resto; o cenário dela está praticamente vazio.
- Tomateiro com 3 estágios: plantado, crescendo, pronto para colher.
- Legenda vira dialog no estilo das Configurações, com uma página por estado do solo (vazio, preparado, molhado, plantado, crescendo, pronto para colher) e páginas extras para os demais elementos.
- Indicadores de sementes, água, energia e colheita só aparecem quando a fase usa o recurso.

Decisões tomadas com o usuário: tomateiro procedural cheio com estágio maduro inconfundível; robô com braço que troca de ferramenta e olhos expressivos; tela de sucesso igual à referência, com cena da fazenda bem preenchida.

**Critérios de sucesso**

1. Um aluno distingue, à primeira vista e na distância padrão da câmera, um canteiro maduro (pronto para colher) de um em crescimento.
2. O robô em jogo, na tela inicial, no tutorial e na tela de sucesso é o mesmo, no estilo da referência (corpo branco arredondado, visor escuro, olhos ciano, antena, rodas grandes).
3. Cada ação do jogo tem uma animação própria e reconhecível do robô, sincronizada com a velocidade de execução.
4. Cercas com postes e trilhos grossos de madeira, proporcionais a canteiros, animais e construções.
5. Tela de sucesso com layout da referência e cena cheia (sem plano verde vazio).
6. A legenda explica cada estado do solo com o canteiro igual ao do jogo, o bloco que leva a ele e o próximo passo.
7. O HUD não mostra recursos que a fase não usa.

## 2. Abordagem

Tudo procedural em código (geometria simples + materiais foscos compartilhados), como o robô antigo. Animações do robô são poses calculadas por funções puras e aplicadas por frame. Sem novos assets binários; os GLB de robô, tomate, palha e cerca saem do pipeline.

Alternativas descartadas: gerar GLB com clips por script (sem Blender, frágil) e novos pacotes CC0 (nenhum dos baixados tem o estilo da referência).

## 3. Robô (`src/render/robot/`)

### 3.1 Visual — `RobotRig.tsx`

Proporções em unidades de mundo (canteiro = 1):

- Corpo: caixa arredondada branca (`PALETTE.robotBody`) ~0,56 × 0,42 × 0,46, faixa cinza na base.
- Cabeça: caixa arredondada branca ~0,52 × 0,4 × 0,44 sobre pescoço curto; visor escuro (`robotVisor`) na frente.
- Olhos: dois discos ciano (`robotEye`) no visor. Expressões: `normal` (círculos), `happy` (arcos `^ ^`), `focus` (círculos achatados), `error` (X vermelho `PALETTE.error`), `blink` (traço).
- Antena com esfera luminosa (emissiva, intensidade animável).
- Rodas: duas grandes laterais (raio ~0,2, pneu escuro, cubo cinza) e uma roda de apoio atrás.
- Braço direito: ombro (pivô) → braço → cotovelo (pivô) → antebraço → encaixe de ferramenta. Braço esquerdo curto fixo (simetria visual).
- Ferramentas (só uma visível por vez): `hoe` (enxada), `seedBag` (saco), `wateringCan` (regador), `claw` (garra), `crate` (caixa com tomates, segurada pelos dois braços na comemoração da tela de sucesso).
- Altura total ~0,95 (≈ robô antigo × 1,3). Sombras ligadas.

O componente recebe uma `RobotPose` e só aplica valores aos `ref`s; não decide nada.

### 3.2 Poses — `robotPoses.ts` (puro)

```ts
type RobotClip = 'idle' | 'move' | 'turn' | 'till' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'
type RobotTool = 'none' | 'hoe' | 'seedBag' | 'wateringCan' | 'claw' | 'crate'
type EyeShape = 'normal' | 'happy' | 'focus' | 'error' | 'blink'
interface RobotPose {
  bodyY: number; bodyPitch: number; bodyRoll: number
  headYaw: number; headPitch: number
  shoulder: number; elbow: number; toolTilt: number
  wheelSpin: number
  eyes: EyeShape; antennaGlow: number
  tool: RobotTool
}
const CLIP_SPEC: Record<RobotClip, { loop: boolean; seconds: number; tool: RobotTool }>
function poseAt(clip: RobotClip, t: number): RobotPose
const REST_POSE: RobotPose
```

- `t` em segundos de clip. Loops (`idle`, `move`, `success`) são periódicos: `poseAt(c, t) == poseAt(c, t + seconds)`.
- Clips de uma vez (`turn`, `till`, `plant`, `water`, `harvest`, `collect`, `error`) começam e terminam em `REST_POSE` (com a ferramenta do clip visível só no meio).
- Movimentos:
  - `idle`: leve sobe-e-desce do corpo, cabeça olhando de lado, piscada periódica.
  - `move`: rodas girando, corpo inclinado para frente, balanço curto.
  - `turn`: rodas em sentidos opostos, cabeça antecipa o giro.
  - `till`: enxada sobe e golpeia o chão duas vezes; olhos `focus`.
  - `plant`: braço desce com saco, inclina e solta; olhos `focus`.
  - `water`: braço estende o regador e inclina; olhos `happy`.
  - `harvest`: garra desce, fecha e sobe; olhos `happy`.
  - `collect`: braço recolhe ao corpo, antena pisca forte.
  - `error`: tremor lateral, olhos `error`, antena vermelha piscando.
  - `success`: pulinhos, giro de cabeça, olhos `happy`, braços erguidos.

### 3.3 Qual clip tocar — `clipForStep` (puro)

```ts
function clipForStep(input: { events: GameEvent[]; failed: boolean; celebrating: boolean; moving: boolean }): RobotClip
```

Prioridade: `failed` → `error`; `celebrating` → `success`; eventos do último passo: `plotChanged` para `tilled` → `till`; para `seeded` → `plant`; `moistureChanged` para `wet` → `water`; `plotChanged` para `harvested` → `harvest`; `resourcesCollected` → `collect`; `robotTurned` → `turn`; `moving` (deslocamento em andamento) → `move`; senão `idle`. O evento `robotMoved` não decide o clip, porque continua em `lastEvents` depois que o deslocamento termina; mudanças de crescimento (`growing`, `mature`) e secagem também não. Com o robô parado em falha, os olhos ficam em `error` mesmo depois do clip terminar.

### 3.4 Execução — `RobotActor.tsx`

- Substitui `RobotModel`/`RobotShowcase`/`RobotBody` (arquivo `farm3d/RobotModel.tsx` vira wrapper de deslocamento que usa o novo rig, mantendo a lógica atual de posição/rotação com Motion e o shake de erro).
- Um `useFrame` avança o tempo do clip; clips de uma vez duram `min(CLIP_SPEC.seconds, durationMs do passo)` escalados pela velocidade do jogo; ao terminar, volta a `idle`. Troca de clip faz blend de 0,15 s entre poses (`blendPose`, puro).
- `eventKey` do passo reinicia o clip mesmo quando a mesma ação se repete.
- Reduzir animações: sem `useFrame`; aplica `REST_POSE` com os olhos do clip (`error` em falha, `happy` em sucesso).
- `RobotShowcase({ clip, tool? })` para tela inicial, tutorial e sucesso.

### 3.5 Efeitos novos em `Effects.tsx`

- `SoilBurst`: torrões marrons saltando ao preparar solo.
- `SeedDrop`: semente caindo do braço ao plantar.
- Mantêm `WaterSplash` e `HarvestPop`. Mapeamento evento→efeito permanece em `Effects`.

## 4. Tomateiro — `src/render/crops/CropPlant.tsx`

- Três estágios, um por estado de canteiro (`CropStage = 'planted' | 'growing' | 'ready'`, `cropStageFor(plot)`: `seeded` → `planted`, `growing` → `growing`, `mature` → `ready`, demais → `null`):
  1. **Plantado:** montinho de terra com broto de duas folhas (altura ~0,2, largura ~0,25).
  2. **Crescendo:** moita verde cheia (folhas em icosaedros achatados), largura ~0,55, altura ~0,45, sem frutos ou com 2–3 tomates verdes pequenos.
  3. **Pronto para colher:** moita cheia largura ~0,72, altura ~0,55, com 5–6 tomates vermelhos grandes (raio ≥ 0,08) bem visíveis no topo e laterais, `glow` ligado.
- Descrição pura `cropShape(stage: CropStage): CropShape` (`crops/cropShape.ts`) com listas de folhas (posição, raio), caule e frutos (posição, raio, cor `green` | `red`), mais `width`, `height` e `glow: boolean`.
- Pronto para colher também ganha: anel brilhante pulsando no chão do canteiro e um brilho flutuando acima (desligados em "Reduzir animações", fica só o anel estático) e balanço suave da moita.
- Colhido: três caules cortados e palha (substitui modelo `straw`).
- Geometrias e materiais compartilhados em módulo (criados uma vez). Variação por canteiro: rotação Y por posição (`x`,`y`) para não parecer clonado.
- `PlotTile` passa a usar `CropPlant`; `PlantModel.tsx`, `cropModelId`, `CropStage` numérico e modelos `crop-1..5`/`straw` são removidos. O progresso `growth` deixa de alterar o visual dentro de um estado.

## 5. Cercas — `src/render/world/Fences.tsx`

- Segmento padrão de 1 unidade: dois postes quadrados (0,1 × 0,55, topo chanfrado) nas pontas e dois trilhos (0,06 × 0,08) a 0,2 e 0,42 de altura; marrom quente (`PALETTE.fenceWood`, `fenceWoodDark` nos postes) como na referência.
- Porteira: postes mais altos e tábuas em X.
- `buildWorld` continua posicionando `fence` e `fence-gate` como hoje (`fenceLine`, `farmLayout`), mas esses ids passam a ser `ProceduralPropId` (`'fence' | 'fence-gate'`), fora do manifesto de GLB. `PropItem.model` vira `ModelId | ProceduralPropId`.
- Renderização com `InstancedMesh` por peça (poste, trilho, tábua) a partir dos `PropItem` de cerca, respeitando `rotation` e `scale` (comprimento). Postes adjacentes coincidentes são deduplicados (`fencePieces`, puro).
- O cercado do grid continua 1 segmento por canteiro.

## 6. Tela de sucesso

### 6.1 Cena — `CelebrationScene.tsx`

- Novo layout `celebration` em `buildWorld` (`celebrationLayout.ts`): chão completo sem bordas visíveis no enquadramento, celeiro, moinho girando, silo, cercado com animais, canteiros com tomateiros maduros, caminho de terra, árvores, flores, arbustos e borboletas. Densidade `full` igual à fazenda; `light` com gráficos leves.
- Espaço livre reservado para o robô e a caixa à esquerda do centro; nada alto entre a câmera e o robô.
- Robô `RobotShowcase` em `success` com ferramenta `crate` (caixa de tomates).
- Câmera ortográfica isométrica enquadrando o robô no terço esquerdo; mundo ocupa a tela inteira (sem céu/plano visível nas bordas em 1440×900 e 390×844).
- Coberta por `SceneWithSplash`. Fallback 2D sem WebGL como hoje.

### 6.2 Interface — `ResultsPage.tsx` / `.css`

- Layout da referência: cena em tela cheia ao fundo, cartão branco arredondado à direita (centralizado verticalmente; no celular embaixo, cena acima) e fileira de botões abaixo do cartão.
- Cartão: estrela grande + "Missão concluída!" + objetivo; duas caixas lado a lado — (a) Comandos executados + Recursos consumidos com ícones, (b) Tentativas + selo verde "Conceito aprendido"; linha de eficiência (estrelas), blocos e dicas; selo "Solução correta".
- Botões: "Ver solução" e "Tentar novamente" escuros (estilo HUD), "Próxima fase" verde largo — mesmo `GameButton` do jogo.
- Tokens visuais iguais ao HUD (cores, raios, sombras, fonte). Confete mantido. Animações de entrada atuais mantidas.
- Conteúdo, textos e a seção "Como funciona?" (`HowItWorks`) inalterados.

## 7. Legenda em dialog com páginas

- O botão "Legenda" da fazenda abre um `GameDialog` no mesmo padrão do `SettingsDialog` (título, botão fechar, navegação lateral à esquerda, conteúdo à direita, foco preso e retorno de foco ao botão). Substitui a lista `farm-view__legend`.
- Dados puros em `src/features/legend/legendPages.ts`:

```ts
type LegendPageId = 'empty' | 'prepared' | 'wet' | 'planted' | 'growing' | 'ready' | 'obstacle' | 'reservoir' | 'depot' | 'goal'
interface LegendPage {
  id: LegendPageId
  group: 'Solo' | 'Fazenda'
  title: string
  description: string
  reachedBy: string | null
  next: string | null
  sensor: string | null
  preview: LegendPreview
}
const LEGEND_PAGES: LegendPage[]
```

- Ordem: grupo **Solo** — Vazio, Preparado, Molhado, Plantado, Crescendo, Pronto para colher; grupo **Fazenda** — Pedra, Reservatório de água, Depósito de sementes, Canteiro do objetivo.
- Cada página: mini cena 3D (`LegendPreview3D`, um único `Canvas` reaproveitado entre páginas) com o canteiro exatamente como no jogo (`PlotTile`/`CropPlant`/objetos), girando devagar (parado em "Reduzir animações"); título; descrição curta para Ensino Médio; "Chega aqui com:" (bloco que leva ao estado, ex.: *preparar solo*); "Próximo passo:" (ex.: *plantar semente*); sensor relacionado quando houver (ex.: *solo seco?*, *planta madura?*).
- Navegação: itens laterais clicáveis, setas ◀ ▶ com "n/10", teclas ←/→. Abre na página Vazio. No celular, a lista lateral vira faixa horizontal rolável no topo.
- Sem WebGL ou modo 2D: preview com a célula do `Grid2D` correspondente.
- `LegendPreview` descreve o canteiro a mostrar (`plot`, `moisture`, `object`, `goal`), reaproveitando os mesmos componentes da fazenda.

## 8. Indicadores de recursos só quando usados

- `GameHud` mostra cada chip apenas se a fase usa o recurso, por função pura `visibleResources(mission): HudResource[]` (`'seeds' | 'water' | 'energy' | 'harvest'`) em `hudLogic.ts`, baseada nos blocos da solução de referência (`programBlockTypes(mission.referenceSolution)`) e nos recursos limitados — e não em `allowedBlocks`, que inclui blocos distratores:
  - **Sementes:** solução usa `farm_plant` ou `mission.resources.seeds !== null`.
  - **Água:** solução usa `farm_water` ou `mission.resources.water !== null`.
  - **Energia:** `mission.resources.energy !== null`.
  - **Colheita:** solução usa `farm_harvest`.
- Esperado: Treinamento, Fase 1 e Fase 4 só Colheita; Fase 2 Sementes; Fase 3 Água; Fase 5 Sementes e Água; Fase 6 Sementes, Água e Energia. Um teste fixa essa tabela.
- Chips somem sem deixar espaço vazio; animações de ganho/perda e o alvo do voo da colheita mantidos. Se a colheita não for exibida, o voo de colheita não é disparado.

## 9. Pipeline de assets

- Remover de `assets.config.json`: `robot`, `crop-1..5`, `straw`, `fence`, `fence-gate`. Rodar `npm run assets:build`; manifesto regenerado.
- `robotClipFor` antigo e `entry.clips` do robô saem de `modelChoice.ts`.

## 10. Testes

Unitários (Vitest):
- `poseAt`: cada clip difere de `idle` em ao menos um campo no meio do clip; loops periódicos; clips de uma vez começam/terminam em `REST_POSE`; ferramenta correta no meio de cada clip.
- `blendPose`: extremos iguais às poses de origem/destino.
- `clipForStep`: cada evento e prioridade.
- `cropStageFor`: `seeded`/`growing`/`mature` → `planted`/`growing`/`ready`; demais → `null`.
- `cropShape`: `ready` tem ≥ 5 frutos vermelhos e `glow`; `growing` sem frutos vermelhos e sem `glow`; largura de `ready` ≥ 1,25 × `growing` ≥ 2 × `planted`.
- `LEGEND_PAGES`: 10 páginas na ordem da seção 7, ids únicos, 6 no grupo Solo, cada página de solo com `reachedBy` (exceto Vazio) e `next` (exceto Pronto, que aponta para colher).
- `LegendDialog`: abre na página Vazio, navega por item lateral, setas e teclas ←/→, fecha e devolve foco ao botão Legenda.
- `visibleResources`: tabela da seção 8 para as 7 fases.
- `GameHud`: não renderiza chips fora de `visibleResources`.
- `fencePieces`: n segmentos em linha → n+1 postes, 2n trilhos; porteira gera tábuas em X.
- `buildWorld` `celebration`: determinístico, área do robô livre, ≥ N props, nada alto na frente da câmera.
- `ResultsPage`: renderiza cartão, estatísticas e botões (teste atual adaptado).

E2E (Playwright): legenda abre como dialog, navega até "Pronto para colher" e fecha; tela de resultado com 3D renderiza canvas e splash some sem erros de página; os 14 existentes continuam verdes.

Verificação visual (Playwright MCP 1440×900 e 390×844) contra a referência: fazenda fase 2 executando (cada animação), fase 4 com maduros, legenda (todas as páginas), HUD das fases 0–6, tela inicial, tutorial, resultado. Desempenho: custo de quadro da fazenda fase 4 sem regressão perceptível.

## 11. Fora do escopo

Novas culturas por fase, sons novos, mudanças de regras do jogo, mapa de missões (exceto cercas).
