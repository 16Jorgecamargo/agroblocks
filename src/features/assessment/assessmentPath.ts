import type { AssessmentForm } from '@/game/progress/types'
import type { WorldId } from '@/game/worlds/worldTypes'

export function assessmentPath(world: WorldId, form: AssessmentForm): string {
  return `/avaliacao/${world}/${form === 'pre' ? 'pre' : 'pos'}`
}
