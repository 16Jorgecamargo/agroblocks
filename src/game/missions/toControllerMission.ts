import { DEFAULT_STEP_LIMIT } from '@/blocks/interpreter/interpreter'
import type { ControllerMission } from '@/game/execution/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { createInitialState } from '@/game/world/createInitialState'

export function toControllerMission(mission: MissionDefinition): ControllerMission {
  return {
    initialState: createInitialState(mission),
    rules: {
      growTicks: mission.growTicks,
      forbidWaterWet: mission.rules.forbidWaterWet ?? false,
      mistakes: mission.commonMistakes,
    },
    goals: { objectives: mission.objectives, constraints: mission.constraints },
    stepLimit: mission.rules.stepLimit ?? DEFAULT_STEP_LIMIT,
  }
}
