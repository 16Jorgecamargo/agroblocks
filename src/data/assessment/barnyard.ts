import type { AssessmentItem } from '@/game/assessment/types'

export const BARNYARD_ITEMS: AssessmentItem[] = [
  {
    id: 'barnyard-5-A',
    pairId: 'barnyard-5',
    variant: 'A',
    world: 'barnyard',
    skill: 'predict',
    kind: 'choice',
    prompt: 'Qual é o valor de contador no final?',
    code: 'contador ← 0\nrepita 5 vezes:\n    contador ← contador + 2',
    options: ['2', '5', '7', '10'],
    correctIndex: 3,
  },
  {
    id: 'barnyard-5-B',
    pairId: 'barnyard-5',
    variant: 'B',
    world: 'barnyard',
    skill: 'predict',
    kind: 'choice',
    prompt: 'Qual é o valor de total no final?',
    code: 'total ← 10\nrepita 3 vezes:\n    total ← total - 2',
    options: ['4', '6', '7', '8'],
    correctIndex: 0,
  },
]
