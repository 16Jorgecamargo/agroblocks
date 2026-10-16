import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'
import type { TutorialCondition, TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'

export interface TutorialProgress {
  index: number
  partial: number
  notice: string | null
}

export const TUTORIAL_START: TutorialProgress = { index: 0, partial: 0, notice: null }

const LAST_INDEX = TUTORIAL_STEPS.length - 1

function matches(condition: TutorialCondition, signal: TutorialSignal): boolean {
  if (condition.type !== signal.type) return false
  if (condition.type === 'stackSize' && signal.type === 'stackSize') return signal.size >= condition.atLeast
  if (condition.type === 'tabOpened' && signal.type === 'tabOpened') return signal.tab === condition.tab
  return true
}

export function advanceTutorial(progress: TutorialProgress, signal: TutorialSignal): TutorialProgress {
  const step = TUTORIAL_STEPS[progress.index]
  if (!step || step.kind !== 'practice') return progress
  const condition = step.done[progress.partial]
  if (condition && matches(condition, signal)) {
    const partial = progress.partial + 1
    if (partial >= step.done.length) return { index: Math.min(progress.index + 1, LAST_INDEX), partial: 0, notice: null }
    return { index: progress.index, partial, notice: null }
  }
  const notice = step.notices?.[signal.type]
  if (notice) return { index: progress.index, partial: 0, notice }
  return progress
}

export function nextTutorial(progress: TutorialProgress): TutorialProgress {
  const step = TUTORIAL_STEPS[progress.index]
  if (!step || step.kind === 'practice' || progress.index >= LAST_INDEX) return progress
  return { index: progress.index + 1, partial: 0, notice: null }
}

export function previousTutorial(progress: TutorialProgress): TutorialProgress {
  return { index: Math.max(0, progress.index - 1), partial: 0, notice: null }
}

export function statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null {
  const next = snapshot.status
  if (previous === next) return null
  if (next === 'running') return previous === 'paused' ? null : { type: 'run' }
  if (next === 'idle' && (previous === 'running' || previous === 'paused')) return { type: 'stop' }
  if (next === 'failed') return { type: 'error' }
  if (next === 'finished') return snapshot.validation?.success ? { type: 'success' } : { type: 'error' }
  return null
}
