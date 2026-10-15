import { useMemo } from 'react'
import { Animal, type Occupancy } from '@/render/world/Animal'
import type { AnimalSpawn } from '@/render/world/worldTypes'

export function Herd({ animals, active }: { animals: AnimalSpawn[]; active: boolean }) {
  const occupancy = useMemo<Occupancy>(() => new Map(), [])
  return (
    <group>
      {animals.map((spawn) => (
        <Animal key={spawn.id} spawn={spawn} active={active} occupancy={occupancy} />
      ))}
    </group>
  )
}
