import * as Blockly from 'blockly'
import { DEFAULT_WORKSPACE_JSON, WHEN_RUN_ID, type WorkspaceJson } from '@/blocks/serializer/workspaceJson'

export function loadWorkspaceSafely(workspace: Blockly.Workspace, json: WorkspaceJson | null): boolean {
  let loaded = true
  Blockly.Events.disable()
  try {
    try {
      Blockly.serialization.workspaces.load((json ?? DEFAULT_WORKSPACE_JSON) as object, workspace)
    } catch {
      loaded = false
      workspace.clear()
      Blockly.serialization.workspaces.load(DEFAULT_WORKSPACE_JSON as object, workspace)
    }
    if (workspace.getBlocksByType('when_run', false).length === 0) {
      Blockly.serialization.blocks.append({ type: 'when_run', id: WHEN_RUN_ID, x: 40, y: 40, deletable: false }, workspace)
    }
  } finally {
    Blockly.Events.enable()
  }
  return loaded && json !== null
}
