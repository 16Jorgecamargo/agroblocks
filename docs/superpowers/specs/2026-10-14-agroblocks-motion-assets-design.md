# AgroBlocks — Redesign de movimento, diálogos e assets

Data: 2026-10-14
Status: aprovado em conversa, aguardando revisão da spec escrita
Base: `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (continua valendo; esta spec substitui as partes de animação, diálogos e modelos 3D)

## 1. Entendimento compartilhado

### O que o usuário disse
- Animações, diálogos e assets da primeira versão estão ruins.
- Usar a biblioteca **Motion** em tudo que for possível.
- Referência de animação: https://motion-reference.takayustudio.jp (782 padrões com duração e easing).

### Decisões tomadas
| Tema | Decisão |
|---|---|
| Assets 3D | Modelos prontos CC0 (Quaternius, Kenney) convertidos para GLB em tempo de desenvolvimento |
| Intensidade | Jogo vibrante: molas com quique, estrelas, chuva de moedas, confete, botões que afundam |
| Diálogos | Painel de jogo: borda grossa, fita de título, sombra em relevo, botões com degrau |
| Abordagem | Motion como camada única: `motion/react` na interface e `animate()` do Motion sobre objetos Three.js na cena 3D |

### Premissas
- "Reduzir animações" e `prefers-reduced-motion` continuam desligando movimentos de transform e efeitos decorativos.
- Toda animação continua disparando somente depois do evento já aplicado pelo motor.
- O engine, o interpretador, o controller e os dados não mudam.

## 2. Sistema de movimento (`src/motion/`)

Dependência: `motion` (import `motion/react` para componentes e `animate` de `motion` para valores e objetos 3D).

| Arquivo | Conteúdo |
|---|---|
| `springs.ts` | Molas nomeadas `{ stiffness, damping, mass }`: `snap` (180,13,0.6), `bounce` (150,9,0.8), `smooth` (120,26,1), `modal` (280,28,1), `sheet` (260,20,1), `pill` (240,24,1), `push3d` (420,24,1), `star` (400,14,1), `marker` (150,15,1), `achievement` (240,22,1), `toast` (300,24,1), `cameraKick` (220,18,1), `jelly` (290,6.8,1) |
| `easings.ts` | `easeOutCubic`, `easeInOutCubic`, `easeOutBack`, `easeOutExpo`, `easeInCubic`, `easeInOutSine`, `easeOutQuart` como arrays cubic-bezier |
| `presets.ts` | Variants e transições: `fadeSlide` 600ms, `softRise` 900ms, `snapIn` 380ms, `shrinkFadeExit` 520ms, `staggerList` 760ms (stagger 0.06s), `gridWave` 900ms, `questBanner` (easeOutExpo), `overshoot` 600ms easeOutBack, `errorShake` 540ms, `nudge` 520ms, `badgePop`, `focusHalo` 900ms, `bouncePress` (whileTap), `blurCrossfade` 600ms, `iris` 600ms, `push` 400ms, `odometer` 750ms, `countUp` 2000ms, `rowExpand` 720ms |
| `useMotionPrefs.ts` | Combina a configuração do jogo com `prefers-reduced-motion`; retorna `{ reduced, decorative }` |
| `MotionProvider.tsx` | `<MotionConfig reducedMotion>` e transição padrão |

Regras:
- Nenhum número de animação solto em componentes; tudo vem de `springs`/`easings`/`presets`.
- `docs/motion.md` tabela cada preset → padrão de origem na referência (nome, duração, easing).
- Movimento reduzido: `MotionConfig reducedMotion="always"`, efeitos decorativos (confete, chuva de moedas, partículas 3D, loops ambientes) não são montados.
- A velocidade de execução (0,5x–4x) escala apenas as animações do robô e da fazenda.

## 3. Diálogos e transições de tela

### `GameDialog` (substitui `Modal`)
- Cartão claro, borda 4px na cor do tom (`success` verde, `info` azul, `danger` vermelho), cantos 24px, sombra em relevo (`0 8px 0` escura + sombra difusa).
- Fita de título colorida ultrapassando as bordas, com ícone grande à esquerda.
- Botões de jogo (`GameButton`) com degrau inferior; afundam no clique (`bouncePress`/`push3d`).
- Entrada: fundo escurece e desfoca 300ms; cartão com mola `sheet` (y 40→0, escala 0,92→1); conteúdo em cascata 60ms; fita com `overshoot`.
- Saída: `shrinkFadeExit` via `AnimatePresence`.
- Acessibilidade mantida: foco inicial, Esc, Tab circular, `aria-modal`, foco devolvido.

### Uso
- Briefing: `questBanner` + chips de objetivo em cascata; "Começar" com brilho pulsante suave.
- Configurações: abas com pílula deslizante (`layoutId`, mola `pill`); interruptores com mola (`GameToggle`).
- Confirmações perigosas: tom `danger`, ícone de alerta com `nudge`.
- Avaliação: troca de questão com `push`; alternativa escolhida com `badgePop`.

### Rotas
- `AnimatePresence` sobre as rotas; padrão `blurCrossfade`.
- Mapa → fase: `iris` (clip-path circular a partir do centro).
- Fase → mapa: `push`.

### Telas
- Início: logo `softRise`, folha com balanço contínuo, botões `staggerList`, câmera 3D com dolly-in.
- Mapa: nós `gridWave`; fase disponível pulsando (mola `marker`); desbloqueio novo com cadeado abrindo; cartão lateral troca com flip suave.
- Resultado: estrelas uma a uma (mola `star`), números `countUp`, título com explosão de brilho, confete, conceito aprendido com mola `achievement`.

## 4. HUD, controles e feedback no gameplay

- Recursos: valores com rolagem de odômetro (`odometer`); gasto pisca vermelho, ganho pisca verde.
- Colheita: ícone de fruto voa em arco da posição projetada do canteiro na tela até o chip "Colheita"; o chip faz `badgePop` e o número sobe.
- Recurso abaixo de 20%: chip pulsa âmbar; em zero, `errorShake` uma vez.
- Executar: troca de ícone ▶/⏸ animada; botões de jogo com `bouncePress`.
- Passo a passo: `GameToggle`.
- Velocidade: quatro pílulas (0,5x, 1x, 2x, 4x) com indicador deslizante, substituindo o slider.
- Estado: troca com `snapIn`; erro faz `errorShake` no painel.
- Abas Console/Dicas/Pseudocódigo: sublinhado deslizante (`layoutId`); conteúdo `fadeSlide`.
- Console: novas linhas entram com mola `toast`; erro com `errorShake`; sucesso com `badgePop`.
- Dicas: cartões com `rowExpand`; botão com batimento discreto após 2 falhas seguidas; dica bloqueada mostra cadeado que abre ao liberar.
- Editor de blocos: bloco em execução com anel brilhante pulsante (`focusHalo`, via classe CSS no SVG do Blockly animada por Motion); bloco com erro treme e recebe contorno vermelho.
- Tutorial: balão `overshoot`, pontos de progresso saltitantes, seta indicadora com `nudge` em loop.
- Celebração na fase: "Missão concluída!" com explosão de brilho e confete antes de ir ao resultado.

## 5. Cena 3D e assets

### Fontes (CC0)
- Plantas: Quaternius *Ultimate Crops Pack* (5 estágios de crescimento) → `seeded`, `growing` (2 estágios intermediários conforme `growth`), `mature`, `harvested`.
- Cenário: Kenney *Nature Kit* (árvores, pedras, cercas, arbustos).
- Robô: Quaternius *Animated Robot* (idle, run, jump, dance, thumbs up, wave, yes, no…), material recolorido para branco com visor/olhos ciano.
- Celeiro, silo, moinho, reservatório, depósito: equivalentes CC0 de Kenney/Quaternius quando existirem; caso contrário, a versão procedural atual refinada.

### Pipeline (desenvolvimento)
- `scripts/assets/` baixa os pacotes, converte FBX/OBJ → GLB (`fbx2gltf`, `obj2gltf`) e otimiza com `@gltf-transform/cli` (dedup, weld, prune, compressão de textura).
- Saída versionada em `public/models/*.glb` + `public/models/manifest.json` (`id`, arquivo, uso, licença, autor, origem).
- Orçamento: ≤ 5MB somando todos os modelos.
- `CREDITS.md` com autores e licenças.
- Nenhum recurso externo carregado em tempo de execução.

### Carregamento
- `useGLTF` com `useGLTF.preload` para todos os modelos ao abrir o mapa de missões; tela de carregamento com shimmer e pontos saltitantes.
- `Clone` para objetos repetidos; instancing para canteiros quando o número de células exigir.
- Falha de carregamento de um modelo → componente procedural atual como fallback, sem quebrar a cena (error boundary por modelo).

### Animação 3D com Motion
- Robô: posição com mola `smooth` escalada pela velocidade; rotação com mola `snap`; clipe do modelo por estado (`run` movendo, `idle` parado, `thumbsUp`/`dance` em vitória, `no` + tremida em erro).
- Plantas: troca de estágio com `overshoot` (encolhe e cresce com quique).
- Plantio: semente cai com quique de aterrissagem.
- Colheita: fruto salta em arco e dispara o voo até o HUD.
- Rega: gotas caem; cor do solo faz crossfade em 700ms.
- Erro: camera kick (mola `cameraKick`) + borda da tela pulsando vermelho discreto.
- Câmera: dolly-in ao abrir a fase; girar e zoom com mola `smooth`.
- Ambiente: balanço leve de árvores e moinho girando; desligados em movimento reduzido ou gráficos leves.

### Fallback 2D
Continua disponível; células trocam de estado com `badgePop` e o robô se move com mola.

## 6. Testes e critérios de aceite

### Unitários
- Presets e molas com os valores da referência; versão reduzida com duração 0 e decorativos desligados.
- `GameDialog`: foco, Esc, Tab, e remoção do DOM após saída.
- Odômetro mostra o valor final com mudanças rápidas.
- Voo da colheita disparado uma vez por evento `harvested` e nunca antes do evento.
- Todo `PlotState` tem modelo mapeado.
- Manifest: todo modelo referenciado existe e tem licença CC0.
- Clipe do robô escolhido por estado do controller.
- Os 285 testes existentes continuam verdes (ajustes onde a marcação mudar).

### E2E
- Os 9 testes atuais continuam verdes.
- Abrir/fechar diálogo: some do DOM e foco volta ao botão de origem.
- Fase 1 em 3D carrega os GLB sem erros de console e sem requisições a outros domínios.
- Com "Reduzir animações", nenhuma animação de transform roda.

### Verificação visual
Screenshots de início, mapa, gameplay (robô andando, erro, colheita), resultado e diálogos comparados com a referência visual antes de concluir cada fase.

### Aceite
Motion em toda animação de interface e 3D · diálogos no estilo painel de jogo · modelos CC0 no lugar de primitivas · animações sempre após o evento real · 60fps em notebook comum com gráficos normais · modo leve e 2D funcionando · assets ≤ 5MB · zero comentários no código.

## 7. Fora de escopo
Novas missões, mudanças no motor ou nas regras, novos idiomas, música nova, efeitos de pós-processamento pesados (bloom, SSAO).

## 8. Fidelidade à referência visual (revisão de 2026-10-14)

O usuário pediu que jogo, logo e telas fiquem bem parecidos com `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`, que contém 7 telas. Onde esta spec divergir da imagem, **a imagem prevalece**. Recortes de cada painel: início, mapa, tutorial, gameplay, resultado, "Como funciona?", configurações.

| Tela | Exigências da referência |
|---|---|
| Identidade | Logo com "Agro" verde (degradê, contorno escuro) e "Blocks" marrom (#5b3a1e), broto de duas folhas acima do fim da palavra e folha junto ao "A"; fonte arredondada grossa (Baloo 2 800). No HUD o logo é todo verde. Cromo escuro azul-marinho/ardósia (`#131f29` fundo, `#1c2a35` superfícies), cartões claros (`#f7f6f2`/branco). |
| Diálogos | Cartão claro limpo, cantos ~18px, sombra suave; cabeçalho com ícone + título em negrito + botão X; divisória; corpo. Sem fita. Animação Motion mantida (mola `sheet`, cascata). |
| Configurações | Abas laterais (Geral, Som, Visual, Controles, Dados) com pílula azul na selecionada; **Geral** mostra Idioma (select à direita), Música, Efeitos sonoros, Reduzir animações, Modo escuro (interruptores verdes) e botão "Reiniciar progresso" largo, contorno e texto vermelhos sobre fundo vermelho claro. |
| Início | Cena 3D clara em tela cheia (celeiro, casa, silo, moinho, robô em primeiro plano à direita); logo e textos escuros no topo, sem painel escuro; botões translúcidos no canto inferior esquerdo: "Iniciar nova fazenda" (verde), "Continuar missão" (escuro translúcido, subtítulo "Fase N - título"), "Como jogar" e "Configurações" (pequenos, escuros). Indicador de progresso discreto. |
| Mapa | Fundo azul-marinho; "Voltar" em pílula à esquerda; título "Seus desafios" e subtítulo centralizados em branco; nós hexagonais com número e ícone (verde com check = concluída, azul brilhante = atual, cinza com cadeado = bloqueada) e rótulo ao lado; cartão branco à direita com miniatura, "Fase N", título, descrição, conceito com lâmpada, "Dificuldade" com estrelas laranja e botão verde "Iniciar fase". A lista acessível fica visualmente oculta quando o mapa 3D aparece (visível ao receber foco). |
| Tutorial | Balão de fala branco com ponta apontando para o robô sobre a fazenda; topo com "Tutorial", "n/6" e pontos (atual verde); navegação inferior centralizada: botão escuro ←, botão verde "Próximo", botão escuro →. |
| Gameplay | HUD azul-marinho com chips escuros (ícone colorido + rótulo + valor), botões quadrados de ajuda e engrenagem, "Sair" vermelho; categorias do Blockly em painel branco com quadrados coloridos arredondados e categoria selecionada em pílula azul; flyout cinza claro; workspace claro pontilhado; painel direito branco "Execução" com "Executar" verde, "Pausar" cinza, "Passo a passo", **slider de Velocidade azul** e cartão "Console" com lixeira. |
| Resultado | Cena de celebração à esquerda (robô com caixa de tomates, celeiro, moinho, confete retangular colorido); cartão branco com estrela amarela, "Missão concluída!", frase do objetivo; caixas: "Comandos executados" + "Recursos consumidos" (ícones) e "Tentativas" + selo verde "Conceito aprendido"; botões "Ver solução" e "Tentar novamente" escuros e "Próxima fase" verde grande. |
| Como funciona? | Cartão claro: título, frase explicando o conceito; à esquerda os **blocos do programa do aluno desenhados** (Blockly somente leitura); à direita caixa cinza "O que o robô fez?" com passos numerados em círculos; abaixo caixa bege "Dica" com lâmpada. |
