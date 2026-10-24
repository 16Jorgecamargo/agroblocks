import type { CSSProperties } from 'react'
import { MISSIONS_PER_WORLD, type WorldDefinition, type WorldId } from '@/game/worlds/worldTypes'

export type WorldProgressState = 'concluído' | 'em andamento' | 'fechado'

interface WorldDotsProps {
  worlds: WorldDefinition[]
  states: Record<WorldId, { state: WorldProgressState; completed: number }>
  current: WorldId
  onSelect: (world: WorldId) => void
}

export function WorldDots({ worlds, states, current, onSelect }: WorldDotsProps) {
  return (
    <div className="world-dots" role="group" aria-label="Mundos">
      {worlds.map((world) => {
        const { state, completed } = states[world.id]
        const active = world.id === current
        return (
          <div key={world.id} className={`world-dots__item${active ? ' is-active' : ''}`}>
            <button
              type="button"
              className={`world-dots__dot world-dots__dot--${state === 'concluído' ? 'done' : state === 'em andamento' ? 'progress' : 'locked'}`}
              style={{ '--progress': `${(completed / MISSIONS_PER_WORLD) * 100}%` } as CSSProperties}
              aria-label={`${world.name}: ${state}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(world.id)}
            />
            <span className="world-dots__name" aria-hidden="true">
              {world.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
