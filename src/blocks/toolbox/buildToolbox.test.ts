import { buildToolbox } from '@/blocks/toolbox/buildToolbox'

describe('buildToolbox', () => {
  it('includes only categories with allowed blocks', () => {
    const toolbox = buildToolbox(['robot_move_forward', 'robot_turn_left', 'farm_harvest'])
    expect(toolbox.kind).toBe('categoryToolbox')
    expect(toolbox.contents.map((category) => category.name)).toEqual(['Movimento', 'Agricultura'])
    expect(toolbox.contents[0].contents?.map((item) => item.type)).toEqual(['robot_move_forward', 'robot_turn_left'])
  })

  it('adds a shadow number to repeat blocks', () => {
    const toolbox = buildToolbox(['controls_repeat_ext'])
    expect(toolbox.contents[0].contents?.[0]).toEqual({
      kind: 'block',
      type: 'controls_repeat_ext',
      inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } } },
    })
  })

  it('offers both if and if-else when controls_if is allowed', () => {
    const items = buildToolbox(['controls_if']).contents[0].contents ?? []
    expect(items).toEqual([
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
    ])
  })

  it('uses dynamic categories for variables and procedures', () => {
    const toolbox = buildToolbox(['variables_set', 'procedures_defnoreturn'])
    expect(toolbox.contents).toEqual([
      { kind: 'category', name: 'Variáveis', categorystyle: 'variable_category', custom: 'VARIABLE' },
      { kind: 'category', name: 'Procedimentos', categorystyle: 'procedure_category', custom: 'AGRO_PROCEDURES' },
    ])
  })

  it('never lists the when_run hat in the toolbox', () => {
    const toolbox = buildToolbox(['when_run', 'robot_move_forward'])
    const types = toolbox.contents.flatMap((category) => category.contents ?? []).map((item) => item.type)
    expect(types).not.toContain('when_run')
  })
})
