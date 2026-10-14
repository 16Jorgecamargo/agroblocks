import type { BlockType } from '@/blocks/blockTypes'

export interface ToolboxItem {
  kind: 'block'
  type: BlockType
  inputs?: Record<string, { shadow: { type: string; fields: Record<string, unknown> } }>
  extraState?: Record<string, unknown>
}

export interface ToolboxCategory {
  kind: 'category'
  name: string
  categorystyle: string
  contents?: ToolboxItem[]
  custom?: string
}

export interface ToolboxJson {
  kind: 'categoryToolbox'
  contents: ToolboxCategory[]
}

const numberShadow = (value: number) => ({ shadow: { type: 'math_number', fields: { NUM: value } } })

const ITEMS: Partial<Record<BlockType, ToolboxItem[]>> = {
  controls_repeat_ext: [{ kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: numberShadow(3) } }],
  controls_if: [
    { kind: 'block', type: 'controls_if' },
    { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
  ],
  logic_compare: [{ kind: 'block', type: 'logic_compare', inputs: { A: numberShadow(0), B: numberShadow(0) } }],
  math_arithmetic: [{ kind: 'block', type: 'math_arithmetic', inputs: { A: numberShadow(1), B: numberShadow(1) } }],
}

const STATIC_CATEGORIES: { name: string; style: string; types: BlockType[] }[] = [
  { name: 'Movimento', style: 'movement_category', types: ['robot_move_forward', 'robot_turn_left', 'robot_turn_right'] },
  {
    name: 'Agricultura',
    style: 'farm_category',
    types: ['farm_prepare_soil', 'farm_plant', 'farm_water', 'farm_harvest', 'farm_collect'],
  },
  {
    name: 'Sensores',
    style: 'sensor_category',
    types: ['sensor_plot_empty', 'sensor_soil_dry', 'sensor_plant_mature', 'sensor_obstacle_ahead', 'sensor_has_seeds'],
  },
  {
    name: 'Controle',
    style: 'control_category',
    types: ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'],
  },
  { name: 'Números', style: 'number_category', types: ['math_number', 'math_arithmetic'] },
]

function itemsFor(type: BlockType): ToolboxItem[] {
  return ITEMS[type] ?? [{ kind: 'block', type }]
}

export function buildToolbox(allowed: readonly BlockType[]): ToolboxJson {
  const allowedSet = new Set(allowed)
  const contents: ToolboxCategory[] = STATIC_CATEGORIES.flatMap((category) => {
    const items = category.types.filter((type) => allowedSet.has(type)).flatMap(itemsFor)
    return items.length > 0 ? [{ kind: 'category' as const, name: category.name, categorystyle: category.style, contents: items }] : []
  })
  if (allowedSet.has('variables_set')) {
    contents.push({ kind: 'category', name: 'Variáveis', categorystyle: 'variable_category', custom: 'VARIABLE' })
  }
  if (allowedSet.has('procedures_defnoreturn')) {
    contents.push({ kind: 'category', name: 'Procedimentos', categorystyle: 'procedure_category', custom: 'AGRO_PROCEDURES' })
  }
  return { kind: 'categoryToolbox', contents }
}
