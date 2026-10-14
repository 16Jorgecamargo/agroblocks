import type { ErrorCode, GameError } from '@/game/world/types'

export const ERROR_TEXT: Record<ErrorCode, { message: string; hint: string }> = {
  OUT_OF_BOUNDS: {
    message: 'O robô tentou sair da área da fazenda.',
    hint: 'Conte quantas casas existem até a borda antes de mover.',
  },
  HIT_OBSTACLE: {
    message: 'O robô encontrou um obstáculo.',
    hint: 'Confira a direção antes de executar o próximo movimento. O sensor "há obstáculo à frente?" pode ajudar.',
  },
  PLOT_OCCUPIED: {
    message: 'O robô tentou trabalhar em um canteiro ocupado.',
    hint: 'Verifique o estado do solo antes de plantar ou preparar.',
  },
  SOIL_NOT_READY: {
    message: 'O solo ainda não foi preparado para o plantio.',
    hint: 'Use "preparar solo" antes de plantar.',
  },
  PLANT_NOT_MATURE: {
    message: 'A planta ainda não está madura.',
    hint: 'Use o sensor de maturidade antes da colheita.',
  },
  NOTHING_TO_HARVEST: {
    message: 'Não há planta para colher neste canteiro.',
    hint: 'Confira se o robô está sobre o canteiro certo antes de colher.',
  },
  NO_SEEDS: {
    message: 'Acabaram as sementes.',
    hint: 'Planeje quantas sementes serão necessárias ou reabasteça no depósito de sementes.',
  },
  NO_WATER: {
    message: 'O reservatório do robô está vazio.',
    hint: 'Planeje quando será necessário reabastecer no reservatório.',
  },
  NO_ENERGY: {
    message: 'A energia do robô acabou.',
    hint: 'Procure um caminho com menos movimentos e menos ações repetidas.',
  },
  NOT_AT_SUPPLY: {
    message: 'Não há recursos para coletar aqui.',
    hint: 'Leve o robô até o reservatório ou até o depósito de sementes antes de coletar.',
  },
  NOT_SOIL: {
    message: 'Esta ação só funciona sobre um canteiro de terra.',
    hint: 'Mova o robô até um canteiro antes de executar a ação.',
  },
  WATER_WASTED: {
    message: 'O robô regou um solo que já estava molhado.',
    hint: 'Use o sensor "o solo está seco?" antes de regar para não desperdiçar água.',
  },
  STEP_LIMIT: {
    message: 'O programa executou passos demais e foi interrompido.',
    hint: 'Seu laço parece não terminar. Confira a condição de parada.',
  },
  INVALID_PROGRAM: {
    message: 'O programa tem um bloco que não pode ser executado.',
    hint: 'Confira se todos os procedimentos chamados existem.',
  },
}

export function createGameError(code: ErrorCode, overrides?: Partial<Record<ErrorCode, string>>): GameError {
  return {
    code,
    message: ERROR_TEXT[code].message,
    hint: overrides?.[code] ?? ERROR_TEXT[code].hint,
  }
}
