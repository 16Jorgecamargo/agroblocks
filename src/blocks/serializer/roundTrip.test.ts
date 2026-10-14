import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import { serializeWorkspace } from '@/blocks/serializer/serializeWorkspace'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { stripBlockIds } from '@/blocks/interpreter/stripBlockIds'
import {
  act,
  and,
  arith,
  bool,
  call,
  changeVar,
  compare,
  ifThen,
  not,
  program,
  repeat,
  sensor,
  setVar,
  variable,
  whileDo,
} from '@/blocks/interpreter/programBuilder'

const sample = program(
  [
    setVar('agua', 3),
    repeat(2, [call('cuidar'), act('moveForward')]),
    whileDo(not(sensor('isObstacleAhead')), [
      ifThen(and(sensor('isSoilDry'), compare('GT', variable('agua'), 0)), [act('water'), changeVar('agua', -1)], [act('turnLeft')]),
      act('moveForward'),
    ]),
    ifThen(bool(true), [repeat(arith('ADD', variable('agua'), 1), [act('harvest')])]),
  ],
  { cuidar: [act('prepareSoil'), act('plant')] },
)

describe('program ↔ workspace JSON', () => {
  it('round-trips through the pure serializer', () => {
    const result = serializeWorkspace(programToWorkspaceJson(sample))
    if (!result.ok) throw new Error(JSON.stringify(result.errors))
    expect(stripBlockIds(result.program)).toEqual(stripBlockIds(sample))
  })

  it('round-trips through a real headless Blockly workspace', () => {
    defineCustomBlocks()
    const workspace = new Blockly.Workspace()
    Blockly.serialization.workspaces.load(programToWorkspaceJson(sample) as object, workspace)
    const saved = Blockly.serialization.workspaces.save(workspace) as WorkspaceJson
    workspace.dispose()
    const result = serializeWorkspace(saved)
    if (!result.ok) throw new Error(JSON.stringify(result.errors))
    expect(stripBlockIds(result.program)).toEqual(stripBlockIds(sample))
  })

  it('marks the generated hat as not deletable', () => {
    const json = programToWorkspaceJson(program([]))
    expect(json.blocks?.blocks.find((block) => block.type === 'when_run')?.deletable).toBe(false)
  })
})
