import { Suspense, useEffect, useMemo } from 'react'
import { animate } from 'motion'
import { Box3, Vector3, type Mesh, type Object3D } from 'three'
import { DURATIONS } from '@/motion/presets'
import { modelEntry, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import { spinAxis, type Axis } from '@/render/world/spin'
import type { PropItem } from '@/render/world/worldTypes'

const BLADE_PATTERN = /blade|wing|fan|propel|rotor|sail|wheel/i

function findBlades(root: Object3D): Object3D | null {
  let found: Object3D | null = null
  root.traverse((child) => {
    if (!found && child !== root && BLADE_PATTERN.test(child.name)) found = child
  })
  return found
}

function bladeAxis(blades: Object3D): Axis {
  const box = new Box3()
  blades.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    mesh.geometry.computeBoundingBox()
    if (mesh.geometry.boundingBox) box.union(mesh.geometry.boundingBox)
  })
  const size = box.getSize(new Vector3())
  return spinAxis([size.x, size.y, size.z])
}

function SpinningBody({ entry, prop, active }: { entry: ModelEntry; prop: PropItem; active: boolean }) {
  const object = useClonedScene(entry)
  const blades = useMemo(() => findBlades(object), [object])
  useEffect(() => {
    if (!blades || !active) return
    const axis = bladeAxis(blades)
    const start = blades.rotation[axis]
    const controls = animate(blades.rotation, { [axis]: [start, start - Math.PI * 2] }, { duration: DURATIONS.windmill, repeat: Infinity, ease: 'linear' })
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
