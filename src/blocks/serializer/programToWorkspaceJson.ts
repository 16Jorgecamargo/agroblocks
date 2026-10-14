import type { Expr, Program, Stmt } from '@/blocks/interpreter/ast'
import { BLOCK_FOR_ACTION, BLOCK_FOR_SENSOR } from '@/blocks/blockTypes'
import { WHEN_RUN_ID, type BlockJson, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export function programToWorkspaceJson(program: Program): WorkspaceJson {
  let counter = 0
  const nextId = () => {
    counter += 1
    return `gen-${counter}`
  }
  const variableIds = new Map<string, string>()
  const variableField = (name: string) => {
    const existing = variableIds.get(name)
    if (existing) return { id: existing }
    const id = `var-${variableIds.size + 1}`
    variableIds.set(name, id)
    return { id }
  }

  const expression = (expr: Expr): BlockJson => {
    switch (expr.kind) {
      case 'number':
        return { type: 'math_number', id: nextId(), fields: { NUM: expr.value } }
      case 'boolean':
        return { type: 'logic_boolean', id: nextId(), fields: { BOOL: expr.value ? 'TRUE' : 'FALSE' } }
      case 'var':
        return { type: 'variables_get', id: nextId(), fields: { VAR: variableField(expr.name) } }
      case 'sensor':
        return { type: BLOCK_FOR_SENSOR[expr.sensor], id: nextId() }
      case 'compare':
        return {
          type: 'logic_compare',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
      case 'logic':
        return {
          type: 'logic_operation',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
      case 'not':
        return { type: 'logic_negate', id: nextId(), inputs: { BOOL: { block: expression(expr.value) } } }
      case 'arith':
        return {
          type: 'math_arithmetic',
          id: nextId(),
          fields: { OP: expr.op },
          inputs: { A: { block: expression(expr.left) }, B: { block: expression(expr.right) } },
        }
    }
  }

  const chain = (stmts: Stmt[]): BlockJson | undefined => {
    const blocks = stmts.map(statement)
    for (let index = blocks.length - 2; index >= 0; index -= 1) blocks[index].next = { block: blocks[index + 1] }
    return blocks[0]
  }

  const body = (stmts: Stmt[]) => {
    const first = chain(stmts)
    return first ? { block: first } : {}
  }

  const statement = (stmt: Stmt): BlockJson => {
    switch (stmt.kind) {
      case 'action':
        return { type: BLOCK_FOR_ACTION[stmt.action], id: nextId() }
      case 'repeat':
        return {
          type: 'controls_repeat_ext',
          id: nextId(),
          inputs: { TIMES: { block: expression(stmt.times) }, DO: body(stmt.body) },
        }
      case 'while':
        return {
          type: 'controls_whileUntil',
          id: nextId(),
          fields: { MODE: 'WHILE' },
          inputs: { BOOL: { block: expression(stmt.cond) }, DO: body(stmt.body) },
        }
      case 'if':
        return stmt.else
          ? {
              type: 'controls_if',
              id: nextId(),
              extraState: { hasElse: true },
              inputs: { IF0: { block: expression(stmt.cond) }, DO0: body(stmt.then), ELSE: body(stmt.else) },
            }
          : {
              type: 'controls_if',
              id: nextId(),
              inputs: { IF0: { block: expression(stmt.cond) }, DO0: body(stmt.then) },
            }
      case 'setVar':
        return {
          type: 'variables_set',
          id: nextId(),
          fields: { VAR: variableField(stmt.name) },
          inputs: { VALUE: { block: expression(stmt.value) } },
        }
      case 'changeVar':
        return {
          type: 'math_change',
          id: nextId(),
          fields: { VAR: variableField(stmt.name) },
          inputs: { DELTA: { block: expression(stmt.delta) } },
        }
      case 'call':
        return { type: 'procedures_callnoreturn', id: nextId(), extraState: { name: stmt.name } }
    }
  }

  const procedureBlocks: BlockJson[] = Object.entries(program.procedures).map(([name, stmts], index) => ({
    type: 'procedures_defnoreturn',
    id: nextId(),
    x: 420,
    y: 40 + index * 260,
    fields: { NAME: name },
    inputs: { STACK: body(stmts) },
  }))

  const hat: BlockJson = {
    type: 'when_run',
    id: WHEN_RUN_ID,
    x: 40,
    y: 40,
    deletable: false,
    inputs: { DO: body(program.main) },
  }

  return {
    blocks: { languageVersion: 0, blocks: [...procedureBlocks, hat] },
    variables: [...variableIds].map(([name, id]) => ({ name, id })),
  }
}
