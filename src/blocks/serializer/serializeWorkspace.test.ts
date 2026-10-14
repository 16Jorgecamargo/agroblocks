import { serializeWorkspace } from '@/blocks/serializer/serializeWorkspace'
import { stripBlockIds } from '@/blocks/interpreter/stripBlockIds'
import type { BlockJson, WorkspaceJson } from '@/blocks/serializer/workspaceJson'

function workspace(blocks: BlockJson[], variables: WorkspaceJson['variables'] = []): WorkspaceJson {
  return { blocks: { languageVersion: 0, blocks }, variables }
}

function hat(first?: BlockJson): BlockJson {
  return { type: 'when_run', id: 'hat', inputs: first ? { DO: { block: first } } : undefined }
}

const move = (id: string, next?: BlockJson): BlockJson => ({
  type: 'robot_move_forward',
  id,
  next: next ? { block: next } : undefined,
})

describe('serializeWorkspace', () => {
  it('reads a chain of actions under the hat', () => {
    const result = serializeWorkspace(workspace([hat(move('a', move('b')))]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toEqual([
      { kind: 'action', action: 'moveForward', blockId: 'a' },
      { kind: 'action', action: 'moveForward', blockId: 'b' },
    ])
    expect(result.blockCount).toBe(2)
  })

  it('reads repeat with a shadow number without counting the shadow', () => {
    const repeat: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      inputs: { TIMES: { shadow: { type: 'math_number', id: 's', fields: { NUM: 4 } } }, DO: { block: move('m') } },
    }
    const result = serializeWorkspace(workspace([hat(repeat)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      { kind: 'repeat', times: { kind: 'number', value: 4 }, body: [{ kind: 'action', action: 'moveForward' }] },
    ])
    expect(result.blockCount).toBe(2)
  })

  it('reads if with else-if and else as a nested chain', () => {
    const sensor = (id: string, type: string): BlockJson => ({ type, id })
    const ifBlock: BlockJson = {
      type: 'controls_if',
      id: 'if',
      extraState: { elseIfCount: 1, hasElse: true },
      inputs: {
        IF0: { block: sensor('s1', 'sensor_soil_dry') },
        DO0: { block: { type: 'farm_water', id: 'w' } },
        IF1: { block: sensor('s2', 'sensor_plant_mature') },
        DO1: { block: { type: 'farm_harvest', id: 'h' } },
        ELSE: { block: move('m') },
      },
    }
    const result = serializeWorkspace(workspace([hat(ifBlock)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      {
        kind: 'if',
        cond: { kind: 'sensor', sensor: 'isSoilDry' },
        then: [{ kind: 'action', action: 'water' }],
        else: [
          {
            kind: 'if',
            cond: { kind: 'sensor', sensor: 'isPlantMature' },
            then: [{ kind: 'action', action: 'harvest' }],
            else: [{ kind: 'action', action: 'moveForward' }],
          },
        ],
      },
    ])
  })

  it('treats while UNTIL as a negated while', () => {
    const loop: BlockJson = {
      type: 'controls_whileUntil',
      id: 'w',
      fields: { MODE: 'UNTIL' },
      inputs: { BOOL: { block: { type: 'sensor_obstacle_ahead', id: 's' } }, DO: { block: move('m') } },
    }
    const result = serializeWorkspace(workspace([hat(loop)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main[0])).toMatchObject({
      kind: 'while',
      cond: { kind: 'not', value: { kind: 'sensor', sensor: 'isObstacleAhead' } },
    })
  })

  it('reads variables by id and comparisons', () => {
    const setBlock: BlockJson = {
      type: 'variables_set',
      id: 'set',
      fields: { VAR: { id: 'v1' } },
      inputs: { VALUE: { block: { type: 'math_number', id: 'n', fields: { NUM: 2 } } } },
      next: {
        block: {
          type: 'controls_if',
          id: 'if',
          inputs: {
            IF0: {
              block: {
                type: 'logic_compare',
                id: 'c',
                fields: { OP: 'LT' },
                inputs: {
                  A: { block: { type: 'variables_get', id: 'g', fields: { VAR: { id: 'v1' } } } },
                  B: { shadow: { type: 'math_number', id: 'n2', fields: { NUM: 5 } } },
                },
              },
            },
          },
        },
      },
    }
    const result = serializeWorkspace(workspace([hat(setBlock)], [{ name: 'contador', id: 'v1' }]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program.main)).toEqual([
      { kind: 'setVar', name: 'contador', value: { kind: 'number', value: 2 } },
      {
        kind: 'if',
        cond: { kind: 'compare', op: 'LT', left: { kind: 'var', name: 'contador' }, right: { kind: 'number', value: 5 } },
        then: [],
      },
    ])
    expect(result.warnings).toEqual([])
  })

  it('reads procedures and calls', () => {
    const definition: BlockJson = {
      type: 'procedures_defnoreturn',
      id: 'def',
      fields: { NAME: 'cuidar' },
      inputs: { STACK: { block: { type: 'farm_prepare_soil', id: 'p' } } },
    }
    const callBlock: BlockJson = { type: 'procedures_callnoreturn', id: 'call', extraState: { name: 'cuidar' } }
    const result = serializeWorkspace(workspace([definition, hat(callBlock)]))
    if (!result.ok) throw new Error('expected ok')
    expect(stripBlockIds(result.program)).toEqual({
      main: [{ kind: 'call', name: 'cuidar' }],
      procedures: { cuidar: [{ kind: 'action', action: 'prepareSoil' }] },
    })
    expect(result.blockCount).toBe(3)
  })

  it('fails when the hat block is missing', () => {
    const result = serializeWorkspace(workspace([move('a')]))
    expect(result).toEqual({
      ok: false,
      errors: [{ blockId: null, message: 'Coloque o bloco "quando executar" no programa.' }],
      looseBlockIds: ['a'],
    })
  })

  it('fails with the owner block id when a condition is empty', () => {
    const result = serializeWorkspace(workspace([hat({ type: 'controls_if', id: 'if' })]))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual([{ blockId: 'if', message: 'O bloco "se" está sem condição.' }])
  })

  it('fails on calls to missing procedures and on recursion', () => {
    const missing = serializeWorkspace(
      workspace([hat({ type: 'procedures_callnoreturn', id: 'c', extraState: { name: 'nada' } })]),
    )
    expect(missing.ok).toBe(false)
    const recursive = serializeWorkspace(
      workspace([
        {
          type: 'procedures_defnoreturn',
          id: 'def',
          fields: { NAME: 'a' },
          inputs: { STACK: { block: { type: 'procedures_callnoreturn', id: 'self', extraState: { name: 'a' } } } },
        },
        hat(),
      ]),
    )
    expect(recursive.ok).toBe(false)
    if (recursive.ok) return
    expect(recursive.errors[0]).toEqual({ blockId: 'self', message: 'O procedimento "a" chama a si mesmo. Recursão não é permitida.' })
  })

  it('rejects procedures with parameters', () => {
    const result = serializeWorkspace(
      workspace([{ type: 'procedures_defnoreturn', id: 'def', fields: { NAME: 'p' }, extraState: { params: [{ name: 'x' }] } }, hat()]),
    )
    expect(result.ok).toBe(false)
  })

  it('ignores loose blocks with a warning', () => {
    const result = serializeWorkspace(workspace([hat(move('a')), move('loose')]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toHaveLength(1)
    expect(result.looseBlockIds).toEqual(['loose'])
    expect(result.warnings).toContainEqual({ blockId: 'loose', message: 'Este bloco não está conectado ao programa e será ignorado.' })
  })

  it('warns about variables that are read but never set', () => {
    const loop: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      inputs: { TIMES: { block: { type: 'variables_get', id: 'g', fields: { VAR: { id: 'v' } } } } },
    }
    const result = serializeWorkspace(workspace([hat(loop)], [{ name: 'n', id: 'v' }]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.warnings[0].message).toBe('A variável "n" é usada antes de receber um valor. Ela começará valendo 0.')
  })

  it('skips blocks disabled from the context menu, including their contents', () => {
    const disabledLoop: BlockJson = {
      type: 'controls_repeat_ext',
      id: 'r',
      disabledReasons: ['MANUALLY_DISABLED'],
      inputs: { TIMES: { shadow: { type: 'math_number', id: 'n', fields: { NUM: 3 } } }, DO: { block: move('inside') } },
      next: { block: { type: 'robot_turn_left', id: 't', enabled: false, next: { block: move('after') } } },
    }
    const result = serializeWorkspace(workspace([hat(disabledLoop)]))
    if (!result.ok) throw new Error('expected ok')
    expect(result.program.main).toEqual([{ kind: 'action', action: 'moveForward', blockId: 'after' }])
    expect(result.blockCount).toBe(1)
  })

  it('does not run a program whose hat block was disabled', () => {
    const result = serializeWorkspace(workspace([{ ...hat(move('a')), disabledReasons: ['MANUALLY_DISABLED'] }]))
    expect(result).toEqual({
      ok: false,
      errors: [{ blockId: 'hat', message: 'O bloco "quando executar" está desativado. Ative-o para executar o programa.' }],
      looseBlockIds: [],
    })
  })

  it('treats a disabled condition block as a missing condition', () => {
    const ifBlock: BlockJson = {
      type: 'controls_if',
      id: 'if',
      inputs: { IF0: { block: { type: 'sensor_soil_dry', id: 's', enabled: false } }, DO0: { block: move('m') } },
    }
    const result = serializeWorkspace(workspace([hat(ifBlock)]))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual([{ blockId: 'if', message: 'O bloco "se" está sem condição.' }])
  })

  it('rejects a duplicated hat block pasted by the student', () => {
    const result = serializeWorkspace(workspace([hat(move('a')), { type: 'when_run', id: 'hat-2' }]))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContainEqual({ blockId: 'hat-2', message: 'Use apenas um bloco "quando executar".' })
  })

  it('accepts an empty program', () => {
    const result = serializeWorkspace(workspace([hat()]))
    expect(result.ok && result.program.main).toEqual([])
  })
})
