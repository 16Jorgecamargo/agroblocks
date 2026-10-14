export type Facing = 'N' | 'E' | 'S' | 'W'
export type Terrain = 'soil' | 'obstacle' | 'blocked' | 'reservoir' | 'seedDepot'
export type PlotState = 'untilled' | 'tilled' | 'seeded' | 'growing' | 'mature' | 'harvested'
export type Moisture = 'dry' | 'wet'

export interface Position {
  x: number
  y: number
}

export interface Cell {
  terrain: Terrain
  plot: PlotState
  moisture: Moisture
  growth: number
}

export interface Robot extends Position {
  facing: Facing
}

export interface Resources {
  seeds: number | null
  water: number | null
  energy: number | null
  harvested: number
}

export interface Capacity {
  seeds: number | null
  water: number | null
}

export interface ResourceUsage {
  seeds: number
  water: number
  energy: number
}

export interface GameState {
  width: number
  height: number
  cells: Cell[][]
  robot: Robot
  resources: Resources
  capacity: Capacity
  usage: ResourceUsage
  actionCount: number
}

export const ACTION_TYPES = [
  'moveForward',
  'turnLeft',
  'turnRight',
  'prepareSoil',
  'plant',
  'water',
  'harvest',
  'collectResources',
] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const SENSOR_TYPES = ['isPlotEmpty', 'isSoilDry', 'isPlantMature', 'isObstacleAhead', 'hasSeeds'] as const
export type SensorType = (typeof SENSOR_TYPES)[number]

export const ERROR_CODES = [
  'OUT_OF_BOUNDS',
  'HIT_OBSTACLE',
  'PLOT_OCCUPIED',
  'SOIL_NOT_READY',
  'PLANT_NOT_MATURE',
  'NOTHING_TO_HARVEST',
  'NO_SEEDS',
  'NO_WATER',
  'NO_ENERGY',
  'NOT_AT_SUPPLY',
  'NOT_SOIL',
  'WATER_WASTED',
  'STEP_LIMIT',
  'INVALID_PROGRAM',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

export interface GameError {
  code: ErrorCode
  message: string
  hint: string
}

export type ResourceKey = 'seeds' | 'water' | 'energy' | 'harvested'

export type GameEvent =
  | { type: 'robotMoved'; from: Position; to: Position }
  | { type: 'robotTurned'; facing: Facing }
  | { type: 'plotChanged'; x: number; y: number; from: PlotState; to: PlotState }
  | { type: 'moistureChanged'; x: number; y: number; moisture: Moisture }
  | { type: 'resourceChanged'; resource: ResourceKey; value: number | null }
  | { type: 'resourcesCollected'; resource: 'water' | 'seeds'; amount: number }

export interface WorldRules {
  growTicks: number
  forbidWaterWet: boolean
  mistakes?: Partial<Record<ErrorCode, string>>
}

export interface ActionResult {
  state: GameState
  events: GameEvent[]
  error?: GameError
}

export interface WorldResources {
  seeds: number | null
  water: number | null
  energy: number | null
  seedCapacity: number | null
  waterCapacity: number | null
}

export interface WorldSetup {
  map: { cells: string[] }
  robot: Robot
  resources: WorldResources
}
