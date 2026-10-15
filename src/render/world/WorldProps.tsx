import { useMemo } from 'react'
import type { ModelId } from '@/render/models/manifest'
import { InstancedModel } from '@/render/world/InstancedModel'
import { LilyPads } from '@/render/world/LilyPads'
import { groupProps } from '@/render/world/instancing'
import { SpinningProp } from '@/render/world/SpinningProp'
import { isClutter } from '@/render/world/worldCatalog'
import type { World } from '@/render/world/worldTypes'

const SPINNING: ReadonlySet<ModelId> = new Set<ModelId>(['windmill', 'tower-windmill'])
const INDIVIDUAL: ReadonlySet<ModelId> = new Set<ModelId>([...SPINNING, 'lily'])

export function WorldProps({ world, shadows, ambient }: { world: World; shadows: boolean; ambient: boolean }) {
  const groups = useMemo(() => groupProps(world.props.filter((prop) => !INDIVIDUAL.has(prop.model))), [world])
  const spinning = useMemo(() => world.props.filter((prop) => SPINNING.has(prop.model)), [world])
  const lilies = useMemo(() => world.props.filter((prop) => prop.model === 'lily'), [world])
  return (
    <group>
      {[...groups.entries()].map(([id, props]) => (
        <InstancedModel key={id} id={id} props={props} shadows={shadows && !isClutter(id)} />
      ))}
      {spinning.map((prop, index) => (
        <SpinningProp key={`${prop.model}-${index}`} prop={prop} active={ambient} />
      ))}
      <LilyPads lilies={lilies} active={ambient} />
    </group>
  )
}
