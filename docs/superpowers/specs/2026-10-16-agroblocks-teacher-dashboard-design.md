# AgroBlocks — Cadastro do aluno, envio ao servidor e Painel do professor

**Data:** 2026-10-16
**Status:** aprovado em conversa, aguardando revisão desta spec

## Objetivo

O professor (dono do projeto) quer ver, num só lugar, tudo o que cada aluno fez no jogo: quem jogou, de qual escola, como foi em cada fase e como respondeu às avaliações pré e pós. Hoje os dados ficam presos no navegador de cada aluno. Esta entrega:

1. pede nome completo e escola ao começar uma fazenda;
2. envia cadastro, progresso das missões, tentativas e respostas das avaliações para um banco gratuito no Vercel;
3. remonta a tela "Painel do professor" como um dashboard de todos os alunos, protegido por senha.

## Decisões do usuário

- Banco: **Upstash Redis** (Vercel Marketplace, plano grátis).
- Recomeço: cada "Apagar e começar" cria **nova jogada do mesmo aluno**; nada é sobrescrito.
- Legado: **remover** o código do participante e o painel local. Dados de demonstração e exportação CSV continuam, agora sobre todos os alunos.
- Consentimento: **só um aviso** no dialog de cadastro, sem caixa de aceite.
- Senha do painel: `dashboard`, conferida no servidor.
- Somente desktop.

## Glossário

- **Aluno:** pessoa identificada por nome + escola normalizados.
- **Jogada (run):** uma fazenda, do cadastro até o próximo "Apagar e começar". Tem `runId` (UUID) próprio.
- **Snapshot:** cópia completa da jogada enviada ao servidor (cadastro + `SaveData`).

## 1. Cadastro do aluno

### Dialog "Quem está jogando?"

Componente `StudentDialog` (`src/features/student/`), `GameDialog` tom `info`.

- Campos: **Nome completo** e **Escola**.
- Validação:
  - nome com pelo menos 2 palavras de 2+ letras, até 80 caracteres;
  - escola com 3 a 120 caracteres;
  - os dois campos são aparados (trim) e têm espaços internos repetidos colapsados.
- O campo Escola usa `<datalist>` com as escolas já usadas neste navegador (chave `agroblocks:schools:v1`, até 10 itens, mais recente primeiro).
- Aviso fixo abaixo dos campos: "Seu nome, sua escola, seu progresso nas missões e suas respostas das avaliações serão enviados ao professor para acompanhamento da atividade."
- Botões: **Cancelar** e **Começar**. "Começar" fica desabilitado enquanto a validação falha; o erro aparece abaixo do campo depois que ele perde o foco.

### Quando o dialog aparece

| Situação | Fluxo |
|---|---|
| "Iniciar nova fazenda" sem progresso | StudentDialog → `startRun(student)` → `/jogar/m0-training` |
| "Iniciar nova fazenda" com progresso | "Começar uma nova fazenda?" → **Apagar e começar** → StudentDialog → `startRun(student)` (apaga e cria jogada nova) → treinamento. Cancelar em qualquer etapa não apaga nada. |
| "Continuar missão" sem cadastro (save antigo) | StudentDialog → `registerStudent(student)` (mantém progresso, cria `runId`) → missão |
| "Continuar missão" com cadastro | segue direto, como hoje |

Entrar direto por rota (`/#/missoes`, `/#/jogar/...`) sem cadastro não bloqueia o jogo; os dados só não são enviados até existir cadastro.

### Dados locais

`SaveData` muda:

```ts
interface StudentInfo { name: string; school: string }

interface SaveData {
  version: 1
  runId: string | null
  student: StudentInfo | null
  createdAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: { pre: AssessmentResponse | null; post: AssessmentResponse | null }
}
```

- `participantCode` sai do tipo, do store, das Configurações e do CSV.
- O schema zod aceita saves antigos: `participantCode` é ignorado e `runId`/`student` faltando viram `null`.
- `progressStore` ganha:
  - `startRun(student)`: zera o save, gera `runId` novo com `crypto.randomUUID()` e grava o aluno;
  - `registerStudent(student)`: mantém o progresso, grava o aluno e gera `runId` se faltar.
- `resetProgress` deixa de ser usado pela Home.

## 2. Envio ao servidor

### Snapshot

```ts
interface RunSnapshot {
  runId: string
  student: StudentInfo
  studentKey: string
  createdAt: string
  updatedAt: string
  missions: Record<string, MissionProgress>
  attempts: AttemptRecord[]
  assessments: SaveData['assessments']
}
```

- `MissionProgress.savedProgram` não é enviado: é o programa em edição e não tem valor para o painel.
- `studentKey = normalize(name) + '|' + normalize(school)`. `normalize` faz minúsculas, remove acentos (NFD sem marcas), colapsa espaços e apara.
- `updatedAt` é o momento do envio.

### Fila de envio (`src/services/sync/`)

- `runSync` observa o `progressStore`. A cada mudança de save com `runId` e `student` presentes, agenda um envio para 2 s depois; mudanças dentro da janela reiniciam o prazo.
- Envio: `POST /api/runs` com o snapshot em JSON. Em falha de rede ou status ≠ 2xx, grava `agroblocks:sync-pending:v1 = runId` e tenta de novo:
  - no próximo save;
  - ao abrir o app;
  - no evento `online`.
- Sucesso limpa a pendência.
- Nunca lança erro para a interface nem mostra mensagem ao aluno.
- Há só um envio em voo por vez; se outro for pedido durante o envio, sai logo depois com o estado mais novo.
- O envio é iniciado em `App` por um componente `RunSync` sem UI.

## 3. Servidor (Vercel Functions)

Pasta `api/` na raiz, funções Node em TypeScript, com a lógica testável em `server/`.

### Armazenamento (`server/store.ts`)

Interface `RunStore`:
- `put(snapshot)`;
- `list()`, que devolve todos os snapshots;
- `remove(runId)`.

Duas implementações:
- `createRedisStore(redis)`, usando `@upstash/redis`:
  - `SET run:<runId> <json>`;
  - `ZADD runs <updatedAtMs> <runId>`;
  - `list` = `ZRANGE runs 0 -1` + `MGET` em lotes de 100;
  - `remove` = `DEL` + `ZREM`.
- `createMemoryStore()`, para testes e para a API local em desenvolvimento.

Variáveis de ambiente:
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`, ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (o que o Marketplace injetar);
- `TEACHER_PASSWORD`;
- `TEACHER_TOKEN_SECRET`.

### Rotas

| Rota | Auth | Comportamento |
|---|---|---|
| `POST /api/runs` | não | valida com zod (`server/runSchema.ts`); corpo > 512 KB → 413; inválido → 400; recalcula `studentKey` no servidor; `put`; 204 |
| `POST /api/teacher/login` | não | corpo `{ password }`; compara com `TEACHER_PASSWORD` em tempo constante; certo → 200 `{ token, expiresAt }`; errado → 401 após 400 ms de espera |
| `GET /api/teacher/runs` | token | 200 `{ runs: RunSnapshot[] }`, mais recente primeiro |
| `DELETE /api/teacher/runs?id=<runId>` | token | `remove`; 204 |

- Token: `base64url(expiresAtMs) + '.' + base64url(HMAC-SHA256(TEACHER_TOKEN_SECRET, expiresAtMs))`, com validade de 12 h, enviado em `Authorization: Bearer`. Token inválido ou expirado → 401.
- Se faltar variável de ambiente, responde 503 `{ error: 'not-configured' }`.
- Os handlers são funções puras `(request: { method, headers, body, query }, deps) → { status, headers?, body? }` em `server/handlers.ts`. Os arquivos em `api/` só adaptam o formato do Vercel e injetam o store Redis.

### API local

`vite.config.ts` ganha o plugin `devApi` (`server/devApi.ts`), que monta os mesmos handlers em `/api/*`:
- usa `createMemoryStore()`;
- usa a senha `dashboard` e um segredo fixo de desenvolvimento;
- funciona em `vite dev` e `vite preview`.

Assim `npm run dev` e o E2E funcionam sem Vercel. No build de produção o plugin não entra no bundle.

## 4. Senha do painel

- Rota `/painel` renderiza `TeacherGate`. Sem token válido em `sessionStorage` (`agroblocks:teacher-token`), mostra o dialog **"Senha do professor"**:
  - campo senha;
  - botões **Voltar** (vai para `/`) e **Entrar**;
  - erro "Senha incorreta." quando a resposta for 401;
  - "Painel indisponível: servidor não configurado." quando for 503;
  - "Sem conexão com o servidor." em falha de rede.
- O link "Painel do professor" da Home navega para `/painel`, então o dialog aparece nos dois caminhos.
- Qualquer 401 vindo de `GET`/`DELETE` apaga o token e reabre o dialog.

## 5. Novo painel (`src/features/dashboard/`)

Fonte: `GET /api/teacher/runs`, mais o botão **Atualizar**. O modo demonstração substitui a fonte por `createDemoRuns()` (alunos fictícios de 3 escolas) e mostra o selo "DADOS DE DEMONSTRAÇÃO".

### Cálculos (`dashboardModel.ts`, puro)

- Agrupa jogadas por `studentKey`. O nome exibido é o da jogada mais recente.
- Filtros: escola (lista das escolas presentes), busca por nome (sem acento, sem diferenciar maiúsculas) e período (`updatedAt` entre duas datas).
- Por aluno:
  - jogadas;
  - fases concluídas, pelo máximo entre as jogadas;
  - tentativas, dicas e erros, somados em todas as jogadas;
  - nota pré e nota pós em acertos de 0 a 10, usando a resposta mais recente entre as jogadas e `correctIndex` dos itens;
  - ganho = pós − pré, só quando houver as duas;
  - último acesso.
- Resumo:
  - número de alunos, escolas e jogadas;
  - média de fases concluídas por aluno;
  - total de tentativas e de dicas;
  - média pré, média pós e ganho médio (só alunos com as duas).
- Por fase: alunos que concluíram, tentativas médias, dicas médias e distribuição de estrelas (1, 2, 3).
- Erros mais comuns: soma de `errorCode` das tentativas, com texto em PT-BR.
- Pré × pós por escola: média pré e pós de cada escola.

### Tela

1. Cabeçalho: "Painel do professor", **Atualizar**, **Demonstração**, **Exportar CSV** e **Sair** (apaga o token).
2. Barra de filtros.
3. Cartões de resumo.
4. Gráficos (com o `BarChart` atual, estendido para barras agrupadas):
   - conclusão por fase;
   - tentativas e dicas por fase;
   - erros mais comuns;
   - pré × pós por escola;
   - estrelas por fase.
5. Tabela de alunos, ordenável por qualquer coluna (clique no cabeçalho alterna asc/desc). Colunas: nome, escola, jogadas, fases, tentativas, dicas, erros, pré, pós, ganho, último acesso.
6. Detalhe do aluno: painel lateral ao clicar numa linha, com uma seção por jogada:
   - situação de cada fase (status, tentativas, melhor resultado, estrelas);
   - linha do tempo das tentativas (data, fase, resultado, erro e pseudocódigo recolhível);
   - avaliação pré e pós, questão por questão, com a resposta marcada e ✓/✗;
   - botão **Apagar jogada**, com confirmação.
7. Estados:
   - carregando;
   - erro com "Tentar de novo";
   - vazio: "Nenhum aluno enviou dados ainda.".

CSV: "Exportar CSV" baixa **três arquivos CSV** com o recorte filtrado:
- `alunos`: uma linha por aluno;
- `tentativas`: uma linha por tentativa, com nome, escola e runId;
- `avaliacoes`: uma linha por resposta.

Separador `;` e BOM UTF-8, como o `toCsv` atual.

Remover: `computeDashboard`, `demoData` antigo, `missionsCsv`/`attemptsCsv`/`assessmentCsv` antigos e o texto "registrados neste navegador". Remover o campo de código e o aviso "não digite nome" das Configurações.

## 6. Erros e limites

- O jogo continua 100% jogável sem servidor; o envio só registra pendência.
- O servidor rejeita:
  - snapshot com mais de 2000 tentativas;
  - pseudocódigo com mais de 4000 caracteres por tentativa;
  - nome ou escola fora dos limites.
- `list` com muitas jogadas faz MGET em lotes de 100. Escala esperada: algumas centenas de jogadas.
- Senha errada: 401 com atraso fixo; sem bloqueio por IP nesta versão.

## 7. Testes

Unitários (Vitest):
- `normalizeKey`;
- validação do StudentDialog;
- schema do save com migração do legado;
- `startRun` / `registerStudent`;
- `toSnapshot` (sem `savedProgram`);
- fila de envio: debounce, pendência, retry e um envio por vez, com `fetch` e timers falsos;
- handlers com o store em memória: 204, 400, 413, login certo/errado, token expirado/adulterado, 503 sem configuração, lista e remoção;
- `createRedisStore` com um cliente falso;
- `dashboardModel`: agrupamento, filtros, notas, ganho, erros e por fase;
- `TeacherGate`: senha errada, certa e 401 posterior;
- `DashboardPage`: renderiza demonstração, ordena e abre o detalhe;
- Home: os três fluxos da tabela da seção 1.

E2E (Playwright, contra `vite preview` com o plugin `devApi`):
- cadastro → jogar o treinamento até concluir → `/painel` → senha errada recusada → senha `dashboard` → o aluno aparece na tabela com a escola e 1 fase concluída;
- "Apagar e começar" pede o cadastro de novo e o painel mostra 2 jogadas do mesmo aluno.

## 8. Configuração no Vercel (vai para o README)

1. Projeto → Storage → Create → **Upstash for Redis** (plano Free) → Connect ao projeto.
2. Settings → Environment Variables:
   - `TEACHER_PASSWORD=dashboard`;
   - `TEACHER_TOKEN_SECRET=<texto aleatório longo>`.
3. Fazer um redeploy.

## Fora do escopo

- Contas de professor múltiplas, turmas e convites.
- Edição de dados pelo painel (só leitura e apagar jogada).
- Bloqueio por tentativas de senha e logs de acesso.
- Versão mobile.
