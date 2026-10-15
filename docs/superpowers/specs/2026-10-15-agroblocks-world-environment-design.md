# AgroBlocks — Ambiente do mundo 3D completo (design)

**Data:** 2026-10-15 · **Branch base:** `feat/agroblocks-motion` · **Referência visual obrigatória:** `reference/AgroBlocks_ Fazenda Inteligente em Ação.png` (recortes em `.playwright-mcp/ref/home.png`, `map.png`, `gameplay.png`)

## 1. Objetivo

O usuário achou a cena "muito vazia", "feia", com "proporções todas erradas" e "celeiro todo errado", e pediu animais andando. Objetivo: as três cenas 3D — fazenda do jogo, mapa de missões e tela inicial — devem parecer a imagem de referência: fazenda low-poly cheia e coerente, com pátio de construções vermelhas, cercas de madeira, caminhos de terra, rio com ponte, floresta em volta, flores e grama no chão, e animais vivos no pasto.

**O usuário disse:** cena vazia e feia; proporções erradas; celeiro errado; quer animais andando; usar tudo o que está em `assets-src/`; ficar parecido com a referência; vale para todas as cenas; limite de assets de 10 MB aceito.

**Premissas (minhas):** a zebra fica fora (não é animal de fazenda); a cena da celebração no resultado continua simples (só robô); o grid da missão continua idêntico em regra e leitura.

## 2. Fidelidade à referência (prevalece em caso de dúvida)

- **Início (`home.png`):** celeiro vermelho grande com telhado cinza à esquerda; caixa-d'água atrás; moinho de vento (estilo cata-vento de torre) à direita; morros ao fundo com casinhas pequenas e árvores redondas; cerca de madeira atravessando; canteiros com fileiras de plantas; robô em primeiro plano à direita.
- **Mapa (`map.png`):** ilha de grama sobre fundo azul-marinho, bordas de penhasco; rio azul serpenteando com pontes de madeira; caminhos de terra clara ligando os nós das fases; floresta densa de árvores redondas e pinheiros; celeiros vermelhos e moinho entre os nós.
- **Jogo (`gameplay.png`):** canteiros com moldura de madeira; cerca de madeira em volta; reservatório azul; pedras cinza; árvores redondas; grama com tufos.
- Paleta: verdes vivos (`#5cbf4f`, `#45a04a`), terra clara de caminho (`#c9a46b`), madeira (`#8a5a33`), vermelho celeiro (`#b33a2b`), telhado cinza (`#8b8f87`), água (`#4c9be8`).

## 3. Assets

### 3.1 Pacotes usados

| Pacote | Uso |
|---|---|
| Kenney Nature Kit | árvores redondas, pinheiros, pedras, arbustos, cercas, terreno em tiles (`ground_grass`, `ground_path*`, `ground_river*`), pontes, penhascos (`cliff_*`), troncos, fogueira, flores, cogumelos, vitórias-régias, placa, fileiras de plantio |
| Quaternius Nature Crops | tomateiro em 5 estágios (já usado), árvores frutíferas do pomar (`Apple_*`, `Orange_*`), fileiras decorativas (milho, trigo, alface, abóbora) |
| Quaternius Farm Buildings | `BigBarn`, `Barn`, `SmallBarn`, `Silo`, `Silo_House`, `TowerWindmill`, `Windmill`, `WaterTower`, `Well`, `ChickenCoop`, `OpenBarn`, `Fence` |
| Quaternius Farm Animals | `Cow`, `Horse`, `Pig`, `Sheep`, `Llama`, `Pug` (zebra fora) |
| Quaternius Stylized Nature MegaKit | `CommonTree_*`, `Pine_*`, `Bush_Common*`, `Grass_*`, `Flower_*`, `Clover_*`, `Fern_1`, `Mushroom_*`, `Pebble_*`, `Rock_Medium_*`, `RockPath_*` |
| Quaternius Animated Robot | robô (já usado) |

### 3.2 Proporções por altura-alvo

`scripts/assets/assets.config.json` troca `scale` manual por `targetHeight` (unidades do jogo; 1 canteiro = 1). O build mede a altura real do modelo (bounding box com skin aplicada) e grava no manifesto a `scale` resultante e o `yOffset` que apoia a base em y = 0. Tiles de terreno usam `targetWidth: 1`.

Alturas-alvo: robô 0,9 · tomateiro maduro 0,8 · vaca 1,1 · cavalo 1,5 · porco 0,6 · ovelha 0,75 · lhama 1,4 · cachorro 0,45 · árvore redonda 2,4–3,0 · pinheiro 3,0 · árvore do pomar 2,2 · arbusto 0,6 · pedra grande 0,9 · celeiro grande 4,5 · celeiro 3,6 · celeiro pequeno 2,6 · silo 6 · moinho de torre 6 · caixa-d'água 5 · poço 1,4 · galinheiro 1,2 · cerca 0,6 · grama/flor 0,2–0,5.

### 3.3 Materiais e texturas

- Construções e animais mantêm as cores do pacote, exceto onde a referência difere: `assets.config.json` ganha `tint` (nome do material → cor sRGB) por modelo. Os celeiros do pacote têm material `RoofBlack` (telhado preto, por isso o "celeiro errado"); o `tint` troca para o cinza da referência `#8b8f87`, e as paredes `DarkRed`/`LightRed` para `#b33a2b`/`#c4473a`. As folhas Kenney seguem a paleta (já feito).
- Todos os materiais foscos (metal 0, rugosidade 0,85).
- Texturas do MegaKit: só a cor base, redimensionada para 512 px e convertida para WebP (`@gltf-transform/functions` `textureCompress` com `sharp`); mapas normal removidos.
- Orçamento total: **10 MB** (`MODEL_BUDGET_BYTES = 10 * 1024 * 1024`).

## 4. Mundo compartilhado

### 4.1 `buildWorld`

`src/render/world/buildWorld.ts` — função pura e determinística:

```ts
buildWorld(input: { gridWidth: number; gridHeight: number; seed: string; density: 'full' | 'light'; layout: 'farm' | 'map' | 'home' }): World
```

`World = { ground; paths; river; island; trail; props: PropItem[]; pasture: Vec2[] | null; animals: AnimalSpawn[]; butterflies: Vec2[] }`. Coordenadas em unidades do jogo, origem no centro do grid da missão (para `farm`).

### 4.2 Terreno

`World` traz `ground` (retângulo de grama), `paths` e `river` como polilinhas com largura, `island` (só no `map`) e `trail` (pontos das fases no `map`). O renderizador desenha caminhos e rio como faixas curvas suaves (Catmull-Rom): terra clara `#c9a46b`; rio com margem `#d9c08a` e água `#4c9be8`. Pontes de madeira (Kenney `bridge_wood`) entram onde um caminho cruza o rio, calculadas por interseção de segmentos. A ilha do mapa é uma placa com laterais de rocha. Faixas curvas no lugar de tiles quadrados evitam o visual "em blocos" e seguem os caminhos arredondados da referência. O grid da missão continua desenhado pelo `PlotTile` atual.

### 4.3 Zonas na `farm`

A câmera isométrica olha de +x/+z. Objetos altos ficam a −x/−z e a pelo menos 3 tiles do grid; o lado +x/+z recebe só itens baixos (flores, grama, fileiras de plantio).

- **Pátio (−z, atrás):** celeiro grande, silo, moinho de torre, caixa-d'água, poço, galinheiro, pilha de toras.
- **Caminho de terra:** do pátio até a borda do grid, com placa.
- **Pasto cercado (−x, esquerda):** retângulo cercado com `Fence`; animais dentro; cachorro solto no pátio.
- **Pomar e rio (+x, direita, afastado):** árvores frutíferas; rio atravessando com ponte de madeira onde o caminho cruza.
- **Fileiras de plantio (+z, frente baixa):** fileiras de milho, trigo e alface.
- **Floresta (anel externo):** árvores redondas Kenney/MegaKit, pinheiros, arbustos, pedras grandes, cogumelos.
- **Chão:** tufos de grama, trevos, flores e pedrinhas espalhados (Poisson disk) fora de caminhos, rio, construções e grid.
- Densidade `light`: sem grama/flores/pedrinhas e metade da floresta.

### 4.4 `map`

O mapa de missões usa `buildWorld({ layout: 'map' })`: ilha com penhascos, rio serpenteando com duas pontes, caminho de terra passando pelos 7 nós das fases (posições exportadas como `world.trail`), celeiros e moinho entre nós, floresta densa nas bordas. Os rótulos hexagonais atuais ficam sobre `world.trail`.

### 4.5 `home`

A tela inicial usa `buildWorld({ layout: 'home' })` com a câmera em perspectiva atual: celeiro grande à esquerda, caixa-d'água atrás, moinho de torre à direita, cerca atravessando, canteiros com plantas no meio, morros (procedurais, como hoje) com celeiros pequenos ao fundo, robô em primeiro plano.

## 5. Animais

- `src/render/world/animalBrain.ts` — máquina de estados pura: `idle(duração 2–6 s)` → `walk(até ponto aleatório dentro do pasto)` → `idle`; `nextTarget(random, pasture, from)` sempre dentro do polígono e a ≥ 0,8 de outros alvos.
- `src/render/world/Animal.tsx` — carrega o GLB do animal, toca o clipe pelo estado (`walk` → `Walk`/`WalkSlow`; ovelha usa `Jump` como passo; `idle` → `Idle`), move com `animate()` do Motion na posição e vira com mola `SPRINGS.snap`; velocidade 0,6–1,2 unidade/s por espécie.
- Rebanho na `farm`: 2 vacas, 2 cavalos, 3 porcos, 4 ovelhas, 1 lhama no pasto; 1 cachorro no pátio. No `map`: grupos pequenos perto dos celeiros. Na `home`: 2 vacas e 2 ovelhas atrás da cerca.
- "Reduzir animações" ou "Gráficos leves": animais parados em pose `Idle` congelada (sem mixer, sem deslocamento).

## 5b. Vida e densidade

O usuário pediu "um ambiente bem preenchido e vivo igual nas imagens de referência". Densidade alvo da `farm` em `full`: cerca de 90 árvores/arbustos/pedras na floresta, 400 itens de chão (grama, trevos, flores, samambaias, cogumelos, pedrinhas), pomar com 10 a 12 macieiras, 5 fileiras de plantio e 9 a 10 construções no pátio. Elementos vivos:

- animais andando (seção 5);
- borboletas (8 na `farm`, 6 no `map`, 5 na `home`): pequenos pares de asas que voam em laços (Motion);
- pás do moinho girando (quando o modelo tiver um nó de pás identificável);
- vitórias-régias balançando no rio.

Todos param com "Reduzir animações" ou "Gráficos leves".

## 5c. Tela de carregamento (splash)

Pedido do usuário: "deixe uma tela de carregamento (splash) caso precise carregar as coisas". Cada cena 3D (fazenda, mapa e início) fica coberta por uma splash enquanto o chunk JS e os GLB carregam:

- fundo azul-marinho do cromo com o logo;
- texto "Carregando fazenda…";
- barra de progresso real (`useProgress` do drei);
- pontos saltitantes (Motion).

A splash some com fade quando o canvas foi criado e não há carregamento ativo, ficando no mínimo 0,4 s na tela. Com movimento reduzido, some sem animação. Também some se um modelo falhar, pois o fallback entra no lugar.

## 6. Desempenho

- Itens repetidos (grama, flores, trevos, pedrinhas, tiles de terreno, cercas) renderizados com instancing (`InstancedMesh` por tipo de geometria/material, via `Instances` do drei ou implementação própria).
- Sombras só em construções, árvores, animais e robô.
- Meta: média ≥ 55 fps na Fase 4 a 2x em 1440×900 com gráficos normais; `light` ≥ 55 fps em notebook fraco.

## 7. Acessibilidade e regras do projeto

- Cenas continuam `aria-hidden`; nada do ambiente muda regras, foco ou textos.
- Sem comentários no código; identificadores em inglês; durações em `src/motion/presets.ts`; molas em `src/motion/springs.ts`; nenhum asset externo em runtime.

## 8. Testes e aceite

**Unitários:**
- `buildWorld`: determinístico por `seed`; nenhum prop sobre o grid, caminhos ou rio; objetos altos fora do lado +x/+z; contagens mínimas por zona em `full`; `light` reduz grama/flores a zero; `map` expõe 7 pontos de trilha sobre tiles `path`.
- `animalBrain`: alvo sempre dentro do pasto; alterna idle/walk; durações dentro dos limites.
- Pipeline: manifesto contém todos os modelos referenciados pelo `buildWorld`; cada entrada tem `scale` e `yOffset` coerentes com `targetHeight` (±10%); orçamento ≤ 10 MB.

**E2E:** fazenda 3D carrega sem erros e sem requisições externas (teste atual cobre); mapa e início renderizam canvas sem erros.

**Visual (obrigatório):** screenshots 1440×900 de início, mapa e fazenda (Fase 1 e Fase 4) lado a lado com os recortes da referência; corrigir proporções e composição até ficarem coerentes.

**Aceite:** cenas cheias e coerentes como na referência · celeiro vermelho com telhado cinza · proporções corretas entre robô, canteiro, animais, construções e árvores · animais andando · ≥ 55 fps · ≤ 10 MB · modo leve e movimento reduzido respeitados · suítes verdes.

## 9. Fora de escopo

Interação com animais; dia/noite; clima; som ambiente; troca de layout por fase além da semente.
