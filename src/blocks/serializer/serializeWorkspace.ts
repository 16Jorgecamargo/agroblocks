import type { CompareOp, Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { ACTION_BLOCKS, BLOCK_LABELS, SENSOR_BLOCKS } from '@/blocks/blockTypes'
import type { BlockJson, WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export interface SerializeIssue {
  blockId: string | null
  message: string
}

export type SerializeResult =
  | { ok: true; program: Program; blockCount: number; warnings: SerializeIssue[]; looseBlockIds: string[] }
  | { ok: false; errors: SerializeIssue[]; looseBlockIds: string[] }

interface CallRef {
  name: string
  blockId: string
  owner: string | null
}

const COMPARE_OPS: CompareOp[] = ['EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE']

function child(block: BlockJson, input: string): { block: BlockJson; shadow: boolean } | undefined {
  const slot = block.inputs?.[input]
  if (slot?.block) return { block: slot.block, shadow: false }
  if (slot?.shadow) return { block: slot.shadow, shadow: true }
  return undefined
}

function isDisabled(block: BlockJson): boolean {
  return block.enabled === false || (block.disabledReasons?.length ?? 0) > 0
}

function labelOf(block: BlockJson): string {
  return BLOCK_LABELS[block.type] ?? block.type
}

class Reader {
  errors: SerializeIssue[] = []
  blockCount = 0
  readVariables = new Set<string>()
  setVariables = new Set<string>()
  calls: CallRef[] = []
  owner: string | null = null

  constructor(private readonly variableNames: Map<string, string>) {}

  statements(first: BlockJson | undefined): Stmt[] {
    const result: Stmt[] = []
    let current = first
    while (current) {
      if (!isDisabled(current)) {
        const stmt = this.statement(current)
        if (stmt) result.push(stmt)
      }
      current = current.next?.block
    }
    return result
  }

  private statement(block: BlockJson): Stmt | null {
    this.blockCount += 1
    const blockId = block.id
    const action = ACTION_BLOCKS[block.type]
    if (action) return { kind: 'action', action, blockId }
    switch (block.type) {
      case 'controls_repeat_ext':
        return {
          kind: 'repeat',
          times: this.input(block, 'TIMES', 'número de repetições'),
          body: this.statements(child(block, 'DO')?.block),
          blockId,
        }
      case 'controls_whileUntil': {
        const cond = this.input(block, 'BOOL', 'condição')
        return {
          kind: 'while',
          cond: block.fields?.MODE === 'UNTIL' ? { kind: 'not', value: cond } : cond,
          body: this.statements(child(block, 'DO')?.block),
          blockId,
        }
      }
      case 'controls_if':
        return this.ifChain(block, 0)
      case 'variables_set': {
        const name = this.variableName(block)
        this.setVariables.add(name)
        return { kind: 'setVar', name, value: this.input(block, 'VALUE', 'valor'), blockId }
      }
      case 'math_change': {
        const name = this.variableName(block)
        this.setVariables.add(name)
        return { kind: 'changeVar', name, delta: this.input(block, 'DELTA', 'valor'), blockId }
      }
      case 'procedures_callnoreturn': {
        const name = String(block.extraState?.name ?? '')
        this.calls.push({ name, blockId, owner: this.owner })
        return { kind: 'call', name, blockId }
      }
      default:
        this.errors.push({ blockId, message: `O bloco "${labelOf(block)}" não pode ser usado como comando.` })
        return null
    }
  }

  private ifChain(block: BlockJson, index: number): Stmt {
    const elseIfCount = Number(block.extraState?.elseIfCount ?? 0)
    const hasElse = Boolean(block.extraState?.hasElse)
    const cond = this.input(block, `IF${index}`, 'condição')
    const then = this.statements(child(block, `DO${index}`)?.block)
    if (index < elseIfCount) return { kind: 'if', cond, then, else: [this.ifChain(block, index + 1)], blockId: block.id }
    if (hasElse) return { kind: 'if', cond, then, else: this.statements(child(block, 'ELSE')?.block), blockId: block.id }
    return { kind: 'if', cond, then, blockId: block.id }
  }

  private input(owner: BlockJson, inputName: string, label: string): Expr {
    const found = child(owner, inputName)
    if (!found || isDisabled(found.block)) {
      this.errors.push({ blockId: owner.id, message: `O bloco "${labelOf(owner)}" está sem ${label}.` })
      return { kind: 'boolean', value: false }
    }
    if (!found.shadow) this.blockCount += 1
    return this.expression(found.block)
  }

  private expression(block: BlockJson): Expr {
    const sensor = SENSOR_BLOCKS[block.type]
    if (sensor) return { kind: 'sensor', sensor, blockId: block.id }
    switch (block.type) {
      case 'math_number':
        return { kind: 'number', value: Number(block.fields?.NUM ?? 0) }
      case 'logic_boolean':
        return { kind: 'boolean', value: block.fields?.BOOL === 'TRUE' }
      case 'variables_get': {
        const name = this.variableName(block)
        this.readVariables.add(name)
        return { kind: 'var', name }
      }
      case 'logic_compare': {
        const op = COMPARE_OPS.find((candidate) => candidate === block.fields?.OP) ?? 'EQ'
        return {
          kind: 'compare',
          op,
          left: this.input(block, 'A', 'valor da esquerda'),
          right: this.input(block, 'B', 'valor da direita'),
        }
      }
      case 'logic_operation':
        return {
          kind: 'logic',
          op: block.fields?.OP === 'OR' ? 'OR' : 'AND',
          left: this.input(block, 'A', 'condição da esquerda'),
          right: this.input(block, 'B', 'condição da direita'),
        }
      case 'logic_negate':
        return { kind: 'not', value: this.input(block, 'BOOL', 'condição') }
      case 'math_arithmetic': {
        const op = block.fields?.OP
        if (op !== 'ADD' && op !== 'MINUS') {
          this.errors.push({ blockId: block.id, message: 'Use apenas soma ou subtração no bloco de conta.' })
        }
        return {
          kind: 'arith',
          op: op === 'MINUS' ? 'MINUS' : 'ADD',
          left: this.input(block, 'A', 'primeiro valor'),
          right: this.input(block, 'B', 'segundo valor'),
        }
      }
      default:
        this.errors.push({ blockId: block.id, message: `O bloco "${labelOf(block)}" não pode ser usado como valor.` })
        return { kind: 'boolean', value: false }
    }
  }

  private variableName(block: BlockJson): string {
    const reference = block.fields?.VAR as { id?: string; name?: string } | undefined
    return this.variableNames.get(reference?.id ?? '') ?? reference?.name ?? 'variável'
  }
}

function recursiveCalls(calls: CallRef[]): CallRef[] {
  const edges = new Map<string, Set<string>>()
  for (const call of calls) {
    if (call.owner === null) continue
    const targets = edges.get(call.owner) ?? new Set<string>()
    targets.add(call.name)
    edges.set(call.owner, targets)
  }
  const reaches = (from: string, target: string, seen: Set<string>): boolean => {
    for (const next of edges.get(from) ?? []) {
      if (next === target) return true
      if (seen.has(next)) continue
      seen.add(next)
      if (reaches(next, target, seen)) return true
    }
    return false
  }
  return calls.filter((call) => call.owner !== null && (call.name === call.owner || reaches(call.name, call.owner, new Set())))
}

export function serializeWorkspace(json: WorkspaceJson): SerializeResult {
  const topBlocks = json.blocks?.blocks ?? []
  const variableNames = new Map((json.variables ?? []).map((variable) => [variable.id, variable.name]))
  const reader = new Reader(variableNames)
  const hats = topBlocks.filter((block) => block.type === 'when_run')
  const definitions = topBlocks.filter((block) => block.type === 'procedures_defnoreturn')
  const looseBlockIds = topBlocks
    .filter((block) => block.type !== 'when_run' && block.type !== 'procedures_defnoreturn')
    .map((block) => block.id)

  if (hats.length === 0) reader.errors.push({ blockId: null, message: 'Coloque o bloco "quando executar" no programa.' })
  if (hats.length > 1) reader.errors.push({ blockId: hats[1].id, message: 'Use apenas um bloco "quando executar".' })
  if (hats[0] && isDisabled(hats[0])) {
    reader.errors.push({
      blockId: hats[0].id,
      message: 'O bloco "quando executar" está desativado. Ative-o para executar o programa.',
    })
  }

  const procedures: Record<string, Stmt[]> = {}
  for (const definition of definitions) {
    const name = String(definition.fields?.NAME ?? '').trim()
    const params = (definition.extraState?.params as unknown[] | undefined) ?? []
    if (params.length > 0) {
      reader.errors.push({ blockId: definition.id, message: 'Procedimentos com parâmetros não são suportados.' })
      continue
    }
    if (!name) {
      reader.errors.push({ blockId: definition.id, message: 'Dê um nome ao procedimento.' })
      continue
    }
    if (procedures[name]) {
      reader.errors.push({ blockId: definition.id, message: `Já existe um procedimento chamado "${name}".` })
      continue
    }
    reader.blockCount += 1
    reader.owner = name
    procedures[name] = reader.statements(child(definition, 'STACK')?.block)
  }

  reader.owner = null
  const main = hats[0] ? reader.statements(child(hats[0], 'DO')?.block) : []

  for (const call of reader.calls) {
    if (!(call.name in procedures)) {
      reader.errors.push({ blockId: call.blockId, message: `O procedimento "${call.name}" não existe.` })
    }
  }
  for (const call of recursiveCalls(reader.calls)) {
    reader.errors.push({
      blockId: call.blockId,
      message: `O procedimento "${call.owner}" chama a si mesmo. Recursão não é permitida.`,
    })
  }

  if (reader.errors.length > 0) return { ok: false, errors: reader.errors, looseBlockIds }

  const warnings: SerializeIssue[] = [
    ...[...reader.readVariables]
      .filter((name) => !reader.setVariables.has(name))
      .map((name) => ({
        blockId: null,
        message: `A variável "${name}" é usada antes de receber um valor. Ela começará valendo 0.`,
      })),
    ...looseBlockIds.map((blockId) => ({
      blockId,
      message: 'Este bloco não está conectado ao programa e será ignorado.',
    })),
  ]
  return { ok: true, program: { main, procedures }, blockCount: reader.blockCount, warnings, looseBlockIds }
}
