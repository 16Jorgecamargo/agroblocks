# Phase 6 — E2E and docs (Tasks 17–18)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 17: End-to-end flows

**Files:**
- Create: `tests/e2e/dashboard.spec.ts`
- Modify: `tests/e2e/helpers.ts` (`withStudent`, `teacherLogin`), `tests/e2e/agroblocks.spec.ts` (delete the old local-dashboard test `the dashboard shows real recorded data and the empty state before it`)

**Interfaces:**
- Consumes: `registerStudent(page, name?, school?)` (Task 10); dev API in `vite preview` (Task 7); dashboard texts (Tasks 12, 15, 16).
- Produces:
  - `withStudent(save: SaveData, name: string, school: string, runId: string): SaveData`
  - `teacherLogin(page: Page, password?: string): Promise<void>` — fills "Senha" in "Senha do professor" and clicks "Entrar"

The preview server keeps one in-memory store for the whole Playwright run, so every test uses its own student name.

- [ ] **Step 1: Write the tests**

`tests/e2e/helpers.ts` — add:
```ts
export function withStudent(save: SaveData, name: string, school: string, runId: string): SaveData {
  return { ...save, runId, student: { name, school } }
}

export async function teacherLogin(page: Page, password = 'dashboard'): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Senha do professor' })
  await dialog.getByLabel('Senha').fill(password)
  await dialog.getByRole('button', { name: 'Entrar' }).click()
}
```

`tests/e2e/dashboard.spec.ts`:
```ts
import { expect, test } from '@playwright/test'
import { getMission } from '@/data/missions'
import { openMission, registerStudent, saveWithProgram, seedStorage, teacherLogin, withStudent } from './helpers'

const firstHarvest = getMission('m1-first-harvest')
if (!firstHarvest) throw new Error('mission missing')

test('a skipped tutorial reaches the dashboard behind the teacher password', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await registerStudent(page, 'Carlos Pulador', 'Escola Estadual Teste')
  await page.getByRole('button', { name: 'Começar treinamento' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('button', { name: 'Pular tutorial' }).click()
  await page.getByRole('button', { name: 'Sair do treinamento' }).click()
  await expect(page).toHaveURL(/#\/missoes$/)
  await page.waitForTimeout(2600)
  await page.goto('/#/painel')
  await teacherLogin(page, 'senha-errada')
  await expect(page.getByText('Senha incorreta.')).toBeVisible()
  await teacherLogin(page)
  const row = page.getByRole('table', { name: 'Alunos' }).getByRole('row').filter({ hasText: 'Carlos Pulador' })
  await expect(row).toContainText('Escola Estadual Teste')
  await expect(row).toContainText('Pulado na etapa 3 de 15')
})

test('a completed phase and a new farm show up as two runs of the same student', async ({ page }) => {
  const save = withStudent(saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution, ['m0-training']), 'Dora Repetente', 'Escola Municipal Teste', 'e2e-run-dora-1')
  await seedStorage(page, { save })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await page.waitForTimeout(2600)
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await page.getByRole('button', { name: 'Apagar e começar' }).click()
  await registerStudent(page, 'dora  repetente', 'escola municipal teste')
  await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
  await page.waitForTimeout(2600)
  await page.goto('/#/painel')
  await teacherLogin(page)
  const row = page.getByRole('table', { name: 'Alunos' }).getByRole('row').filter({ hasText: /dora/i })
  await expect(row).toHaveCount(1)
  await expect(row.getByRole('cell').nth(1)).toHaveText('2')
  await expect(row.getByRole('cell').nth(3)).toHaveText('1')
  await row.getByRole('button', { name: /Ver detalhes/ }).click()
  await expect(page.getByRole('dialog', { name: /dora/i }).getByRole('heading', { name: /^Jogada de / })).toHaveCount(2)
})
```
Cell indexes: the row header (`th`) is the name, so `getByRole('cell')` starts at Escola: `nth(0)` Escola, `nth(1)` Jogadas, `nth(2)` Tutorial, `nth(3)` Fases.

In `tests/e2e/agroblocks.spec.ts` delete the test `the dashboard shows real recorded data and the empty state before it` (the local panel no longer exists; `dashboard.spec.ts` covers the new one).

- [ ] **Step 2: Run E2E**

Run: `pkill -f chrome-headless-shell; lsof -tiTCP:4173 -sTCP:LISTEN | xargs kill; npx playwright test`
Expected: all tests PASS (23 − 1 + 2 = 24).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): student registration and runs reach the password-protected dashboard"
```

### Task 18: Documentation

**Files:**
- Modify: `README.md`, `docs/decisions/` (create `0011-teacher-dashboard-server.md`), any doc mentioning "código de participante" or "dados ficam somente neste navegador" (`grep -rniE "participante|somente neste navegador|neste navegador" README.md docs --include='*.md' | grep -v docs/superpowers`)

- [ ] **Step 1: Write the docs**

README — add a section "Painel do professor e banco de dados" after the commands table:
```markdown
## Painel do professor e banco de dados

Ao iniciar uma fazenda, o aluno informa nome completo e escola. Cada fazenda vira uma "jogada" enviada ao servidor (Vercel Functions em `api/`) e guardada no Upstash Redis: cadastro, tutorial (concluído, pulado e em qual etapa), fases, tentativas com pseudocódigo e respostas das avaliações. O envio acontece 2 s depois de cada mudança e é refeito sozinho se a internet cair.

O painel (`/#/painel` ou "Painel do professor" na tela inicial) pede a senha, conferida no servidor. Ele mostra todos os alunos com filtros por escola, nome e período, gráficos, tabela ordenável, detalhe de cada jogada, exportação CSV e dados de demonstração.

### Configuração no Vercel (uma vez)

1. Projeto → **Storage** → **Create** → **Upstash for Redis** (plano Free) → **Connect** ao projeto.
2. **Settings → Environment Variables**: `TEACHER_PASSWORD` = `dashboard` e `TEACHER_TOKEN_SECRET` = um texto aleatório longo.
3. Faça um **Redeploy**.

Sem essas variáveis o jogo funciona normalmente, mas o painel mostra "Painel indisponível: servidor não configurado." Em `npm run dev` e `npm run preview` a API roda dentro do Vite com um banco em memória (senha `dashboard`), apagado ao reiniciar.
```
Replace any README text that says data stay only in the browser or mentions the participant code with the new behavior.

`docs/decisions/0011-teacher-dashboard-server.md`:
```markdown
# 0011 — Cadastro do aluno, envio ao servidor e painel do professor

**Contexto:** os dados de cada aluno ficavam só no navegador; o professor não tinha visão da turma.

**Decisão:** nome e escola no início de cada fazenda; cada fazenda é uma jogada com id próprio; o navegador envia a jogada inteira (sem o programa em edição) 2 s depois de cada mudança para Vercel Functions, que validam com zod e gravam no Upstash Redis (`run:<id>` + índice `runs` ordenado por atualização). O painel lê todas as jogadas com um token HMAC de 12 h obtido com a senha guardada em `TEACHER_PASSWORD`. Handlers puros em `server/` servem tanto o Vercel quanto o Vite (dev/preview, banco em memória), o que permite E2E sem nuvem.

**Consequências:** o professor vê tudo em um lugar; nomes de alunos menores passam a sair do navegador — o cadastro mostra um aviso explícito; a senha única não identifica quem acessou; não há bloqueio por tentativas de senha nesta versão.
```

- [ ] **Step 2: Verify everything**

Run:
```bash
npx tsc --noEmit -p . && npx vitest run --maxWorkers=2 && npm run build
grep -rnE "^\s*(//|/\*|\*\s)|\{/\*" src tests scripts server api --include='*.ts' --include='*.tsx' --include='*.mjs'
```
Expected: tsc clean, all unit tests PASS, build OK, grep prints nothing.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/decisions
git commit -m "docs: teacher dashboard, server sync and Vercel setup"
```
