import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { animate } from 'motion'
import { useMotionValue } from 'motion/react'
import type { OrthographicCamera } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'

interface CameraRigProps {
  gridWidth: number
  gridHeight: number
  quarterTurns: number
  zoomLevel: number
  showcase: boolean
  reducedMotion: boolean
  kickKey?: number
}

const DISTANCE = 24

function baseAngle(quarterTurns: number): number {
  return Math.PI / 4 + quarterTurns * (Math.PI / 2)
}

export function CameraRig({ gridWidth, gridHeight, quarterTurns, zoomLevel, showcase, reducedMotion, kickKey = 0 }: CameraRigProps) {
  const camera = useThree((three) => three.camera) as OrthographicCamera
  const size = useThree((three) => three.size)
  const angle = useMotionValue(baseAngle(quarterTurns))
  const zoom = useMotionValue(zoomLevel)
  const dolly = useMotionValue(reducedMotion ? 1 : 0.75)
  const kick = useMotionValue(0)

  useEffect(() => {
    const controls = animate(angle, baseAngle(quarterTurns), reducedMotion ? { duration: 0 } : SPRINGS.smooth)
    return () => controls.stop()
  }, [quarterTurns, reducedMotion, angle])

  useEffect(() => {
    const controls = animate(zoom, zoomLevel, reducedMotion ? { duration: 0 } : SPRINGS.smooth)
    return () => controls.stop()
  }, [zoomLevel, reducedMotion, zoom])

  useEffect(() => {
    if (reducedMotion) {
      dolly.set(1)
      return
    }
    const controls = animate(dolly, 1, { duration: 1.4, ease: EASINGS.easeOutCubic })
    return () => controls.stop()
  }, [reducedMotion, dolly])

  useEffect(() => {
    if (!kickKey || reducedMotion) return
    const controls = animate(kick, [0, 0.35, -0.25, 0.1, 0], { duration: 0.5, ease: EASINGS.easeOutExpo })
    return () => controls.stop()
  }, [kickKey, reducedMotion, kick])

  useFrame((three) => {
    const spin = showcase && !reducedMotion ? three.clock.elapsedTime * 0.05 : 0
    const current = angle.get() + spin
    const extent = Math.max(gridWidth, gridHeight) + 5
    camera.zoom = (Math.min(size.width, size.height) / extent) * zoom.get() * 0.95 * dolly.get()
    camera.updateProjectionMatrix()
    camera.position.set(Math.sin(current) * DISTANCE + kick.get(), DISTANCE * 0.82, Math.cos(current) * DISTANCE)
    camera.lookAt(kick.get() * 0.5, 0, 0)
  })

  return null
}
