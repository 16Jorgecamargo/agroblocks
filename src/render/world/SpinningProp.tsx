import { Suspense, useEffect, useMemo } from 'react'
import { animate } from 'motion'
import type { Object3D } from 'three'
import { DURATIONS } from '@/motion/presets'
import { modelEntry, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import type { PropItem } from '@/render/world/worldTypes'

const BLADE_PATTERN = /blade|wing|fan|propel|rotor|sail|wheel/i

function findBlades(root: Object3D): Object3D | null {
  let found: Object3D | null = null
  root.traverse((child) => {
    if (!found && child !== root && BLADE_PATTERN.test(child.name)) found = child
  })
  return found
}

function SpinningBody({ entry, prop, active }: { entry: ModelEntry; prop: PropItem; active: boolean }) {
  const object = useClonedScene(entry)
  const blades = useMemo(() => findBlades(object), [object])
  useEffect(() => {
    if (!blades || !active) return
    const start = blades.rotation.z
    const controls = animate(blades.rotation, { z: [start, start + Math.PI * 2] }, { duration: DURATIONS.windmill, repeat: Infinity, ease: 'linear' })
    return () => controls.stop()
  }, [blades, active])
  const size = entry.scale * prop.scale
  return (
    <primitive
      object={object}
      position={[prop.x, entry.yOffset * prop.scale, prop.z]}
      rotation={[0, prop.rotation + entry.rotationY, 0]}
      scale={[size, size, size]}
    />
  )
}

export function SpinningProp({ prop, active }: { prop: PropItem; active: boolean }) {
  const entry = modelEntry(prop.model)
  if (!entry) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <SpinningBody entry={entry} prop={prop} active={active} />
      </Suspense>
    </ModelBoundary>
  )
}
