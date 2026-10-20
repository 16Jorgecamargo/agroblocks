import { BARNYARD_ITEMS } from '@/data/assessment/barnyard'
import { CORNFIELD_ITEMS } from '@/data/assessment/cornfield'
import { GARDEN_ITEMS } from '@/data/assessment/garden'
import { GREENHOUSE_ITEMS } from '@/data/assessment/greenhouse'
import { HOMESTEAD_ITEMS } from '@/data/assessment/homestead'
import { ORCHARD_ITEMS } from '@/data/assessment/orchard'
import type { AssessmentItem } from '@/game/assessment/types'
import type { AssessmentForm } from '@/game/progress/types'
import type { WorldId } from '@/game/worlds/worldTypes'

export const ASSESSMENT_ITEMS: AssessmentItem[] = [...GARDEN_ITEMS, ...CORNFIELD_ITEMS, ...ORCHARD_ITEMS, ...GREENHOUSE_ITEMS, ...BARNYARD_ITEMS, ...HOMESTEAD_ITEMS]

function variantOf(form: AssessmentForm): 'A' | 'B' {
  return form === 'pre' ? 'A' : 'B'
}

export function itemsFor(world: WorldId, form: AssessmentForm): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter((item) => item.world === world && item.variant === variantOf(form))
}

export function itemsForForm(form: AssessmentForm): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter((item) => item.variant === variantOf(form))
}
