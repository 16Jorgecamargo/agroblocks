import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'

interface CameraRigProps {
  gridWidth: number
  gridHeight: number
  quarterTurns: number
  zoomLevel: number
  showcase: boolean
  reducedMotion: boolean
}

const DISTANCE = 24

export function CameraRig({ gridWidth, gridHeight, quarterTurns, zoomLevel, showcase, reducedMotion }: CameraRigProps) {
  const camera = useThree((three) => three.camera) as OrthographicCamera
  const size = useThree((three) => three.size)

  useEffect(() => {
    const extent = Math.max(gridWidth, gridHeight) + 5
    camera.zoom = (Math.min(size.width, size.height) / extent) * zoomLevel * 0.95
    camera.updateProjectionMatrix()
  }, [camera, size, gridWidth, gridHeight, zoomLevel])

  useFrame((three) => {
    const spin = showcase && !reducedMotion ? three.clock.elapsedTime * 0.05 : 0
    const angle = Math.PI / 4 + quarterTurns * (Math.PI / 2) + spin
    camera.position.set(Math.sin(angle) * DISTANCE, DISTANCE * 0.82, Math.cos(angle) * DISTANCE)
    camera.lookAt(0, 0, 0)
  })

  return null
}
