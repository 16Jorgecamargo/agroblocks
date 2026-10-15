# AgroBlocks Motion — Emendas de fidelidade à referência

> Aplicar junto com as fases indicadas. Onde estas emendas conflitarem com o texto das fases, **estas emendas prevalecem** (spec, seção 8). Recortes de referência em `.playwright-mcp/ref/*.png` (gerados de `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`).

## R1 — Task 2.3 (nova): identidade visual — cromo azul-marinho, fonte do logo e logo

**Files:** `index.html`, `src/styles/tokens.css`, `src/components/brand/Logo.tsx`, `src/components/brand/Logo.css`, `src/components/brand/Logo.test.tsx`

- `index.html`: acrescentar `Baloo+2:wght@700;800` ao link do Google Fonts (`family=Baloo+2:wght@700;800&family=Inter:...`).
- `tokens.css`: `--font-display: 'Baloo 2', 'Inter', system-ui, sans-serif`; cromo `--chrome-bg: #131f29`, `--chrome-surface: #1c2a35`, `--chrome-border: #2a3b48`, `--chrome-text: #eef3f6`, `--chrome-text-muted: #9fb0bd`; `--card-bg: #f7f6f2`; `--brand-brown: #5b3a1e`; `--brand-green: #3c9a3a`.
- `Logo({ size = 'sm', variant = size === 'lg' ? 'brand' : 'mono', animated = false })`: texto `<span class="logo__agro">Agro</span><span class="logo__blocks">Blocks</span>`; folha junto ao "A" (SVG à esquerda) e, em `lg`, broto de duas folhas (`motion.svg`) acima do fim da palavra com balanço quando `animated`. `variant="brand"`: "Agro" degradê verde com contorno escuro (`-webkit-text-stroke`/`paint-order`), "Blocks" marrom. `variant="mono"`: tudo verde (HUD). Nome acessível continua "AgroBlocks".
- Teste: `render(<Logo size="lg" />)` → texto "AgroBlocks", `.logo__blocks` existe, `.logo__sprout` existe só em `lg`.

## R2 — Task 3.3 (emenda): início e mapa como na referência

**Início (`HomePage.tsx`/`HomePage.css`):**
- Remover o painel escuro lateral. Estrutura: `.home__hero` (topo, centralizado à esquerda do centro): logo `lg` brand, tagline `Automatize. Programe. Cultive.` verde-escura (#1f5a2c, Inter 800), texto escuro (#24323d) com leve sombra branca; `.home__actions` (canto inferior esquerdo, largura ~430px): "Iniciar nova fazenda" (verde), "Continuar missão" (fundo `rgb(30 40 48 / .78)`, subtítulo), e linha com "Como jogar" e "Configurações" (pequenos, mesmo fundo escuro translúcido). Indicador "N de 6 fases concluídas" como pílula pequena escura acima dos botões. Links "Missões · Avaliação · Painel do professor" como texto pequeno no topo direito.
- A cena da `HomeScene` ocupa a tela toda; a câmera favorece a fazenda (zoom 0,9) com o robô em primeiro plano.

**Mapa (`MissionSelectPage`, `MissionMapScene`, CSS):**
- Página `--chrome-bg`; cabeçalho com "Voltar" (pílula escura) à esquerda e título/subtítulo centralizados.
- Rótulo de cada nó = hexágono (`clip-path: polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)`) 44px com número em cima e ícone (check/cadeado/▶) + texto do título em pílula ao lado. Concluída: hexágono verde `#2f8f46`, texto em pílula verde; atual (disponível selecionada ou primeira disponível): hexágono `#1d2b38` com borda azul `#4c8df6` e brilho (`box-shadow` animado por Motion); bloqueada: cinza `#5f6b74` translúcido com cadeado.
- Lista acessível: visualmente oculta quando o mapa 3D aparece (classe `.mission-list--hidden` com `clip`), mas cada botão fica visível ao receber foco (`:focus-within` remove o `clip`); sem 3D ou em telas < 900px a lista aparece normalmente.
- Cartão de detalhe: fundo branco, miniatura arredondada no topo, "Fase N" pequeno, título 1.4rem 800, descrição, conceito com lâmpada amarela, "Dificuldade" com estrelas laranja (`#f59e0b`), botão verde largo "Iniciar fase".

## R3 — Task 3.4 (emenda): resultado como na referência

- Cartão branco à direita sobre a cena: estrela amarela grande + "Missão concluída!" (Inter 800, 1.9rem) + frase do objetivo.
- Grade de duas caixas: (1) "Comandos executados" + valor grande + "Recursos consumidos" com ícones semente/gota/raio; (2) "Tentativas" + valor + selo verde "Conceito aprendido / <conceito>". Abaixo, linha discreta "Blocos usados · Dicas usadas" e estrelas de eficiência rotuladas "Eficiência".
- Botões abaixo do cartão: "Ver solução" (escuro), "Tentar novamente" (escuro), "Próxima fase" (verde, maior). Trocar "Tentar melhorar" por **"Tentar novamente"** e atualizar `ResultsPage.test.tsx`.
- Confete retangular colorido caindo (já é o `Confetti`).

## R4 — Task 3.5 (nova): "Como funciona?" com blocos desenhados e passos do robô

**Files:** `src/features/results/robotSteps.ts` (+ teste), `src/blocks/editor/BlockPreview.tsx`, `src/features/results/HowItWorks.tsx`, CSS.

- `describeRobotSteps(program: Program): string[]` (pura, máx. 6 itens): `repeat` → "Repetiu as ações N vezes" seguido dos passos do corpo; ações no passado: mover "Moveu para o próximo canteiro", virar "Virou à esquerda/direita", preparar "Preparou o solo", plantar "Plantou uma semente", regar "Regou o canteiro", colher "Colheu a planta", coletar "Coletou recursos"; `if` → "Verificou se <condição sem '?'>"; `while` → "Repetiu enquanto <condição>"; `setVar`/`changeVar` → "Atualizou a variável <nome>"; `call` → "Executou o procedimento <nome>". Teste com o programa da referência (repita 3: preparar, plantar, mover) → `['Repetiu as ações 3 vezes', 'Preparou o solo', 'Plantou uma semente', 'Moveu para o próximo canteiro']`.
- `BlockPreview({ json })`: Blockly injetado com `readOnly: true`, sem toolbox, sem scrollbars/zoom/trashcan, tema `agroTheme`, renderer `zelos`, escala 0,8; ajusta a altura ao conteúdo (`workspace.getBlocksBoundingBox()`); descarta no unmount.
- `HowItWorks({ mission, savedProgram, fallbackPseudocode })`: título "Como funciona?", frase `mission.solutionExplanation`; à esquerda `BlockPreview` do programa salvo (se ausente/inválido, `<pre>` com o pseudocódigo); à direita caixa cinza "O que o robô fez?" com `<ol>` de círculos numerados; abaixo caixa bege "Dica" com lâmpada (`CONCEPT_TIPS`); por fim a tabela "Comparação entre soluções corretas" em `details` ("Comparar com a solução de referência").
- `ResultsPage` usa `HowItWorks` no lugar do painel atual.

## R5 — Task 4.3 (emenda): velocidade continua slider; tutorial como na referência

- **Não** trocar o slider por pílulas: manter `<input type="range" aria-label="Velocidade">` (teste antigo do slider permanece), estilizado com trilho azul `#4c8df6` e polegar branco com sombra; o valor "1x" ao lado faz `badgePop` ao mudar. Pular o novo teste de pílulas.
- Tutorial: três peças dentro da área da fazenda —
  1. faixa superior: "Tutorial" (centro, branco, 800) e à direita "n/6" + pontos (atual verde `#5cbf4f`);
  2. balão de fala branco (raio 14px, sombra, ponta triangular para baixo-esquerda) no terço superior, entrando com `overshoot`, com o texto do passo e a seta com `nudge` quando espera ação;
  3. barra inferior centralizada: botão quadrado escuro ← (`Passo anterior`), botão verde largo "Próximo", botão quadrado escuro → (avança igual a "Próximo"; desabilitado quando espera ação).

## R6 — Task 4.2/4.4 (emenda): gameplay como na referência

- HUD usa o cromo azul-marinho (via tokens R1); logo `mono`; botões de ajuda/engrenagem quadrados escuros.
- Toolbox do Blockly (`BlocklyEditor.css`): painel branco; cada categoria com quadrado colorido arredondado de 22px à esquerda (cor da categoria) e rótulo; categoria selecionada com fundo azul `#4c8df6`, texto branco e cantos 10px; flyout `#eef1f4`; workspace `#f7f8f9` com grade pontilhada.
- Painel "Execução" e "Console" em cartões brancos com sombra suave e cantos 14px sobre o cromo.
