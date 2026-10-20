import { ALL_BLOCKS, type BlockType } from '@/blocks/blockTypes'

export const GARDEN_BLOCKS: BlockType[] = [
  'robot_move_forward',
  'robot_turn_left',
  'robot_turn_right',
  'farm_prepare_soil',
  'farm_plant',
  'farm_water',
  'farm_harvest',
]

export const CORNFIELD_BLOCKS: BlockType[] = [...GARDEN_BLOCKS, 'controls_repeat_ext']

export const ORCHARD_BLOCKS: BlockType[] = [...CORNFIELD_BLOCKS, 'controls_if', 'sensor_plant_mature', 'sensor_soil_dry', 'sensor_plot_empty']

export const GREENHOUSE_BLOCKS: BlockType[] = [...ORCHARD_BLOCKS, 'controls_whileUntil', 'sensor_obstacle_ahead', 'sensor_has_seeds', 'logic_negate']

export const BARNYARD_BLOCKS: BlockType[] = [
  ...GREENHOUSE_BLOCKS,
  'farm_collect',
  'variables_set',
  'variables_get',
  'math_change',
  'math_number',
  'math_arithmetic',
  'logic_compare',
]

export const HOMESTEAD_BLOCKS: BlockType[] = ALL_BLOCKS
