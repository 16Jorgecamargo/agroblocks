import { itemsFor } from '@/data/assessment/items'
import { ASSESSMENT_SKILLS, type AssessmentSkill } from '@/game/assessment/types'
import type { AssessmentResponse } from '@/game/progress/types'

export type ConceptScore = { correct: number; total: number }

export function scoreResponse(response: AssessmentResponse): ConceptScore | null {
  if (response.skipped) return null
  const items = itemsFor(response.world, response.form)
  return { correct: items.filter((item) => response.answers[item.id] === item.correctIndex).length, total: items.length }
}

export function scoreBySkill(response: AssessmentResponse): Record<AssessmentSkill, ConceptScore> | null {
  if (response.skipped) return null
  const scores = Object.fromEntries(ASSESSMENT_SKILLS.map((skill) => [skill, { correct: 0, total: 0 }])) as Record<AssessmentSkill, ConceptScore>
  for (const item of itemsFor(response.world, response.form)) {
    scores[item.skill].total += 1
    if (response.answers[item.id] === item.correctIndex) scores[item.skill].correct += 1
  }
  return scores
}

export function percent(score: ConceptScore): number {
  return score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100)
}
