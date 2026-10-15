import { Animal } from '@/render/world/Animal'
import type { AnimalSpawn } from '@/render/world/worldTypes'

export function Herd({ animals, active }: { animals: AnimalSpawn[]; active: boolean }) {
  return (
    <group>
      {animals.map((spawn) => (
        <Animal key={spawn.id} spawn={spawn} active={active} />
      ))}
    </group>
  )
}
