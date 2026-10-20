import type { Program } from '@/blocks/interpreter/ast'
import { runProgram } from '@/blocks/interpreter/runProgram'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { validateMission } from '@/game/missions/validateMission'

export function playMission(mission: MissionDefinition, code: Program) {
  const controllerMission = toControllerMission(mission)
  const result = runProgram(code, controllerMission.initialState, controllerMission.rules, controllerMission.stepLimit)
  return { ...result, validation: validateMission(result.state, controllerMission.goals) }
}
