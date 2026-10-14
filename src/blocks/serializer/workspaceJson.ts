export interface BlockInputJson {
  block?: BlockJson
  shadow?: BlockJson
}

export interface BlockJson {
  type: string
  id: string
  x?: number
  y?: number
  deletable?: boolean
  fields?: Record<string, unknown>
  inputs?: Record<string, BlockInputJson>
  next?: BlockInputJson
  extraState?: Record<string, unknown>
  enabled?: boolean
  disabledReasons?: string[]
}

export interface WorkspaceJson {
  blocks?: { languageVersion: number; blocks: BlockJson[] }
  variables?: { name: string; id: string; type?: string }[]
}

export const WHEN_RUN_ID = 'when-run'

export const DEFAULT_WORKSPACE_JSON: WorkspaceJson = {
  blocks: { languageVersion: 0, blocks: [{ type: 'when_run', id: WHEN_RUN_ID, x: 40, y: 40, deletable: false }] },
}
