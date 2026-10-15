import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { registerCellLocator } from '@/render/cellLocator'
import { cellToWorld } from '@/render/sceneLayout'

export function CellLocatorBridge({ width, height }: { width: number; height: number }) {
  const camera = useThree((three) => three.camera)
  const canvas = useThree((three) => three.gl.domElement)
  const point = useMemo(() => new Vector3(), [])

  useEffect(() => {
    return registerCellLocator((x, y) => {
      const world = cellToWorld(x, y, width, height)
      point.set(world.x, 0.4, world.z).project(camera)
      const rect = canvas.getBoundingClientRect()
      return { x: rect.left + ((point.x + 1) / 2) * rect.width, y: rect.top + ((1 - point.y) / 2) * rect.height }
    })
  }, [camera, canvas, point, width, height])

  return null
}
