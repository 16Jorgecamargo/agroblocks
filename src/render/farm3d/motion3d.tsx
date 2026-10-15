import { useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'
import { DURATIONS } from '@/motion/presets'

export function SpringIn({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    const group = ref.current
    if (!group) return
    if (!enabled) {
      group.scale.setScalar(1)
      return
    }
    group.scale.setScalar(0.2)
    const controls = animate(group.scale, { x: 1, y: 1, z: 1 }, SPRINGS.bounce)
    return () => controls.stop()
  }, [enabled])
  return <group ref={ref}>{children}</group>
}

export function Sway({ enabled, seed, children }: { enabled: boolean; seed: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    const group = ref.current
    if (!group || !enabled) return
    const amplitude = 0.025 + (seed % 3) * 0.008
    const controls = animate(
      group.rotation,
      { z: [0, amplitude, -amplitude, 0] },
      { duration: DURATIONS.sway + (seed % 5) * DURATIONS.swayVariance, repeat: Infinity, ease: EASINGS.easeInOutSine, delay: (seed % 7) * 0.3 },
    )
    return () => controls.stop()
  }, [enabled, seed])
  return <group ref={ref}>{children}</group>
}
