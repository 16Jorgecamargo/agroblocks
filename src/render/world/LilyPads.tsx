import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { InstancedModel } from '@/render/world/InstancedModel'
import type { PropItem } from '@/render/world/worldTypes'

const WATER_LEVEL = 0.03
const BOB = 0.025

function BobbingLilies({ lilies }: { lilies: PropItem[] }) {
  const group = useRef<Group>(null)
  useEffect(() => {
    const target = group.current
    if (!target) return
    const controls = animate(target.position, { y: [WATER_LEVEL, WATER_LEVEL + BOB, WATER_LEVEL] }, { duration: DURATIONS.lilyBob, repeat: Infinity, ease: EASINGS.easeInOutSine })
    return () => controls.stop()
  }, [])
  return (
    <group ref={group} position={[0, WATER_LEVEL, 0]}>
      <InstancedModel id="lily" props={lilies} shadows={false} />
    </group>
  )
}

export function LilyPads({ lilies, active }: { lilies: PropItem[]; active: boolean }) {
  if (lilies.length === 0) return null
  if (!active) {
    return (
      <group position={[0, WATER_LEVEL, 0]}>
        <InstancedModel id="lily" props={lilies} shadows={false} />
      </group>
    )
  }
  return <BobbingLilies lilies={lilies} />
}
