import * as Blockly from 'blockly'
import * as ptBr from 'blockly/msg/pt-br'
import { BLOCK_ICONS } from '@/blocks/definitions/blockIcons'

let defined = false

function icon(src: string, alt: string) {
  return { type: 'field_image', src, width: 18, height: 18, alt }
}

function actionBlock(type: string, text: string, tooltip: string, style: string, src: string) {
  return {
    type,
    message0: `%1 ${text}`,
    args0: [icon(src, text)],
    previousStatement: null,
    nextStatement: null,
    style,
    tooltip,
  }
}

function sensorBlock(type: string, message: string, tooltip: string) {
  return { type, message0: message, output: 'Boolean', style: 'sensor_blocks', tooltip }
}

const DEFINITIONS = [
  {
    type: 'when_run',
    message0: '%1 quando executar %2 %3',
    args0: [icon(BLOCK_ICONS.play, 'executar'), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
    style: 'event_blocks',
    tooltip: 'O programa começa aqui. Encaixe os comandos dentro deste bloco.',
  },
  actionBlock('robot_move_forward', 'mover para frente', 'O robô anda uma casa na direção para onde está virado. Gasta 1 de energia.', 'movement_blocks', BLOCK_ICONS.forward),
  actionBlock('robot_turn_left', 'virar à esquerda', 'O robô gira 90° para a esquerda sem sair do lugar.', 'movement_blocks', BLOCK_ICONS.turnLeft),
  actionBlock('robot_turn_right', 'virar à direita', 'O robô gira 90° para a direita sem sair do lugar.', 'movement_blocks', BLOCK_ICONS.turnRight),
  actionBlock('farm_prepare_soil', 'preparar solo', 'Prepara o canteiro vazio ou colhido para receber sementes.', 'farm_blocks', BLOCK_ICONS.prepare),
  actionBlock('farm_plant', 'plantar semente', 'Planta uma semente no solo preparado. Gasta 1 semente.', 'farm_blocks', BLOCK_ICONS.seed),
  actionBlock('farm_water', 'regar canteiro', 'Molha o solo do canteiro. Gasta 1 de água. Plantas só crescem em solo molhado.', 'farm_blocks', BLOCK_ICONS.water),
  actionBlock('farm_harvest', 'colher planta', 'Colhe a planta do canteiro se ela estiver madura.', 'farm_blocks', BLOCK_ICONS.harvest),
  actionBlock('farm_collect', 'coletar recursos', 'No reservatório, enche a água. No depósito, repõe as sementes.', 'farm_blocks', BLOCK_ICONS.collect),
  sensorBlock('sensor_plot_empty', 'o canteiro está vazio?', 'Verdadeiro se não há planta no canteiro onde o robô está.'),
  sensorBlock('sensor_soil_dry', 'o solo está seco?', 'Verdadeiro se o solo do canteiro atual está seco.'),
  sensorBlock('sensor_plant_mature', 'a planta está madura?', 'Verdadeiro se a planta do canteiro atual pode ser colhida.'),
  sensorBlock('sensor_obstacle_ahead', 'existe obstáculo à frente?', 'Verdadeiro se há obstáculo ou borda do mapa na frente do robô.'),
  sensorBlock('sensor_has_seeds', 'há sementes disponíveis?', 'Verdadeiro se o robô ainda tem sementes.'),
]

export function defineCustomBlocks(): void {
  if (defined) return
  Blockly.setLocale(ptBr as unknown as Record<string, string>)
  Blockly.common.defineBlocksWithJsonArray(DEFINITIONS)
  defined = true
}
