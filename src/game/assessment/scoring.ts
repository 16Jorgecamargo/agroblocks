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
