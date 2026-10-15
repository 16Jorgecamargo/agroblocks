import type { ModelId } from '@/render/models/manifest'
import type { PlotState } from '@/game/world/types'

export type CropStage = 1 | 2 | 3 | 4 | 5

export function cropStageFor(plot: PlotState, growth: number, growTicks: number): CropStage | null {
  const late = growth * 2 >= growTicks
  if (plot === 'seeded') return late ? 2 : 1
  if (plot === 'growing') return late ? 4 : 3
  if (plot === 'mature') return 5
  return null
}

export function cropModelId(stage: CropStage): ModelId {
  return `crop-${stage}` as ModelId
}

export type RobotClip = 'idle' | 'move' | 'success' | 'error'

export function robotClipFor({ moving, failed, celebrating }: { moving: boolean; failed: boolean; celebrating: boolean }): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  if (moving) return 'move'
  return 'idle'
}
