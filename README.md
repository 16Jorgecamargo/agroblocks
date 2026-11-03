# AgroBlocks

Jogo educativo de automação agrícola e programação visual para o Ensino Médio. O estudante programa um robô agrícola com blocos (Blockly) para plantar, regar, colher e administrar recursos de uma fazenda em 3D low-poly.

> Automatize. Programe. Cultive.

## Links

- **Jogar:** <https://agroblocks.vercel.app>
- **Apresentação:** <https://16jorgecamargo.github.io/agroblocks/presentation/>
- **Termo de Abertura do Projeto:** [agroblocks-project-charter.docx](docs/deliverables/agroblocks-project-charter.docx)

Na apresentação, as setas ou o espaço trocam de slide e o `Enter` avança as animações, uma por vez. `N` mostra as notas do apresentador e `F` abre em tela cheia.

## Sobre o projeto

Muitos estudantes entendem o que um problema pede, mas travam na hora de transformá-lo em passos de um algoritmo. No AgroBlocks esse exercício acontece numa fazenda: o aluno monta um programa com blocos em português, executa e vê o robô cumprir cada instrução no mapa 3D. Quando algo dá errado, o jogo para na instrução que falhou, explica o motivo e oferece dicas graduais.

O jogo começa com um treinamento guiado e segue por seis mundos, um para cada conceito: sequência, repetição, condições, sensores, variáveis e eficiência. Cada mundo tem 5 missões, além de uma prova inicial e uma prova final que medem a evolução do aluno. O professor acompanha tudo pelo painel, com gráficos, detalhe por aluno e exportação CSV.

Projeto da disciplina de Informática na Educação, UTFPR Santa Helena.

## Como iniciar

Requisitos:

- Node.js 20.19 ou superior (testado com Node 22) e npm 10.
- Navegador moderno com WebGL. A fazenda é sempre 3D; só um navegador sem WebGL cai numa grade 2D simples.

```bash
git clone https://github.com/16Jorgecamargo/agroblocks.git
cd agroblocks
npm install
npm run dev
```

Abra `http://localhost:5173`. Em modo local, o painel do professor usa a senha `dashboard` e um banco em memória, apagado ao reiniciar.

Os slides também abrem localmente: abra `docs/presentation/index.html` direto no navegador.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run typecheck` | checagem TypeScript estrita |
| `npm test` | testes unitários e de componentes (Vitest) |
| `npx playwright install chromium` | instala o navegador dos testes E2E (uma vez) |
| `npm run test:e2e` | testes de interface (Playwright, contra o build de produção) |
| `npm run howto:record` | regrava os vídeos de demonstração do treinamento em `public/howto/` (Chrome com janela, usa a GPU) |
| `npm run build` | typecheck + build de produção em `dist/` |
| `npm run preview` | serve o build localmente |

## Funcionalidades

- Editor de blocos em português com liberação gradual por mundo.
- Motor de execução próprio: interpreta o programa do aluno sem `eval`, com pausa, continuação, passo a passo, parada, reinício, velocidade e limite de passos.
- Simulação agrícola determinística (preparo, plantio, irrigação, crescimento, colheita, recursos e energia).
- Treinamento guiado em 15 etapas: holofote na área real da tela com balão apontando, e antes de cada ação um vídeo gravado do próprio jogo, com uma mão fantasma, mostra como fazer (adicionar, encaixar e apagar blocos, executar e parar, passo a passo, dicas, console, pseudocódigo e corrigir erro).
- 6 mundos, um por conceito (sequência, repetição, condições, sensores, variáveis e eficiência), cada um com 5 missões (conhecer, praticar, apertar, consertar e desafio final) e uma prova inicial e uma prova final próprias, de 5 questões de programação sobre o conceito do mundo. Ao terminar cada prova o aluno vê quantas acertou, a resposta certa e a explicação de cada questão. Cada mundo é uma fazenda 3D low-poly com trilha de missões; o próximo mundo abre depois da prova final do anterior.
- Feedback educativo com mensagens de erro explicativas, dicas graduais e pseudocódigo gerado dos blocos.
- Tela de resultado que separa correção de eficiência e compara soluções corretas.
- Cadastro do aluno (nome e escola), envio de cada jogada para o servidor e painel do professor com senha, gráficos, detalhe por aluno e exportação CSV.
- O progresso fica no navegador (LocalStorage) e cada jogada é enviada ao servidor do projeto para o painel do professor.

## Painel do professor e banco de dados

Ao iniciar uma fazenda, o aluno informa nome completo e escola. Cada fazenda vira uma "jogada" enviada ao servidor (Vercel Functions em `api/`) e guardada no Upstash Redis: cadastro, tutorial (concluído, pulado e em qual etapa), missões, tentativas com pseudocódigo e respostas das provas de cada mundo. O envio acontece 2 s depois de cada mudança e é refeito sozinho se a internet cair.

O painel (`/#/painel` ou "Painel do professor" na tela inicial) pede a senha, conferida no servidor. Ele mostra todos os alunos com filtros por escola, nome e período, gráficos, tabela ordenável, detalhe de cada jogada, exportação CSV e dados de demonstração.

### Configuração no Vercel (uma vez)

1. Projeto → **Storage** → **Create** → **Upstash for Redis** (plano Free) → **Connect** ao projeto.
2. **Settings → Environment Variables**: `TEACHER_PASSWORD` = uma senha só sua e `TEACHER_TOKEN_SECRET` = um texto aleatório longo.
3. Faça um **Redeploy**.

Sem essas variáveis o jogo funciona normalmente, mas o painel mostra "Painel indisponível: servidor não configurado." Em `npm run dev` e `npm run preview` a API roda dentro do Vite com o banco em memória descrito em "Como iniciar".

## Publicação (hospedagem estática)

O build usa caminhos relativos (`base: './'`) e rotas com `#` (HashRouter), então funciona em qualquer servidor estático, inclusive em subpastas.

- **GitHub Pages:** `npm run build` e publique o conteúdo de `dist/` (por exemplo, com a action `actions/deploy-pages`).
- **Netlify:** comando `npm run build`, pasta `dist`.
- **Vercel:** framework "Vite", saída `dist`. As funções em `api/` são publicadas junto; veja "Painel do professor e banco de dados".
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
docs/             specs e planos, metodologia, decisões, áudio, Termo de Abertura
docs/presentation/  slides e gravação dos vídeos do jogo real (recording/)
```

O engine (`src/game`) e o interpretador não importam React, Three.js nem Blockly e são testados sem interface.

## Movimento e assets

- **Animações:** toda animação usa [Motion](https://motion.dev) — `motion/react` na interface e `animate()` sobre objetos Three.js na cena 3D. Molas, durações e easings ficam em `src/motion/` e seguem a [Motion Reference](https://motion-reference.takayustudio.jp). Tabela completa em `docs/motion.md`. "Reduzir animações" (ou `prefers-reduced-motion`) desliga movimento, confete, voos e efeitos.
- **Mundo 3D:** `src/render/world/buildWorld.ts` gera, de forma determinística, o ambiente das três cenas (fazenda do jogo, mapa de missões e tela inicial): pátio com celeiros, silos e moinhos, pasto cercado com animais que passeiam, pomar, rio com ponte, caminhos de terra, floresta e chão coberto de grama e flores. Os modelos são CC0 (Kenney Nature Kit, Quaternius Nature Crops, Farm Buildings, Farm Animals e Stylized Nature MegaKit), convertidos para GLB em `public/models/` (≤ 10 MB) com escala calculada pela altura real de cada objeto. Uma tela de carregamento cobre cada cena até os modelos chegarem. O robô, o tomateiro (plantado, crescendo, pronto para colher) e as cercas são desenhados em código, com animações de pose para cada ação do robô.
- **Legenda:** o botão "Legenda" da fazenda abre um painel com uma página por estado do solo (vazio, preparado, molhado, plantado, crescendo, pronto para colher) e pelos elementos da fazenda, cada uma com o canteiro em 3D, o bloco que leva até ali e o próximo passo.
- **Recursos no HUD:** sementes, água, energia e colheita só aparecem nas fases que usam o recurso.
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
8. Mundo compartilhado gerado por função pura, com instancing.
9. Robô, tomateiro e cercas procedurais com poses calculadas por funções puras.
10. Treinamento guiado com vídeos do próprio jogo.
11. Cadastro do aluno, envio ao servidor e painel do professor.
12. Mundos de conceitos com 5 missões e provas por mundo.
13. Paisagens temáticas: estilo e planta própria por mundo, objetos desenhados por instância.

## Mundos e missões

| Mundo | Conceito | Missões |
|---|---|---|
| Treinamento | interface (tutorial guiado) | 1 |
| 1 Horta | sequência | 5 |
| 2 Milharal | repetição | 5 |
| 3 Pomar | condições | 5 |
| 4 Estufa | sensores e laço enquanto | 5 |
| 5 Celeiro | variáveis | 5 |
| 6 Fazenda completa | eficiência, procedimentos e depuração | 5 |

Cada mundo tem estilo próprio (cores, luz, relevo e borda) e uma paisagem feita à mão, tanto no mapa da tela de missões quanto no cenário da missão: silos e campos de milho no Milharal, quadras de frutíferas em degraus no Pomar, estufas geminadas na Estufa, celeiro e piquetes no Celeiro, canteiros com sebe e galinheiro na Horta e a casa da fazenda com um pedaço de cada mundo na Fazenda completa.

As 5 missões de cada mundo seguem o mesmo ritmo: conhecer (1), praticar (2), apertar com limite (3), consertar um programa (4) e desafio final (5). Antes da primeira missão o aluno faz a prova inicial do mundo e, depois da quinta, a prova final, com 5 questões de programação cada (2 de montar, 2 de prever e 1 de consertar), sem depender do jogo. Ao concluir cada prova aparece o retorno com a resposta certa e a explicação.

Cada missão é um objeto em `src/data/missions/<mundo>/` com mapa, recursos, blocos permitidos, objetivos, restrições, dicas e uma solução de referência validada por teste automatizado.

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

O aluno informa nome completo e escola; esses dados, o progresso nas missões e as respostas das avaliações são enviados ao servidor e só aparecem no painel protegido por senha. O dialog de cadastro avisa o aluno sobre esse envio. Dados de uso não são, sozinhos, evidência de aprendizagem. Veja `docs/metodologia.md`.

## Áudio

Efeitos sonoros são sintetizados em tempo real, incluindo um acorde curto quando a tela de carregamento some e a cena aparece. A música são duas faixas em `public/audio/` que tocam em sequência quando "Música" está ligada.

## Licença e créditos

Os modelos 3D de terceiros são CC0; a lista está em `CREDITS.md`. Inspirado nas mecânicas de *The Farmer Was Replaced* e na programação em blocos do Scratch, sem uso de seus assets.
