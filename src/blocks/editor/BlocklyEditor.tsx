import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { animate, type AnimationPlaybackControls } from 'motion'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { agroTheme } from '@/blocks/definitions/theme'
import { BLOCKLY_MEDIA_PATH } from '@/blocks/editor/blocklyMedia'
import { registerProcedureFlyout } from '@/blocks/toolbox/registerFlyouts'
import { registerSwatchCategory } from '@/blocks/toolbox/swatchCategory'
import type { ToolboxJson } from '@/blocks/toolbox/buildToolbox'
import { loadWorkspaceSafely } from '@/blocks/editor/safeLoad'
import { FIXED_SCALE_FLYOUT, FLYOUT_SCALE, registerFixedScaleFlyout } from '@/blocks/editor/fixedScaleFlyout'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { DURATIONS, ERROR_SHAKE, FOCUS_HALO, RUNNING_BLOCK } from '@/motion/presets'
import { EASINGS } from '@/motion/easings'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
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

function blockPath(workspace: Blockly.WorkspaceSvg, id: string): SVGElement | null {
  return workspace.getBlockById(id)?.getSvgRoot().querySelector<SVGElement>('.blocklyPath') ?? null
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
  const haloRef = useRef<AnimationPlaybackControls | null>(null)
  const { reduced } = useMotionPrefs()
  const callbacksRef = useRef({ onChange, onBlockEvent, onLoadFailed })

  useEffect(() => {
    callbacksRef.current = { onChange, onBlockEvent, onLoadFailed }
  }, [onChange, onBlockEvent, onLoadFailed])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    defineCustomBlocks()
    registerSwatchCategory()
    registerFixedScaleFlyout()
    const workspace = Blockly.inject(host, {
      toolbox,
      plugins: { flyoutsVerticalToolbox: FIXED_SCALE_FLYOUT },
      theme: agroTheme,
      media: BLOCKLY_MEDIA_PATH,
      renderer: 'zelos',
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: FLYOUT_SCALE, maxScale: 2, minScale: 0.4 },
      grid: { spacing: 24, length: 2, colour: '#d5dbe1', snap: true },
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
    const workspace = workspaceRef.current
    if (!workspace) return
    workspace.highlightBlock(highlightBlockId)
    haloRef.current?.stop()
    const root = highlightBlockId ? workspace.getBlockById(highlightBlockId)?.getSvgRoot() ?? null : null
    const path = highlightBlockId ? blockPath(workspace, highlightBlockId) : null
    root?.classList.add('agro-running-block')
    const controls: AnimationPlaybackControls[] = []
    let active = true
    if (highlightBlockId && root) {
      const startX = workspace.scrollX
      const startY = workspace.scrollY
      workspace.centerOnBlock(highlightBlockId, true)
      const endX = workspace.scrollX
      const endY = workspace.scrollY
      if (!reduced && Math.hypot(endX - startX, endY - startY) > 1) {
        workspace.scroll(startX, startY)
        controls.push(
          animate(0, 1, {
            duration: DURATIONS.blockFollow,
            ease: EASINGS.easeInOutCubic,
            onUpdate: (progress) => workspace.scroll(startX + (endX - startX) * progress, startY + (endY - startY) * progress),
          }),
        )
      }
    }
    if (path && !reduced) {
      controls.push(animate(path, RUNNING_BLOCK.march.keyframes, RUNNING_BLOCK.march.options))
      const flash = animate(path, RUNNING_BLOCK.flash.keyframes, RUNNING_BLOCK.flash.options)
      controls.push(flash)
      flash.then(() => {
        if (active) haloRef.current = animate(path, FOCUS_HALO.keyframes, FOCUS_HALO.options)
      })
    }
    return () => {
      active = false
      controls.forEach((control) => control.stop())
      haloRef.current?.stop()
      root?.classList.remove('agro-running-block')
      if (path) {
        path.style.filter = ''
        path.style.strokeDashoffset = ''
      }
    }
  }, [highlightBlockId, reduced])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    for (const block of workspace.getAllBlocks(false)) {
      block.setWarningText(null)
      block.getSvgRoot().classList.remove('agro-error-block')
    }
    if (errorBlock) {
      const block = workspace.getBlockById(errorBlock.id)
      block?.setWarningText(errorBlock.message)
      block?.getSvgRoot().classList.add('agro-error-block')
      workspace.highlightBlock(errorBlock.id)
      const path = blockPath(workspace, errorBlock.id)
      if (path && !reduced) animate(path, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
    }
  }, [errorBlock, reduced])

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
          Edição bloqueada durante a execução. Clique em Parar para editar.
        </div>
      )}
    </div>
  )
}
