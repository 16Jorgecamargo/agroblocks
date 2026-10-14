import { lazy, Suspense, useMemo } from 'react'
import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasWebGL } from '@/render/hasWebGL'
import { useSettingsStore } from '@/stores/settingsStore'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

const SHOWCASE_STATE = createInitialState({
  map: { cells: ['m g m m s', 'mw s g m g', 't tw m g m', 'g m tw s m'] },
  robot: { x: 1, y: 2, facing: 'S' },
  resources: UNLIMITED_RESOURCES,
})

export function HomeScene() {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  if (renderMode === '2d' || !webgl) return <div className="home-scene home-scene--fallback" aria-hidden="true" />
  return (
    <div className="home-scene" aria-hidden="true">
      <Suspense fallback={<div className="home-scene--fallback" />}>
        <FarmScene
          state={SHOWCASE_STATE}
          lastEvents={[]}
          eventKey={0}
          stepDurationMs={0}
          highlightCells={[]}
          failed={false}
          seedKey="home"
          quarterTurns={0}
          zoomLevel={0.75}
          lowGraphics={lowGraphics}
          reducedMotion={reducedMotion}
          showcase
        />
      </Suspense>
    </div>
  )
}
