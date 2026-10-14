# AgroBlocks — Fase 10: Avaliação pré/pós, painel educativo e exportação CSV

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrumentos diagnósticos dentro do app (forma A no pré-teste, forma B equivalente no pós-teste), correção automática por conceito, painel do professor com dados reais (ou demonstração claramente rotulada) e exportação CSV anônima.

**Architecture:** Itens de avaliação são dados (`src/data/assessment/`). Pontuação, estatísticas do painel, dados de demonstração e geração de CSV são funções puras. Telas apenas exibem. Nenhum dado sai do navegador; exportar = baixar arquivo local.

**Tech Stack:** React, TypeScript, SVG próprio (sem biblioteca de gráficos), Blob API.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 8)

Leia `plan_index.md` antes de começar.

---

### Task 10.1: Banco de itens e pontuação por conceito

**Files:**
- Create: `src/game/assessment/types.ts`
- Create: `src/game/assessment/scoring.ts`
- Create: `src/data/assessment/items.ts`
- Test: `src/data/assessment/items.test.ts`, `src/game/assessment/scoring.test.ts`

**Interfaces:**
- Consumes: `AssessmentForm`, `AssessmentResponse` (Fase 6), `Facing`.
- Produces:
  - `type AssessmentConcept = 'sequencing' | 'repetition' | 'conditionals' | 'debugging' | 'interpretation'`
  - `ASSESSMENT_CONCEPTS: AssessmentConcept[]`, `ASSESSMENT_CONCEPT_LABELS: Record<AssessmentConcept, string>`
  - `type ItemKind = 'choice' | 'ordering' | 'findError' | 'predictPosition'`
  - `interface AssessmentItem { id: string; pairId: string; variant: 'A' | 'B'; concept: AssessmentConcept; kind: ItemKind; prompt: string; code?: string; grid?: { width: number; height: number; robot: { x: number; y: number; facing: Facing } }; options: string[]; correctIndex: number }`
  - `ASSESSMENT_ITEMS: AssessmentItem[]`
  - `itemsForForm(form: AssessmentForm): AssessmentItem[]` (`pre` → variante A, `post` → variante B)
  - `type ConceptScore = { correct: number; total: number }`
  - `scoreResponse(response: AssessmentResponse): Record<AssessmentConcept, ConceptScore> | null` (`null` se `skipped`)
  - `percent(score: ConceptScore): number` (0–100, arredondado)

- [ ] **Step 1: Criar `src/game/assessment/types.ts`**

```ts
import type { Facing } from '@/game/world/types'

export type AssessmentConcept = 'sequencing' | 'repetition' | 'conditionals' | 'debugging' | 'interpretation'

export const ASSESSMENT_CONCEPTS: AssessmentConcept[] = ['sequencing', 'repetition', 'conditionals', 'debugging', 'interpretation']

export const ASSESSMENT_CONCEPT_LABELS: Record<AssessmentConcept, string> = {
  sequencing: 'Sequenciamento',
  repetition: 'Repetição',
  conditionals: 'Condicionais',
  debugging: 'Identificação de erros',
  interpretation: 'Interpretação de algoritmos',
}

export type ItemKind = 'choice' | 'ordering' | 'findError' | 'predictPosition'

export interface AssessmentItem {
  id: string
  pairId: string
  variant: 'A' | 'B'
  concept: AssessmentConcept
  kind: ItemKind
  prompt: string
  code?: string
  grid?: { width: number; height: number; robot: { x: number; y: number; facing: Facing } }
  options: string[]
  correctIndex: number
}
```

- [ ] **Step 2: Escrever testes que falham**

`src/data/assessment/items.test.ts`:
```ts
import { ASSESSMENT_ITEMS, itemsForForm } from '@/data/assessment/items'
import { ASSESSMENT_CONCEPTS } from '@/game/assessment/types'
import { runProgram } from '@/blocks/interpreter/runProgram'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

describe('assessment items', () => {
  it('has ten items per form, two per concept', () => {
    for (const form of ['pre', 'post'] as const) {
      const items = itemsForForm(form)
      expect(items).toHaveLength(10)
      for (const concept of ASSESSMENT_CONCEPTS) expect(items.filter((item) => item.concept === concept)).toHaveLength(2)
    }
  })

  it('pairs every A item with a B item of the same concept and kind', () => {
    const byPair = new Map<string, typeof ASSESSMENT_ITEMS>()
    for (const item of ASSESSMENT_ITEMS) byPair.set(item.pairId, [...(byPair.get(item.pairId) ?? []), item])
    expect(byPair.size).toBe(10)
    for (const pair of byPair.values()) {
      expect(pair.map((item) => item.variant).sort()).toEqual(['A', 'B'])
      expect(pair[0].concept).toBe(pair[1].concept)
      expect(pair[0].kind).toBe(pair[1].kind)
      expect(pair[0].prompt).not.toBe(pair[1].prompt)
    }
  })

  it('has unique ids and valid answers', () => {
    expect(new Set(ASSESSMENT_ITEMS.map((item) => item.id)).size).toBe(ASSESSMENT_ITEMS.length)
    for (const item of ASSESSMENT_ITEMS) {
      expect(item.options.length).toBeGreaterThanOrEqual(3)
      expect(item.correctIndex).toBeGreaterThanOrEqual(0)
      expect(item.correctIndex).toBeLessThan(item.options.length)
      expect(new Set(item.options).size).toBe(item.options.length)
    }
  })

  it('has correct answers for the position prediction items, checked with the real engine', () => {
    const a = runProgram(
      program([act('moveForward'), act('moveForward'), act('turnRight'), act('moveForward')]),
      makeState(['. . . .', '. . . .', '. . . .', '. . . .'], { x: 0, y: 3, facing: 'N' }),
      { growTicks: 1, forbidWaterWet: false },
    )
    expect(a.state.robot).toMatchObject({ x: 1, y: 1 })
    const b = runProgram(
      program([act('turnLeft'), act('moveForward'), act('moveForward'), act('turnLeft'), act('moveForward')]),
      makeState(['. . . .', '. . . .', '. . . .', '. . . .'], { x: 0, y: 2, facing: 'S' }),
      { growTicks: 1, forbidWaterWet: false },
    )
    expect(b.state.robot).toMatchObject({ x: 2, y: 1 })
    const itemA = ASSESSMENT_ITEMS.find((item) => item.id === 'int-1-A')
    const itemB = ASSESSMENT_ITEMS.find((item) => item.id === 'int-1-B')
    expect(itemA?.options[itemA.correctIndex]).toBe('Coluna 2, linha 2')
    expect(itemB?.options[itemB.correctIndex]).toBe('Coluna 3, linha 2')
  })
})
```

`src/game/assessment/scoring.test.ts`:
```ts
import { percent, scoreResponse } from '@/game/assessment/scoring'
import { itemsForForm } from '@/data/assessment/items'

describe('scoring', () => {
  it('scores answers per concept', () => {
    const items = itemsForForm('pre')
    const answers = Object.fromEntries(items.map((item, index) => [item.id, index < 4 ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
    const score = scoreResponse({ form: 'pre', startedAt: '', completedAt: '', skipped: false, answers })
    expect(score?.sequencing).toEqual({ correct: 2, total: 2 })
    expect(score?.repetition).toEqual({ correct: 2, total: 2 })
    expect(score?.conditionals).toEqual({ correct: 0, total: 2 })
  })

  it('counts unanswered items as wrong and returns null when skipped', () => {
    expect(scoreResponse({ form: 'post', startedAt: '', completedAt: '', skipped: false, answers: {} })?.debugging).toEqual({ correct: 0, total: 2 })
    expect(scoreResponse({ form: 'pre', startedAt: '', completedAt: '', skipped: true, answers: {} })).toBeNull()
  })

  it('converts to rounded percentages', () => {
    expect(percent({ correct: 1, total: 3 })).toBe(33)
    expect(percent({ correct: 0, total: 0 })).toBe(0)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/data/assessment src/game/assessment`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 4: Criar `src/data/assessment/items.ts`**

Itens já ordenados por conceito (sequenciamento, repetição, condicionais, identificação de erros, interpretação).

```ts
import type { AssessmentItem } from '@/game/assessment/types'
import type { AssessmentForm } from '@/game/progress/types'

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  {
    id: 'seq-1-A',
    pairId: 'seq-1',
    variant: 'A',
    concept: 'sequencing',
    kind: 'choice',
    prompt: 'O robô está virado para a direita e a planta madura está duas casas à frente dele. Qual sequência colhe a planta?',
    options: [
      'colher planta, mover para frente, mover para frente',
      'mover para frente, mover para frente, colher planta',
      'mover para frente, colher planta, mover para frente',
      'virar à direita, mover para frente, colher planta',
    ],
    correctIndex: 1,
  },
  {
    id: 'seq-1-B',
    pairId: 'seq-1',
    variant: 'B',
    concept: 'sequencing',
    kind: 'choice',
    prompt: 'O robô está virado para cima e a planta madura está três casas acima dele. Qual sequência colhe a planta?',
    options: [
      'mover para frente, mover para frente, mover para frente, colher planta',
      'mover para frente, mover para frente, colher planta',
      'colher planta, mover para frente, mover para frente, mover para frente',
      'virar à esquerda, mover para frente, mover para frente, colher planta',
    ],
    correctIndex: 0,
  },
  {
    id: 'seq-2-A',
    pairId: 'seq-2',
    variant: 'A',
    concept: 'sequencing',
    kind: 'ordering',
    prompt: 'Qual é a ordem correta para cultivar um canteiro vazio?',
    options: [
      'plantar semente → preparar solo → regar canteiro',
      'regar canteiro → plantar semente → preparar solo',
      'preparar solo → plantar semente → regar canteiro',
      'preparar solo → regar canteiro → colher planta',
    ],
    correctIndex: 2,
  },
  {
    id: 'seq-2-B',
    pairId: 'seq-2',
    variant: 'B',
    concept: 'sequencing',
    kind: 'ordering',
    prompt: 'O robô está longe do reservatório e com o tanque vazio. Qual é a ordem correta para regar um canteiro?',
    options: [
      'regar canteiro → ir ao reservatório → coletar recursos',
      'ir ao reservatório → coletar recursos → ir ao canteiro → regar canteiro',
      'coletar recursos → regar canteiro → ir ao reservatório',
      'ir ao canteiro → coletar recursos → regar canteiro',
    ],
    correctIndex: 1,
  },
  {
    id: 'rep-1-A',
    pairId: 'rep-1',
    variant: 'A',
    concept: 'repetition',
    kind: 'choice',
    prompt: 'Quantas sementes este programa tenta plantar?',
    code: 'repita 4 vezes:\n    mover para frente\n    plantar semente',
    options: ['1', '4', '5', '8'],
    correctIndex: 1,
  },
  {
    id: 'rep-1-B',
    pairId: 'rep-1',
    variant: 'B',
    concept: 'repetition',
    kind: 'choice',
    prompt: 'Quantas unidades de água este programa gasta?',
    code: 'repita 3 vezes:\n    mover para frente\n    regar canteiro\n    regar canteiro',
    options: ['2', '3', '6', '9'],
    correctIndex: 2,
  },
  {
    id: 'rep-2-A',
    pairId: 'rep-2',
    variant: 'A',
    concept: 'repetition',
    kind: 'choice',
    prompt: 'Qual programa faz o mesmo que: mover, regar, mover, regar, mover, regar?',
    options: [
      'repita 3 vezes: mover para frente, regar canteiro',
      'repita 6 vezes: mover para frente, regar canteiro',
      'repita 3 vezes: mover para frente; depois, fora do laço, regar canteiro',
      'repita 2 vezes: mover para frente, regar canteiro, mover para frente',
    ],
    correctIndex: 0,
  },
  {
    id: 'rep-2-B',
    pairId: 'rep-2',
    variant: 'B',
    concept: 'repetition',
    kind: 'choice',
    prompt: 'Qual programa faz o mesmo que: preparar, plantar, mover, preparar, plantar, mover?',
    options: [
      'repita 2 vezes: preparar solo, plantar semente, mover para frente',
      'repita 6 vezes: preparar solo, plantar semente, mover para frente',
      'repita 2 vezes: preparar solo; depois, fora do laço, plantar semente e mover para frente',
      'repita 3 vezes: preparar solo, plantar semente',
    ],
    correctIndex: 0,
  },
  {
    id: 'cond-1-A',
    pairId: 'cond-1',
    variant: 'A',
    concept: 'conditionals',
    kind: 'choice',
    prompt: 'O solo do canteiro atual está molhado. O que o robô faz?',
    code: 'se o solo está seco?:\n    regar canteiro\nsenão:\n    mover para frente',
    options: ['Rega o canteiro', 'Move para frente', 'Rega e depois move', 'Não faz nada'],
    correctIndex: 1,
  },
  {
    id: 'cond-1-B',
    pairId: 'cond-1',
    variant: 'B',
    concept: 'conditionals',
    kind: 'choice',
    prompt: 'A planta do canteiro atual ainda está crescendo. O que o robô faz?',
    code: 'se a planta está madura?:\n    colher planta\nsenão:\n    regar canteiro',
    options: ['Colhe a planta', 'Rega o canteiro', 'Colhe e depois rega', 'Não faz nada'],
    correctIndex: 1,
  },
  {
    id: 'cond-2-A',
    pairId: 'cond-2',
    variant: 'A',
    concept: 'conditionals',
    kind: 'choice',
    prompt: 'O robô deve colher apenas plantas maduras. Qual bloco deve envolver "colher planta"?',
    options: ['repita 2 vezes', 'se a planta está madura?', 'enquanto existe obstáculo à frente?', 'virar à direita'],
    correctIndex: 1,
  },
  {
    id: 'cond-2-B',
    pairId: 'cond-2',
    variant: 'B',
    concept: 'conditionals',
    kind: 'choice',
    prompt: 'O robô deve regar apenas canteiros secos. Qual bloco deve envolver "regar canteiro"?',
    options: ['se o solo está seco?', 'repita 3 vezes', 'virar à esquerda', 'enquanto há sementes disponíveis?'],
    correctIndex: 0,
  },
  {
    id: 'dbg-1-A',
    pairId: 'dbg-1',
    variant: 'A',
    concept: 'debugging',
    kind: 'findError',
    prompt: 'O robô deveria preparar o solo e depois plantar em 3 canteiros, mas aparece o erro "O solo ainda não foi preparado". Qual linha precisa ser movida para antes de "plantar semente"?',
    code: '1  repita 3 vezes:\n2      mover para frente\n3      plantar semente\n4      preparar solo',
    options: ['Linha 1', 'Linha 2', 'Linha 3', 'Linha 4'],
    correctIndex: 3,
  },
  {
    id: 'dbg-1-B',
    pairId: 'dbg-1',
    variant: 'B',
    concept: 'debugging',
    kind: 'findError',
    prompt: 'O robô começa fora da fileira e deveria entrar em cada canteiro e colher, mas o primeiro "colher" falha porque ainda não há planta. Qual linha deveria vir primeiro dentro do laço?',
    code: '1  repita 4 vezes:\n2      colher planta\n3      mover para frente',
    options: ['Linha 1', 'Linha 2', 'Linha 3', 'Nenhuma'],
    correctIndex: 2,
  },
  {
    id: 'dbg-2-A',
    pairId: 'dbg-2',
    variant: 'A',
    concept: 'debugging',
    kind: 'findError',
    prompt: 'Na fileira há plantas maduras e plantas ainda crescendo. O programa para com o erro "A planta ainda não está madura". Qual linha precisa ficar dentro de uma condição?',
    code: '1  enquanto não (existe obstáculo à frente?):\n2      colher planta\n3      mover para frente',
    options: ['Linha 1', 'Linha 2', 'Linha 3', 'Nenhuma'],
    correctIndex: 1,
  },
  {
    id: 'dbg-2-B',
    pairId: 'dbg-2',
    variant: 'B',
    concept: 'debugging',
    kind: 'findError',
    prompt: 'Alguns canteiros já estão molhados e a missão proíbe desperdiçar água. O programa para com o erro "O robô regou um solo que já estava molhado". Qual linha precisa ficar dentro de uma condição?',
    code: '1  repita 6 vezes:\n2      mover para frente\n3      regar canteiro',
    options: ['Linha 1', 'Linha 2', 'Linha 3', 'Nenhuma'],
    correctIndex: 2,
  },
  {
    id: 'int-1-A',
    pairId: 'int-1',
    variant: 'A',
    concept: 'interpretation',
    kind: 'predictPosition',
    prompt: 'O robô começa na coluna 1, linha 4, virado para cima. Onde ele termina?',
    code: 'mover para frente\nmover para frente\nvirar à direita\nmover para frente',
    grid: { width: 4, height: 4, robot: { x: 0, y: 3, facing: 'N' } },
    options: ['Coluna 2, linha 2', 'Coluna 1, linha 2', 'Coluna 2, linha 4', 'Coluna 3, linha 2'],
    correctIndex: 0,
  },
  {
    id: 'int-1-B',
    pairId: 'int-1',
    variant: 'B',
    concept: 'interpretation',
    kind: 'predictPosition',
    prompt: 'O robô começa na coluna 1, linha 3, virado para baixo. Onde ele termina?',
    code: 'virar à esquerda\nmover para frente\nmover para frente\nvirar à esquerda\nmover para frente',
    grid: { width: 4, height: 4, robot: { x: 0, y: 2, facing: 'S' } },
    options: ['Coluna 3, linha 2', 'Coluna 3, linha 4', 'Coluna 1, linha 2', 'Coluna 2, linha 3'],
    correctIndex: 0,
  },
  {
    id: 'int-2-A',
    pairId: 'int-2',
    variant: 'A',
    concept: 'interpretation',
    kind: 'choice',
    prompt: 'Qual é o valor de contador no final?',
    code: 'contador ← 0\nrepita 5 vezes:\n    contador ← contador + 2',
    options: ['2', '5', '7', '10'],
    correctIndex: 3,
  },
  {
    id: 'int-2-B',
    pairId: 'int-2',
    variant: 'B',
    concept: 'interpretation',
    kind: 'choice',
    prompt: 'Qual é o valor de total no final?',
    code: 'total ← 10\nrepita 3 vezes:\n    total ← total - 2',
    options: ['4', '6', '7', '8'],
    correctIndex: 0,
  },
]

export function itemsForForm(form: AssessmentForm): AssessmentItem[] {
  const variant = form === 'pre' ? 'A' : 'B'
  return ASSESSMENT_ITEMS.filter((item) => item.variant === variant)
}
```

- [ ] **Step 5: Implementar `src/game/assessment/scoring.ts`**

```ts
import { itemsForForm } from '@/data/assessment/items'
import { ASSESSMENT_CONCEPTS, type AssessmentConcept } from '@/game/assessment/types'
import type { AssessmentResponse } from '@/game/progress/types'

export type ConceptScore = { correct: number; total: number }

export function scoreResponse(response: AssessmentResponse): Record<AssessmentConcept, ConceptScore> | null {
  if (response.skipped) return null
  const scores = Object.fromEntries(ASSESSMENT_CONCEPTS.map((concept) => [concept, { correct: 0, total: 0 }])) as Record<
    AssessmentConcept,
    ConceptScore
  >
  for (const item of itemsForForm(response.form)) {
    const score = scores[item.concept]
    score.total += 1
    if (response.answers[item.id] === item.correctIndex) score.correct += 1
  }
  return scores
}

export function percent(score: ConceptScore): number {
  return score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100)
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/data/assessment src/game/assessment && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/assessment src/data/assessment
git commit -m "feat(assessment): add paired pre/post diagnostic items and concept scoring"
```

---

### Task 10.2: Tela de avaliação

**Files:**
- Create: `src/features/assessment/AssessmentPage.tsx`
- Create: `src/features/assessment/MiniGrid.tsx`
- Create: `src/features/assessment/AssessmentPage.css`
- Modify: `src/app/routes.tsx` (rota `/avaliacao/:form`)
- Test: `src/features/assessment/AssessmentPage.test.tsx`

**Interfaces:**
- Consumes: `itemsForForm`, `scoreResponse`, `percent`, `ASSESSMENT_CONCEPTS`, `ASSESSMENT_CONCEPT_LABELS`, `useProgressStore`, `PageHeader`, `FACING_LABELS`.
- Produces: `AssessmentPage` em `/avaliacao/pre` e `/avaliacao/pos`.
  - Introdução: propósito, anonimato, "não vale nota"; Começar; no pré-teste também "Pular por enquanto" (salva `skipped: true`).
  - Pós-teste bloqueado até concluir a Fase 6 (`m6-efficient-farm`).
  - Uma questão por vez, rádios com rótulos, "Questão N de 10", sem feedback de acerto.
  - Fim do pré: agradecimento + link para missões. Fim do pós: tabela por conceito pré × pós (pré mostra "—" se pulado/inexistente).
  - Já respondido: mostra o resumo em vez de refazer.

- [ ] **Step 1: Escrever teste que falha**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AssessmentPage } from '@/features/assessment/AssessmentPage'
import { itemsForForm } from '@/data/assessment/items'
import { useProgressStore } from '@/stores/progressStore'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/avaliacao/:form" element={<AssessmentPage />} />
        <Route path="/" element={<p>início</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function answerAll(form: 'pre' | 'post', correct: boolean) {
  for (const item of itemsForForm(form)) {
    const index = correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length
    fireEvent.click(screen.getByRole('radio', { name: item.options[index] }))
    fireEvent.click(screen.getByRole('button', { name: /Próxima|Concluir/ }))
  }
}

describe('AssessmentPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('runs the pre-test one question at a time without feedback and stores answers', () => {
    renderAt('/avaliacao/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByText('Questão 1 de 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    answerAll('pre', true)
    expect(screen.queryByText(/correta|errada/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument()
    const stored = useProgressStore.getState().save.assessments.pre
    expect(stored?.skipped).toBe(false)
    expect(Object.keys(stored?.answers ?? {})).toHaveLength(10)
  })

  it('allows skipping the pre-test and records it', () => {
    renderAt('/avaliacao/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Pular por enquanto' }))
    expect(useProgressStore.getState().save.assessments.pre?.skipped).toBe(true)
  })

  it('locks the post-test until phase 6 is completed', () => {
    renderAt('/avaliacao/pos')
    expect(screen.getByText(/Conclua a Fase 6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
  })

  it('compares pre and post by concept after the post-test', () => {
    useProgressStore.getState().storeAssessment({ form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt({
      missionId: 'm6-efficient-farm',
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 72,
      blocks: 19,
      usage: { seeds: 16, water: 16, energy: 64 },
      efficiencyStars: 3,
      pseudocode: '',
    })
    renderAt('/avaliacao/pos')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    answerAll('post', true)
    const row = screen.getByRole('row', { name: /Sequenciamento/ })
    expect(row).toHaveTextContent('0%')
    expect(row).toHaveTextContent('100%')
  })

  it('redirects unknown forms home', () => {
    renderAt('/avaliacao/xyz')
    expect(screen.getByText('início')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/assessment`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/features/assessment/MiniGrid.tsx`**

```tsx
import type { AssessmentItem } from '@/game/assessment/types'
import { FACING_LABELS } from '@/render/cellDescription'

const ROTATION = { N: 0, E: 90, S: 180, W: 270 }

export function MiniGrid({ grid }: { grid: NonNullable<AssessmentItem['grid']> }) {
  const { robot } = grid
  return (
    <figure className="mini-grid-figure">
      <div className="mini-grid" style={{ gridTemplateColumns: `repeat(${grid.width}, 36px)` }} aria-hidden="true">
        {Array.from({ length: grid.width * grid.height }, (_, index) => {
          const x = index % grid.width
          const y = Math.floor(index / grid.width)
          const here = robot.x === x && robot.y === y
          return (
            <span key={index} className="mini-grid__cell">
              {here && (
                <span className="mini-grid__robot" style={{ transform: `rotate(${ROTATION[robot.facing]}deg)` }}>
                  ▲
                </span>
              )}
            </span>
          )
        })}
      </div>
      <figcaption>
        Grade {grid.width}×{grid.height}. Robô na coluna {robot.x + 1}, linha {robot.y + 1}, virado para {FACING_LABELS[robot.facing]}.
      </figcaption>
    </figure>
  )
}
```

- [ ] **Step 4: Implementar `src/features/assessment/AssessmentPage.tsx`**

```tsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { itemsForForm } from '@/data/assessment/items'
import { MiniGrid } from '@/features/assessment/MiniGrid'
import { percent, scoreResponse } from '@/game/assessment/scoring'
import { ASSESSMENT_CONCEPT_LABELS, ASSESSMENT_CONCEPTS } from '@/game/assessment/types'
import type { AssessmentForm, AssessmentResponse } from '@/game/progress/types'
import { useProgressStore } from '@/stores/progressStore'
import './AssessmentPage.css'

const FORM_BY_SLUG: Record<string, AssessmentForm> = { pre: 'pre', pos: 'post' }
const FINAL_MISSION = 'm6-efficient-farm'

function Comparison({ pre, post }: { pre: AssessmentResponse | null; post: AssessmentResponse }) {
  const preScores = pre ? scoreResponse(pre) : null
  const postScores = scoreResponse(post)
  return (
    <table className="assessment__table">
      <caption>Acertos por conceito (dados deste navegador)</caption>
      <thead>
        <tr>
          <th scope="col">Conceito</th>
          <th scope="col">Pré-teste</th>
          <th scope="col">Pós-teste</th>
        </tr>
      </thead>
      <tbody>
        {ASSESSMENT_CONCEPTS.map((concept) => (
          <tr key={concept}>
            <th scope="row">{ASSESSMENT_CONCEPT_LABELS[concept]}</th>
            <td>{preScores ? `${percent(preScores[concept])}%` : '—'}</td>
            <td>{postScores ? `${percent(postScores[concept])}%` : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function AssessmentPage() {
  const { form: slug = '' } = useParams()
  const form = FORM_BY_SLUG[slug]
  const save = useProgressStore((store) => store.save)
  const storeAssessment = useProgressStore((store) => store.storeAssessment)
  const [stage, setStage] = useState<'intro' | 'questions' | 'done'>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [startedAt, setStartedAt] = useState('')

  if (!form) return <Navigate to="/" replace />

  const items = itemsForForm(form)
  const title = form === 'pre' ? 'Avaliação inicial' : 'Avaliação final'
  const existing = save.assessments[form]
  const postLocked = form === 'post' && save.missions[FINAL_MISSION]?.status !== 'completed'

  const finish = (skipped: boolean) => {
    const now = new Date().toISOString()
    storeAssessment({ form, startedAt: startedAt || now, completedAt: now, skipped, answers: skipped ? {} : answers })
    setStage('done')
  }

  const body = () => {
    if (stage === 'done' || (existing && stage === 'intro')) {
      const response = save.assessments[form]
      return (
        <section className="card assessment__card">
          <h2>Obrigado!</h2>
          {response?.skipped ? (
            <p>A avaliação inicial foi pulada. Você pode jogar normalmente.</p>
          ) : (
            <p>Suas respostas foram salvas neste navegador, sem nome nem dados pessoais.</p>
          )}
          {form === 'post' && response && <Comparison pre={save.assessments.pre} post={response} />}
          <Link to="/missoes" className="button button--primary">
            Ir para as missões
          </Link>
        </section>
      )
    }
    if (postLocked) {
      return (
        <section className="card assessment__card">
          <h2>Ainda não disponível</h2>
          <p>Conclua a Fase 6 (Fazenda eficiente) para liberar a avaliação final.</p>
          <Link to="/missoes" className="button">
            Ver missões
          </Link>
        </section>
      )
    }
    if (stage === 'intro') {
      return (
        <section className="card assessment__card">
          <h2>{title}</h2>
          <p>São 10 questões curtas sobre sequência, repetição, condições, erros e leitura de algoritmos.</p>
          <ul>
            <li>Não vale nota e não há tempo limite.</li>
            <li>Você não verá se acertou durante a avaliação.</li>
            <li>As respostas ficam salvas só neste navegador, sem dados pessoais.</li>
          </ul>
          <div className="assessment__actions">
            {form === 'pre' && (
              <button type="button" className="button" onClick={() => finish(true)}>
                Pular por enquanto
              </button>
            )}
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setStartedAt(new Date().toISOString())
                setStage('questions')
              }}
            >
              Começar
            </button>
          </div>
        </section>
      )
    }
    const item = items[index]
    const selected = answers[item.id]
    const last = index === items.length - 1
    return (
      <section className="card assessment__card" aria-labelledby="question-prompt">
        <p className="assessment__counter">
          Questão {index + 1} de {items.length}
        </p>
        <progress max={items.length} value={index} aria-hidden="true" />
        <h2 id="question-prompt" className="assessment__prompt">
          {item.prompt}
        </h2>
        {item.grid && <MiniGrid grid={item.grid} />}
        {item.code && <pre className="assessment__code">{item.code}</pre>}
        <fieldset className="assessment__options">
          <legend className="visually-hidden">Alternativas</legend>
          {item.options.map((option, optionIndex) => (
            <label key={option} className={`assessment__option${selected === optionIndex ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name={item.id}
                checked={selected === optionIndex}
                onChange={() => setAnswers((current) => ({ ...current, [item.id]: optionIndex }))}
              />
              {option}
            </label>
          ))}
        </fieldset>
        <div className="assessment__actions">
          <button type="button" className="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Anterior
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={selected === undefined}
            onClick={() => (last ? finish(false) : setIndex(index + 1))}
          >
            {last ? 'Concluir' : 'Próxima'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="chrome-page">
      <PageHeader title={title} subtitle="Instrumento diagnóstico do projeto AgroBlocks." backTo="/" />
      <main className="assessment">{body()}</main>
    </div>
  )
}
```

- [ ] **Step 5: Criar `src/features/assessment/AssessmentPage.css`**

```css
.assessment {
  display: grid;
  justify-items: center;
  padding: 0 var(--space-4) var(--space-6);
}

.assessment__card {
  width: min(720px, 100%);
  display: grid;
  gap: var(--space-3);
}

.assessment__counter {
  margin: 0;
  font-weight: 700;
  color: var(--color-text-muted);
}

.assessment__card progress {
  width: 100%;
  accent-color: var(--color-primary);
}

.assessment__prompt {
  font-size: var(--text-lg);
}

.assessment__code {
  margin: 0;
  padding: var(--space-3);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  white-space: pre;
  overflow: auto;
}

.assessment__options {
  display: grid;
  gap: var(--space-2);
  border: none;
  padding: 0;
  margin: 0;
}

.assessment__option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--tap-size);
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.assessment__option.is-selected {
  border-color: var(--color-water);
  background: rgb(65 133 214 / 0.08);
}

.assessment__option input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-water);
}

.assessment__actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.assessment__table {
  width: 100%;
  border-collapse: collapse;
}

.assessment__table caption {
  text-align: left;
  font-weight: 700;
  padding-bottom: var(--space-2);
}

.assessment__table th,
.assessment__table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.mini-grid-figure {
  margin: 0;
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}

.mini-grid-figure figcaption {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.mini-grid {
  display: grid;
  gap: 3px;
  padding: 6px;
  background: #72b04a;
  border-radius: var(--radius-sm);
}

.mini-grid__cell {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: #b98a5e;
  border-radius: 4px;
}

.mini-grid__robot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #f4f6f5;
  border: 2px solid #46e3ff;
  font-size: 12px;
}
```

- [ ] **Step 6: Registrar rota**

Em `src/app/routes.tsx`: `import { AssessmentPage } from '@/features/assessment/AssessmentPage'` e `{ path: '/avaliacao/:form', element: <AssessmentPage /> },`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/features/assessment && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/assessment src/app/routes.tsx
git commit -m "feat(assessment): add in-app pre and post tests with per-concept comparison"
```

---

### Task 10.3: Estatísticas do painel, dados de demonstração e CSV

**Files:**
- Create: `src/features/dashboard/dashboardStats.ts`
- Create: `src/features/dashboard/demoData.ts`
- Create: `src/services/export/csv.ts`
- Test: `src/features/dashboard/dashboardStats.test.ts`, `src/services/export/csv.test.ts`

**Interfaces:**
- Consumes: `SaveData`, `MissionDefinition`, `CONCEPT_LABELS`, `MissionConcept`, `ERROR_TEXT`, `ErrorCode`, `scoreResponse`, `percent`, `ASSESSMENT_CONCEPTS`, `ASSESSMENT_CONCEPT_LABELS`, `itemsForForm`, `createInitialSave`, `recordAttempt`.
- Produces:
  - `interface MissionRow { missionId; title; concept; conceptLabel; status; attempts; successes; errors; hintsUsed; bestActions: number | null; bestStars: number | null }`
  - `interface DashboardStats { hasData: boolean; completedPhases: number; totalPhases: number; completionRate: number; totalAttempts: number; totalHints: number; missions: MissionRow[]; topErrors: { code: ErrorCode; label: string; count: number }[]; concepts: { concept: MissionConcept; label: string; attempts: number; successRate: number }[]; assessment: { concept: AssessmentConcept; label: string; pre: number | null; post: number | null }[] }`
  - `computeDashboard(save: SaveData, missions: MissionDefinition[]): DashboardStats`
  - `createDemoSave(missions: MissionDefinition[]): SaveData` (determinístico, nunca persistido)
  - `toCsv(headers: string[], rows: (string | number | null)[][]): string` — BOM, `;`, CRLF, aspas, proteção contra fórmulas (`=`, `+`, `-`, `@` em texto)
  - `attemptsCsv(save: SaveData, missions: MissionDefinition[]): string`
  - `missionsCsv(stats: DashboardStats, participantCode: string | null): string`
  - `assessmentCsv(save: SaveData): string`
  - `downloadText(filename: string, content: string): void`

- [ ] **Step 1: Escrever testes que falham**

`src/features/dashboard/dashboardStats.test.ts`:
```ts
import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { createDemoSave } from '@/features/dashboard/demoData'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt, registerHint, storeAssessment } from '@/game/progress/progression'
import type { AttemptInput } from '@/game/progress/types'
import { itemsForForm } from '@/data/assessment/items'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const attempt = (missionId: string, outcome: AttemptInput['outcome'], errorCode: AttemptInput['errorCode'] = null): AttemptInput => ({
  missionId,
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome,
  errorCode,
  actions: 10,
  blocks: 5,
  usage: { seeds: 1, water: 1, energy: 9 },
  efficiencyStars: outcome === 'success' ? 2 : null,
  pseudocode: '',
})

describe('computeDashboard', () => {
  it('reports no data for a fresh save', () => {
    const stats = computeDashboard(createInitialSave(refs, 'now'), MISSIONS)
    expect(stats.hasData).toBe(false)
    expect(stats.totalPhases).toBe(6)
    expect(stats.completionRate).toBe(0)
  })

  it('aggregates attempts, errors, hints and concepts from real records', () => {
    let save = createInitialSave(refs, 'now')
    save = recordAttempt(save, attempt('m1-first-harvest', 'error', 'HIT_OBSTACLE'), refs)
    save = recordAttempt(save, attempt('m1-first-harvest', 'error', 'HIT_OBSTACLE'), refs)
    save = registerHint(save, 'm1-first-harvest')
    save = recordAttempt(save, attempt('m1-first-harvest', 'success'), refs)
    save = recordAttempt(save, attempt('m2-row-planting', 'error', 'NO_SEEDS'), refs)
    const stats = computeDashboard(save, MISSIONS)
    expect(stats.hasData).toBe(true)
    expect(stats.completedPhases).toBe(1)
    expect(stats.completionRate).toBeCloseTo(1 / 6)
    expect(stats.totalAttempts).toBe(4)
    expect(stats.totalHints).toBe(1)
    expect(stats.topErrors[0]).toMatchObject({ code: 'HIT_OBSTACLE', count: 2 })
    const row = stats.missions.find((mission) => mission.missionId === 'm1-first-harvest')
    expect(row).toMatchObject({ attempts: 3, successes: 1, errors: 2, hintsUsed: 1, bestActions: 10, bestStars: 2 })
    const sequencing = stats.concepts.find((concept) => concept.concept === 'sequencing')
    expect(sequencing).toMatchObject({ attempts: 3 })
    expect(sequencing?.successRate).toBeCloseTo(1 / 3)
  })

  it('reports assessment percentages per concept', () => {
    let save = createInitialSave(refs, 'now')
    const answers = Object.fromEntries(itemsForForm('pre').map((item) => [item.id, item.correctIndex]))
    save = storeAssessment(save, { form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers })
    const stats = computeDashboard(save, MISSIONS)
    expect(stats.assessment.find((row) => row.concept === 'repetition')).toMatchObject({ pre: 100, post: null })
    expect(stats.hasData).toBe(true)
  })

  it('creates deterministic demo data', () => {
    expect(createDemoSave(MISSIONS)).toEqual(createDemoSave(MISSIONS))
    expect(computeDashboard(createDemoSave(MISSIONS), MISSIONS).hasData).toBe(true)
  })
})
```

`src/services/export/csv.test.ts`:
```ts
import { assessmentCsv, attemptsCsv, missionsCsv, toCsv } from '@/services/export/csv'
import { MISSIONS } from '@/data/missions'
import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { createInitialSave, recordAttempt, setParticipantCode, storeAssessment } from '@/game/progress/progression'
import { itemsForForm } from '@/data/assessment/items'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))

describe('csv', () => {
  it('adds BOM, uses semicolons and CRLF, quotes and guards formulas', () => {
    const csv = toCsv(['a', 'b'], [['x;y', 'diz "oi"'], ['=1+1', null], [-3, '+5']])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual(['a;b', '"x;y";"diz ""oi"""', "'=1+1;", "-3;'+5", ''])
  })

  it('exports attempts with participant code and concept', () => {
    let save = setParticipantCode(createInitialSave(refs, 'now'), 'ALUNO-07')
    save = recordAttempt(
      save,
      {
        missionId: 'm1-first-harvest',
        timestamp: '2026-10-14T12:00:00.000Z',
        outcome: 'error',
        errorCode: 'HIT_OBSTACLE',
        actions: 3,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 3 },
        efficiencyStars: null,
        pseudocode: '',
      },
      refs,
    )
    const lines = attemptsCsv(save, MISSIONS).slice(1).split('\r\n')
    expect(lines[0]).toBe(
      'participante;missao;fase;conceito;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;sementes;agua;energia;dicas;eficiencia',
    )
    expect(lines[1]).toBe('ALUNO-07;m1-first-harvest;1;Sequenciamento;1;2026-10-14T12:00:00.000Z;erro;HIT_OBSTACLE;3;4;0;0;3;0;')
  })

  it('exports missions and assessment answers', () => {
    let save = createInitialSave(refs, 'now')
    const answers = Object.fromEntries(itemsForForm('pre').map((item) => [item.id, item.correctIndex]))
    save = storeAssessment(save, { form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers })
    expect(missionsCsv(computeDashboard(save, MISSIONS), null).slice(1).split('\r\n')).toHaveLength(MISSIONS.length + 2)
    const assessment = assessmentCsv(save).slice(1).split('\r\n')
    expect(assessment[0]).toBe('participante;forma;item;par;conceito;resposta;correta')
    expect(assessment).toHaveLength(12)
    expect(assessment[1]).toMatch(/^;pre;seq-1-A;seq-1;Sequenciamento;1;sim$/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/dashboard src/services/export`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/dashboard/dashboardStats.ts`**

```ts
import { percent, scoreResponse } from '@/game/assessment/scoring'
import { ASSESSMENT_CONCEPT_LABELS, ASSESSMENT_CONCEPTS, type AssessmentConcept } from '@/game/assessment/types'
import { CONCEPT_LABELS, type MissionConcept, type MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus, SaveData } from '@/game/progress/types'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { ErrorCode } from '@/game/world/types'

export interface MissionRow {
  missionId: string
  title: string
  concept: MissionConcept
  conceptLabel: string
  status: MissionStatus
  attempts: number
  successes: number
  errors: number
  hintsUsed: number
  bestActions: number | null
  bestStars: number | null
}

export interface DashboardStats {
  hasData: boolean
  completedPhases: number
  totalPhases: number
  completionRate: number
  totalAttempts: number
  totalHints: number
  missions: MissionRow[]
  topErrors: { code: ErrorCode; label: string; count: number }[]
  concepts: { concept: MissionConcept; label: string; attempts: number; successRate: number }[]
  assessment: { concept: AssessmentConcept; label: string; pre: number | null; post: number | null }[]
}

export function computeDashboard(save: SaveData, missions: MissionDefinition[]): DashboardStats {
  const rows: MissionRow[] = missions.map((mission) => {
    const attempts = save.attempts.filter((attempt) => attempt.missionId === mission.id)
    const progress = save.missions[mission.id]
    return {
      missionId: mission.id,
      title: mission.title,
      concept: mission.concept,
      conceptLabel: CONCEPT_LABELS[mission.concept],
      status: progress?.status ?? 'locked',
      attempts: attempts.length,
      successes: attempts.filter((attempt) => attempt.outcome === 'success').length,
      errors: attempts.filter((attempt) => attempt.outcome === 'error').length,
      hintsUsed: progress?.hintsUsed ?? 0,
      bestActions: progress?.bestResult?.actions ?? null,
      bestStars: progress?.bestResult?.efficiencyStars ?? null,
    }
  })
  const phases = missions.filter((mission) => !mission.tutorial)
  const completedPhases = phases.filter((mission) => save.missions[mission.id]?.status === 'completed').length

  const errorCounts = new Map<ErrorCode, number>()
  for (const attempt of save.attempts) {
    if (attempt.errorCode) errorCounts.set(attempt.errorCode, (errorCounts.get(attempt.errorCode) ?? 0) + 1)
  }
  const topErrors = [...errorCounts]
    .map(([code, count]) => ({ code, label: ERROR_TEXT[code].message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const conceptOrder = [...new Set(missions.map((mission) => mission.concept))]
  const concepts = conceptOrder.map((concept) => {
    const conceptRows = rows.filter((row) => row.concept === concept)
    const attempts = conceptRows.reduce((sum, row) => sum + row.attempts, 0)
    const successes = conceptRows.reduce((sum, row) => sum + row.successes, 0)
    return { concept, label: CONCEPT_LABELS[concept], attempts, successRate: attempts === 0 ? 0 : successes / attempts }
  })

  const preScores = save.assessments.pre ? scoreResponse(save.assessments.pre) : null
  const postScores = save.assessments.post ? scoreResponse(save.assessments.post) : null
  const assessment = ASSESSMENT_CONCEPTS.map((concept) => ({
    concept,
    label: ASSESSMENT_CONCEPT_LABELS[concept],
    pre: preScores ? percent(preScores[concept]) : null,
    post: postScores ? percent(postScores[concept]) : null,
  }))

  return {
    hasData: save.attempts.length > 0 || save.assessments.pre !== null || save.assessments.post !== null,
    completedPhases,
    totalPhases: phases.length,
    completionRate: phases.length === 0 ? 0 : completedPhases / phases.length,
    totalAttempts: save.attempts.length,
    totalHints: rows.reduce((sum, row) => sum + row.hintsUsed, 0),
    missions: rows,
    topErrors,
    concepts,
    assessment,
  }
}
```

- [ ] **Step 4: Implementar `src/features/dashboard/demoData.ts`**

```ts
import { itemsForForm } from '@/data/assessment/items'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { createInitialSave, recordAttempt, registerHint, storeAssessment } from '@/game/progress/progression'
import type { AttemptInput, SaveData } from '@/game/progress/types'
import type { ErrorCode } from '@/game/world/types'

const DEMO_ERRORS: ErrorCode[] = ['HIT_OBSTACLE', 'PLOT_OCCUPIED', 'WATER_WASTED', 'PLANT_NOT_MATURE', 'NO_WATER', 'PLOT_OCCUPIED']

export function createDemoSave(missions: MissionDefinition[]): SaveData {
  const refs = missions.map(({ id, order }) => ({ id, order }))
  let save = createInitialSave(refs, '2026-01-01T00:00:00.000Z')
  missions.forEach((mission, index) => {
    const failures = mission.tutorial ? 1 : 1 + (index % 3)
    for (let attempt = 0; attempt < failures; attempt += 1) {
      const input: AttemptInput = {
        missionId: mission.id,
        timestamp: `2026-01-0${1 + (index % 8)}T1${attempt}:00:00.000Z`,
        outcome: 'error',
        errorCode: DEMO_ERRORS[index % DEMO_ERRORS.length],
        actions: 4 + attempt,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 4 },
        efficiencyStars: null,
        pseudocode: '',
      }
      save = recordAttempt(save, input, refs)
    }
    if (index % 2 === 1) save = registerHint(save, mission.id)
    save = recordAttempt(
      save,
      {
        missionId: mission.id,
        timestamp: `2026-01-0${1 + (index % 8)}T15:00:00.000Z`,
        outcome: 'success',
        errorCode: null,
        actions: mission.efficiency.referenceActions + index,
        blocks: mission.efficiency.referenceBlocks + 1,
        usage: { seeds: 0, water: 0, energy: mission.efficiency.referenceActions },
        efficiencyStars: index % 3 === 0 ? 3 : 2,
        pseudocode: '',
      },
      refs,
    )
  })
  const pre = itemsForForm('pre')
  const post = itemsForForm('post')
  save = storeAssessment(save, {
    form: 'pre',
    startedAt: '2026-01-01T09:00:00.000Z',
    completedAt: '2026-01-01T09:10:00.000Z',
    skipped: false,
    answers: Object.fromEntries(pre.map((item, index) => [item.id, index % 2 === 0 ? item.correctIndex : (item.correctIndex + 1) % item.options.length])),
  })
  save = storeAssessment(save, {
    form: 'post',
    startedAt: '2026-01-09T09:00:00.000Z',
    completedAt: '2026-01-09T09:10:00.000Z',
    skipped: false,
    answers: Object.fromEntries(post.map((item, index) => [item.id, index % 5 === 4 ? (item.correctIndex + 1) % item.options.length : item.correctIndex])),
  })
  return save
}
```

- [ ] **Step 5: Implementar `src/services/export/csv.ts`**

```ts
import { itemsForForm } from '@/data/assessment/items'
import type { DashboardStats } from '@/features/dashboard/dashboardStats'
import { ASSESSMENT_CONCEPT_LABELS } from '@/game/assessment/types'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import type { AttemptOutcome, SaveData } from '@/game/progress/types'

const BOM = '\uFEFF'
const SEPARATOR = ';'
const NEWLINE = '\r\n'

function cell(value: string | number | null): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(SEPARATOR))
  return BOM + lines.join(NEWLINE) + NEWLINE
}

const OUTCOME_LABELS: Record<AttemptOutcome, string> = {
  success: 'sucesso',
  objectiveFailed: 'objetivo_nao_cumprido',
  error: 'erro',
}

export function attemptsCsv(save: SaveData, missions: MissionDefinition[]): string {
  const byId = new Map(missions.map((mission) => [mission.id, mission]))
  return toCsv(
    ['participante', 'missao', 'fase', 'conceito', 'tentativa', 'data_hora', 'resultado', 'codigo_erro', 'comandos', 'blocos', 'sementes', 'agua', 'energia', 'dicas', 'eficiencia'],
    save.attempts.map((attempt) => {
      const mission = byId.get(attempt.missionId)
      return [
        save.participantCode,
        attempt.missionId,
        mission?.order ?? null,
        mission ? CONCEPT_LABELS[mission.concept] : null,
        attempt.attemptNumber,
        attempt.timestamp,
        OUTCOME_LABELS[attempt.outcome],
        attempt.errorCode,
        attempt.actions,
        attempt.blocks,
        attempt.usage.seeds,
        attempt.usage.water,
        attempt.usage.energy,
        attempt.hintsUsed,
        attempt.efficiencyStars,
      ]
    }),
  )
}

export function missionsCsv(stats: DashboardStats, participantCode: string | null): string {
  return toCsv(
    ['participante', 'missao', 'titulo', 'conceito', 'estado', 'tentativas', 'sucessos', 'erros', 'dicas', 'melhor_comandos', 'melhor_eficiencia'],
    stats.missions.map((row) => [
      participantCode,
      row.missionId,
      row.title,
      row.conceptLabel,
      row.status,
      row.attempts,
      row.successes,
      row.errors,
      row.hintsUsed,
      row.bestActions,
      row.bestStars,
    ]),
  )
}

export function assessmentCsv(save: SaveData): string {
  const rows: (string | number | null)[][] = []
  for (const response of [save.assessments.pre, save.assessments.post]) {
    if (!response) continue
    if (response.skipped) {
      rows.push([save.participantCode, response.form, null, null, null, null, 'pulado'])
      continue
    }
    for (const item of itemsForForm(response.form)) {
      const answer = response.answers[item.id]
      rows.push([
        save.participantCode,
        response.form,
        item.id,
        item.pairId,
        ASSESSMENT_CONCEPT_LABELS[item.concept],
        answer === undefined ? null : answer,
        answer === item.correctIndex ? 'sim' : 'nao',
      ])
    }
  }
  return toCsv(['participante', 'forma', 'item', 'par', 'conceito', 'resposta', 'correta'], rows)
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/features/dashboard src/services/export && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/dashboard src/services/export
git commit -m "feat(dashboard): add learning statistics, labelled demo data and anonymous CSV export"
```

---

### Task 10.4: Página do painel educativo

**Files:**
- Create: `src/features/dashboard/BarChart.tsx`
- Create: `src/features/dashboard/DashboardPage.tsx`
- Create: `src/features/dashboard/DashboardPage.css`
- Modify: `src/app/routes.tsx` (rota `/painel`)
- Test: `src/features/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `computeDashboard`, `createDemoSave`, `attemptsCsv`, `missionsCsv`, `assessmentCsv`, `downloadText`, `MISSIONS`, `useProgressStore`, `PageHeader`, `Icon`.
- Produces:
  - `BarChart({ title, description, series, max, unit })` com `series: { label: string; values: { name: string; value: number | null; tone: 'primary' | 'secondary' }[] }[]` (SVG + tabela não necessária porque a página já tem tabela; o SVG tem `<title>`/`<desc>`)
  - `DashboardPage` em `/painel`

- [ ] **Step 1: Escrever teste que falha**

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { useProgressStore } from '@/stores/progressStore'

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('states that data are local and shows an empty state without records', () => {
    renderPage()
    expect(screen.getByText(/Não constituem resultados de pesquisa/)).toBeInTheDocument()
    expect(screen.getByText('Ainda não existem registros neste navegador.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeDisabled()
  })

  it('labels demo data clearly and never exports it', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Carregar dados de demonstração' }))
    expect(screen.getByText('DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeDisabled()
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
  })

  it('shows real numbers from recorded attempts', () => {
    useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 8,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 7 },
      efficiencyStars: 3,
      pseudocode: '',
    })
    renderPage()
    expect(screen.getByLabelText('Fases concluídas')).toHaveTextContent('1 de 6')
    const table = screen.getByRole('table', { name: 'Resultados por missão' })
    const row = within(table).getByRole('row', { name: /Primeira colheita/ })
    expect(row).toHaveTextContent('Concluída')
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeEnabled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/dashboard/DashboardPage.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/features/dashboard/BarChart.tsx`**

```tsx
import { useId } from 'react'

interface BarValue {
  name: string
  value: number | null
  tone: 'primary' | 'secondary'
}

interface BarChartProps {
  title: string
  description: string
  series: { label: string; values: BarValue[] }[]
  max: number
  unit?: string
}

const ROW_HEIGHT = 30
const LABEL_WIDTH = 190
const CHART_WIDTH = 520

export function BarChart({ title, description, series, max, unit = '' }: BarChartProps) {
  const titleId = useId()
  const descId = useId()
  const barsPerRow = Math.max(1, ...series.map((row) => row.values.length))
  const rowHeight = ROW_HEIGHT * barsPerRow + 10
  const height = series.length * rowHeight + 10
  const scale = (value: number) => (max <= 0 ? 0 : (value / max) * (CHART_WIDTH - LABEL_WIDTH - 60))
  return (
    <figure className="bar-chart">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`} className="bar-chart__svg">
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {series.map((row, rowIndex) => {
          const y = rowIndex * rowHeight + 10
          return (
            <g key={row.label}>
              <text x={0} y={y + (rowHeight - 10) / 2 + 4} className="bar-chart__label">
                {row.label.length > 26 ? `${row.label.slice(0, 25)}…` : row.label}
              </text>
              {row.values.map((bar, barIndex) => {
                const barY = y + barIndex * ROW_HEIGHT
                const width = bar.value === null ? 0 : Math.max(2, scale(bar.value))
                return (
                  <g key={bar.name}>
                    <rect x={LABEL_WIDTH} y={barY} width={width} height={ROW_HEIGHT - 8} rx={4} className={`bar-chart__bar bar-chart__bar--${bar.tone}`} />
                    <text x={LABEL_WIDTH + width + 6} y={barY + ROW_HEIGHT / 2 + 1} className="bar-chart__value">
                      {bar.value === null ? `${bar.name}: sem dados` : `${bar.name}: ${bar.value}${unit}`}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  )
}
```

- [ ] **Step 4: Implementar `src/features/dashboard/DashboardPage.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { BarChart } from '@/features/dashboard/BarChart'
import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { createDemoSave } from '@/features/dashboard/demoData'
import { assessmentCsv, attemptsCsv, downloadText, missionsCsv } from '@/services/export/csv'
import { useProgressStore } from '@/stores/progressStore'
import './DashboardPage.css'

const STATUS_TEXT = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const

export function DashboardPage() {
  const realSave = useProgressStore((store) => store.save)
  const [demo, setDemo] = useState(false)
  const demoSave = useMemo(() => createDemoSave(MISSIONS), [])
  const save = demo ? demoSave : realSave
  const stats = useMemo(() => computeDashboard(save, MISSIONS), [save])
  const realHasData = useMemo(() => computeDashboard(realSave, MISSIONS).hasData, [realSave])
  const canExport = !demo && realHasData
  const stamp = new Date().toISOString().slice(0, 10)
  const code = realSave.participantCode ?? 'anonimo'

  return (
    <div className="chrome-page">
      <PageHeader title="Painel educativo" subtitle="Acompanhamento das partidas registradas neste navegador." backTo="/" />
      <main className="dashboard">
        <p className="dashboard__banner" role="note">
          <Icon name="database" /> Dados registrados neste navegador. Não constituem resultados de pesquisa até serem coletados e analisados
          com o método descrito na documentação. Dados de uso não são, sozinhos, evidência de aprendizagem.
        </p>
        {demo && <p className="dashboard__demo">DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado</p>}

        <div className="dashboard__toolbar">
          <button type="button" className="button" onClick={() => setDemo((value) => !value)}>
            {demo ? 'Voltar aos dados reais' : 'Carregar dados de demonstração'}
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_tentativas_${code}_${stamp}.csv`, attemptsCsv(realSave, MISSIONS))}>
            <Icon name="database" /> Exportar tentativas (CSV)
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_missoes_${code}_${stamp}.csv`, missionsCsv(computeDashboard(realSave, MISSIONS), realSave.participantCode))}>
            <Icon name="database" /> Exportar missões (CSV)
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_avaliacao_${code}_${stamp}.csv`, assessmentCsv(realSave))}>
            <Icon name="database" /> Exportar avaliação (CSV)
          </button>
        </div>

        {!stats.hasData ? (
          <section className="card dashboard__empty">
            <h2>Ainda não existem registros neste navegador.</h2>
            <p>Os números aparecem depois que alguém jogar as missões ou responder às avaliações. Nenhum dado é inventado.</p>
          </section>
        ) : (
          <>
            <section className="dashboard__cards" aria-label="Resumo">
              <div className="card dashboard__metric" role="group" aria-label="Fases concluídas">
                <span>Fases concluídas</span>
                <strong>
                  {stats.completedPhases} de {stats.totalPhases}
                </strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Taxa de conclusão">
                <span>Taxa de conclusão</span>
                <strong>{Math.round(stats.completionRate * 100)}%</strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Tentativas registradas">
                <span>Tentativas registradas</span>
                <strong>{stats.totalAttempts}</strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Dicas usadas">
                <span>Dicas usadas</span>
                <strong>{stats.totalHints}</strong>
              </div>
            </section>

            <section className="dashboard__charts">
              <div className="card">
                <BarChart
                  title="Tentativas por missão"
                  description="Número de execuções registradas em cada missão."
                  series={stats.missions.map((row) => ({ label: row.title, values: [{ name: 'tentativas', value: row.attempts, tone: 'primary' }] }))}
                  max={Math.max(1, ...stats.missions.map((row) => row.attempts))}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Erros mais frequentes"
                  description="Os tipos de erro que mais interromperam execuções."
                  series={stats.topErrors.map((error) => ({ label: error.label, values: [{ name: 'ocorrências', value: error.count, tone: 'secondary' }] }))}
                  max={Math.max(1, ...stats.topErrors.map((error) => error.count))}
                />
                {stats.topErrors.length === 0 && <p>Nenhum erro registrado.</p>}
              </div>
              <div className="card">
                <BarChart
                  title="Avaliação por conceito: pré × pós"
                  description="Percentual de acertos por conceito no pré-teste e no pós-teste."
                  series={stats.assessment.map((row) => ({
                    label: row.label,
                    values: [
                      { name: 'pré', value: row.pre, tone: 'secondary' },
                      { name: 'pós', value: row.post, tone: 'primary' },
                    ],
                  }))}
                  max={100}
                  unit="%"
                />
              </div>
            </section>

            <section className="card">
              <table className="dashboard__table">
                <caption>Resultados por missão</caption>
                <thead>
                  <tr>
                    <th scope="col">Missão</th>
                    <th scope="col">Conceito</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Tentativas</th>
                    <th scope="col">Sucessos</th>
                    <th scope="col">Erros</th>
                    <th scope="col">Dicas</th>
                    <th scope="col">Melhor (comandos)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.missions.map((row) => (
                    <tr key={row.missionId}>
                      <th scope="row">{row.title}</th>
                      <td>{row.conceptLabel}</td>
                      <td>{STATUS_TEXT[row.status]}</td>
                      <td>{row.attempts}</td>
                      <td>{row.successes}</td>
                      <td>{row.errors}</td>
                      <td>{row.hintsUsed}</td>
                      <td>{row.bestActions ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card">
              <table className="dashboard__table">
                <caption>Resultados por conceito pedagógico</caption>
                <thead>
                  <tr>
                    <th scope="col">Conceito</th>
                    <th scope="col">Tentativas</th>
                    <th scope="col">Taxa de sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.concepts.map((row) => (
                    <tr key={row.concept}>
                      <th scope="row">{row.label}</th>
                      <td>{row.attempts}</td>
                      <td>{row.attempts === 0 ? '—' : `${Math.round(row.successRate * 100)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Criar `src/features/dashboard/DashboardPage.css`**

```css
.dashboard {
  display: grid;
  gap: var(--space-4);
  padding: 0 var(--space-5) var(--space-6);
}

.dashboard__banner {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: #fdf3d8;
  color: #3a2e0c;
}

.dashboard__demo {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: repeating-linear-gradient(45deg, #f2c14e, #f2c14e 12px, #e5b03a 12px, #e5b03a 24px);
  color: #1d1a0e;
  font-weight: 800;
  text-align: center;
}

.dashboard__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.dashboard__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
}

.dashboard__metric {
  display: grid;
  gap: var(--space-1);
}

.dashboard__metric span {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.dashboard__metric strong {
  font-size: var(--text-xl);
}

.dashboard__charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: var(--space-3);
}

.bar-chart {
  margin: 0;
}

.bar-chart__svg {
  width: 100%;
  height: auto;
}

.bar-chart figcaption {
  font-weight: 700;
}

.bar-chart__label,
.bar-chart__value {
  font: 12px var(--font-sans);
  fill: var(--color-text);
}

.bar-chart__bar--primary {
  fill: var(--green-600);
}

.bar-chart__bar--secondary {
  fill: var(--water-500);
}

.dashboard__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.dashboard__table caption {
  text-align: left;
  font-weight: 700;
  font-size: var(--text-md);
  padding-bottom: var(--space-2);
}

.dashboard__table th,
.dashboard__table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.dashboard__empty h2 {
  font-size: var(--text-lg);
}

@media (max-width: 640px) {
  .dashboard__charts {
    grid-template-columns: 1fr;
  }

  .dashboard__table {
    display: block;
    overflow-x: auto;
  }
}
```

- [ ] **Step 6: Registrar rota**

Em `src/app/routes.tsx`: `import { DashboardPage } from '@/features/dashboard/DashboardPage'` e `{ path: '/painel', element: <DashboardPage /> },`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS em toda a suíte.

- [ ] **Step 8: Commit**

```bash
git add src/features/dashboard src/app/routes.tsx
git commit -m "feat(dashboard): add educational dashboard with charts, tables and CSV export"
```
