import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { agroTheme } from '@/blocks/definitions/theme'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import './BlockPreview.css'

export function BlockPreview({ json, label }: { json: WorkspaceJson; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    defineCustomBlocks()
    const workspace = Blockly.inject(host, {
      readOnly: true,
      theme: agroTheme,
      renderer: 'zelos',
      scrollbars: false,
      trashcan: false,
      sounds: false,
      zoom: { controls: false, wheel: false, startScale: 0.8, maxScale: 0.9, minScale: 0.3 },
    })
    try {
      Blockly.serialization.workspaces.load(json as object, workspace)
      const box = workspace.getBlocksBoundingBox()
      host.style.height = `${Math.min(420, Math.max(120, (box.bottom - box.top) * 0.8 + 48))}px`
      Blockly.svgResize(workspace)
      workspace.zoomToFit()
    } catch {
      workspace.clear()
    }
    return () => workspace.dispose()
  }, [json])

  return <div ref={hostRef} className="block-preview" role="img" aria-label={label} />
}
