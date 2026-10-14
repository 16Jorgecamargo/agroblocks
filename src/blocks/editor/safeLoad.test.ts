import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { loadWorkspaceSafely } from '@/blocks/editor/safeLoad'
import { DEFAULT_WORKSPACE_JSON, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

describe('loadWorkspaceSafely', () => {
  beforeAll(() => defineCustomBlocks())

  it('loads a valid workspace', () => {
    const workspace = new Blockly.Workspace()
    expect(loadWorkspaceSafely(workspace, DEFAULT_WORKSPACE_JSON)).toBe(true)
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    workspace.dispose()
  })

  it('falls back to the default workspace when the saved one cannot be loaded', () => {
    const workspace = new Blockly.Workspace()
    const broken: WorkspaceJson = { blocks: { languageVersion: 0, blocks: [{ type: 'bloco_que_nao_existe', id: 'x' }] } }
    expect(loadWorkspaceSafely(workspace, broken)).toBe(false)
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    expect(workspace.getAllBlocks(false)).toHaveLength(1)
    workspace.dispose()
  })

  it('adds the hat block when a saved workspace lost it', () => {
    const workspace = new Blockly.Workspace()
    loadWorkspaceSafely(workspace, { blocks: { languageVersion: 0, blocks: [{ type: 'robot_move_forward', id: 'm' }] } })
    expect(workspace.getBlocksByType('when_run', false)).toHaveLength(1)
    workspace.dispose()
  })
})
