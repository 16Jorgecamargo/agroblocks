import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { agroTheme } from '@/blocks/definitions/theme'
import { registerProcedureFlyout } from '@/blocks/toolbox/registerFlyouts'
import type { ToolboxJson } from '@/blocks/toolbox/buildToolbox'
import { loadWorkspaceSafely } from '@/blocks/editor/safeLoad'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import './BlocklyEditor.css'

interface BlocklyEditorProps {
  toolbox: ToolboxJson
  initialJson: WorkspaceJson | null
  readOnly: boolean
  highlightBlockId: string | null
  errorBlock: { id: string; message: string } | null
  looseBlockIds: string[]
  onChange: (json: WorkspaceJson) => void
  onBlockEvent?: (kind: 'added' | 'removed') => void
  onLoadFailed?: () => void
}

const LOOSE_CLASS = 'agro-loose-block'

function saveWorkspace(workspace: Blockly.Workspace): WorkspaceJson {
  return Blockly.serialization.workspaces.save(workspace) as WorkspaceJson
}

export function BlocklyEditor({
  toolbox,
  initialJson,
  readOnly,
  highlightBlockId,
  errorBlock,
  looseBlockIds,
  onChange,
  onBlockEvent,
  onLoadFailed,
}: BlocklyEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const callbacksRef = useRef({ onChange, onBlockEvent, onLoadFailed })

  useEffect(() => {
    callbacksRef.current = { onChange, onBlockEvent, onLoadFailed }
  }, [onChange, onBlockEvent, onLoadFailed])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    defineCustomBlocks()
    const workspace = Blockly.inject(host, {
      toolbox,
      theme: agroTheme,
      renderer: 'zelos',
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: 0.85, maxScale: 2, minScale: 0.4 },
      grid: { spacing: 24, length: 2, colour: '#dfe8d6', snap: true },
    })
    registerProcedureFlyout(workspace)
    const restored = loadWorkspaceSafely(workspace, initialJson)
    if (initialJson && !restored) callbacksRef.current.onLoadFailed?.()
    callbacksRef.current.onChange(saveWorkspace(workspace))

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent) return
      if (event.type === Blockly.Events.BLOCK_CREATE) callbacksRef.current.onBlockEvent?.('added')
      if (event.type === Blockly.Events.BLOCK_DELETE) callbacksRef.current.onBlockEvent?.('removed')
      callbacksRef.current.onChange(saveWorkspace(workspace))
    }
    workspace.addChangeListener(listener)
    const observer = new ResizeObserver(() => Blockly.svgResize(workspace))
    observer.observe(host)
    workspaceRef.current = workspace
    return () => {
      observer.disconnect()
      workspace.dispose()
      workspaceRef.current = null
    }
  }, [toolbox, initialJson])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    workspace.setIsReadOnly(readOnly)
    if (readOnly) Blockly.hideChaff()
  }, [readOnly, toolbox, initialJson])

  useEffect(() => {
    workspaceRef.current?.highlightBlock(highlightBlockId)
  }, [highlightBlockId])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    for (const block of workspace.getAllBlocks(false)) block.setWarningText(null)
    if (errorBlock) {
      const block = workspace.getBlockById(errorBlock.id)
      block?.setWarningText(errorBlock.message)
      workspace.highlightBlock(errorBlock.id)
    }
  }, [errorBlock])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    for (const block of workspace.getAllBlocks(false)) block.getSvgRoot().classList.remove(LOOSE_CLASS)
    for (const id of looseBlockIds) {
      const root = workspace.getBlockById(id)
      root?.getDescendants(false).forEach((block) => block.getSvgRoot().classList.add(LOOSE_CLASS))
    }
  }, [looseBlockIds])

  return (
    <div className="blockly-editor">
      <div ref={hostRef} className="blockly-editor__host" aria-label="Editor de blocos do programa" />
      {readOnly && (
        <div className="blockly-editor__lock" role="status">
          Edição bloqueada durante a execução. Pare ou reinicie para editar.
        </div>
      )}
    </div>
  )
}
