import type { ActionType, SensorType } from '@/game/world/types'

export const BLOCK_TYPES = [
  'when_run',
  'robot_move_forward',
  'robot_turn_left',
  'robot_turn_right',
  'farm_prepare_soil',
  'farm_plant',
  'farm_water',
  'farm_harvest',
  'farm_collect',
  'sensor_plot_empty',
  'sensor_soil_dry',
  'sensor_plant_mature',
  'sensor_obstacle_ahead',
  'sensor_has_seeds',
  'controls_repeat_ext',
  'controls_whileUntil',
  'controls_if',
  'logic_compare',
  'logic_operation',
  'logic_negate',
  'logic_boolean',
  'math_number',
  'math_arithmetic',
  'variables_set',
  'variables_get',
  'math_change',
  'procedures_defnoreturn',
  'procedures_callnoreturn',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

export const ALL_BLOCKS: BlockType[] = [...BLOCK_TYPES]

export const BLOCK_FOR_ACTION: Record<ActionType, BlockType> = {
  moveForward: 'robot_move_forward',
  turnLeft: 'robot_turn_left',
  turnRight: 'robot_turn_right',
  prepareSoil: 'farm_prepare_soil',
  plant: 'farm_plant',
  water: 'farm_water',
  harvest: 'farm_harvest',
  collectResources: 'farm_collect',
}

export const BLOCK_FOR_SENSOR: Record<SensorType, BlockType> = {
  isPlotEmpty: 'sensor_plot_empty',
  isSoilDry: 'sensor_soil_dry',
  isPlantMature: 'sensor_plant_mature',
  isObstacleAhead: 'sensor_obstacle_ahead',
  hasSeeds: 'sensor_has_seeds',
}

export const ACTION_BLOCKS: Partial<Record<string, ActionType>> = Object.fromEntries(
  Object.entries(BLOCK_FOR_ACTION).map(([action, block]) => [block, action as ActionType]),
)

export const SENSOR_BLOCKS: Partial<Record<string, SensorType>> = Object.fromEntries(
  Object.entries(BLOCK_FOR_SENSOR).map(([sensor, block]) => [block, sensor as SensorType]),
)

export const BLOCK_LABELS: Record<string, string> = {
  when_run: 'quando executar',
  controls_repeat_ext: 'repita',
  controls_whileUntil: 'enquanto',
  controls_if: 'se',
  logic_compare: 'comparar',
  logic_operation: 'e / ou',
  logic_negate: 'não',
  math_arithmetic: 'conta',
  variables_set: 'definir variável',
  math_change: 'alterar variável',
  procedures_defnoreturn: 'procedimento',
}
