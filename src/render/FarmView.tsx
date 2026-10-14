import { lazy, Suspense, useMemo, useState } from 'react'
import type { CellRef } from '@/game/missions/goals'
import type { GameEvent, GameState } from '@/game/world/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { describeRobot } from '@/render/cellDescription'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { hasWebGL } from '@/render/hasWebGL'
import { useSettingsStore } from '@/stores/settingsStore'
import './FarmView.css'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

export interface FarmSceneProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
  quarterTurns: number
  zoomLevel: number
  lowGraphics: boolean
  reducedMotion: boolean
  showcase?: boolean
}

interface FarmViewProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
}

const ZOOM_LEVELS = [0.7, 0.85, 1, 1.25, 1.5]

export function FarmView(props: FarmViewProps) {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  const [quarterTurns, setQuarterTurns] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(2)
  const [showLegend, setShowLegend] = useState(false)
  const use3d = renderMode !== '2d' && webgl
  const missingWebgl = renderMode !== '2d' && !webgl

  return (
    <section className="farm-view" aria-label="Fazenda">
      <div className="farm-view__toolbar">
        {use3d && (
          <>
            <button type="button" className="farm-view__tool" onClick={() => setQuarterTurns((turns) => turns - 1)} aria-label="Girar câmera para a esquerda">
              ↺
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setQuarterTurns((turns) => turns + 1)} aria-label="Girar câmera para a direita">
              ↻
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} aria-label="Afastar câmera" disabled={zoomIndex === 0}>
              −
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setZoomIndex((index) => Math.min(ZOOM_LEVELS.length - 1, index + 1))} aria-label="Aproximar câmera" disabled={zoomIndex === ZOOM_LEVELS.length - 1}>
              +
            </button>
          </>
        )}
        <button type="button" className="farm-view__tool farm-view__tool--wide" aria-expanded={showLegend} onClick={() => setShowLegend((value) => !value)}>
          Legenda
        </button>
      </div>

      {missingWebgl && (
        <p className="farm-view__notice" role="note">
          A visualização 3D não está disponível neste navegador. Mostrando a fazenda em 2D.
        </p>
      )}

      <div className="farm-view__stage">
        {use3d ? (
          <Suspense fallback={<div className="farm-view__loading">Carregando fazenda 3D…</div>}>
            <FarmScene
              {...props}
              quarterTurns={quarterTurns}
              zoomLevel={ZOOM_LEVELS[zoomIndex]}
              lowGraphics={lowGraphics}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        ) : (
          <Grid2D state={props.state} highlightCells={props.highlightCells} failed={props.failed} />
        )}
      </div>

      {showLegend && (
        <ul className="farm-view__legend">
          <li><span className="legend-swatch legend-swatch--untilled" />Solo sem preparo</li>
          <li><span className="legend-swatch legend-swatch--tilled" />Solo preparado (sulcos)</li>
          <li><span className="legend-swatch legend-swatch--seeded" />Semente plantada</li>
          <li><span className="legend-swatch legend-swatch--growing" />Planta em crescimento</li>
          <li><span className="legend-swatch legend-swatch--mature" />Planta madura (com frutos)</li>
          <li><span className="legend-swatch legend-swatch--wet" />Solo molhado (gota azul)</li>
          <li><span className="legend-swatch legend-swatch--obstacle" />Pedra / área bloqueada</li>
          <li><span className="legend-swatch legend-swatch--reservoir" />Reservatório de água</li>
          <li><span className="legend-swatch legend-swatch--depot" />Depósito de sementes</li>
          <li><span className="legend-swatch legend-swatch--goal" />Canteiro do objetivo</li>
        </ul>
      )}

      <p className="visually-hidden" aria-live="polite">
        {describeRobot(props.state)}
      </p>
    </section>
  )
}
