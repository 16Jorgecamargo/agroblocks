import { lazy, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import type { CellRef } from '@/game/missions/goals'
import type { GameEvent, GameState } from '@/game/world/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { describeRobot } from '@/render/cellDescription'
import { LegendDialog } from '@/features/legend/LegendDialog'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { hasWebGL } from '@/render/hasWebGL'
import { SceneWithSplash } from '@/render/SceneWithSplash'
import { EASINGS } from '@/motion/easings'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useSettingsStore } from '@/stores/settingsStore'
import './FarmView.css'
import { DURATIONS, PRESSABLE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

export interface FarmSceneProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
  growTicks: number
  celebrating: boolean
  quarterTurns: number
  zoomLevel: number
  lowGraphics: boolean
  reducedMotion: boolean
  showcase?: boolean
  onReady?: () => void
}

interface FarmViewProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
  growTicks: number
  celebrating?: boolean
}

const ZOOM_LEVELS = [0.7, 0.85, 1, 1.25, 1.5]

type ToolButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & { wide?: boolean; children: ReactNode }

function ToolButton({ wide = false, children, ...rest }: ToolButtonProps) {
  return (
    <motion.button type="button" className={`farm-view__tool${wide ? ' farm-view__tool--wide' : ''}`} data-pressable="true" {...PRESSABLE} {...rest}>
      {children}
    </motion.button>
  )
}

export function FarmView(props: FarmViewProps) {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const { decorative } = useMotionPrefs()
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
            <ToolButton onClick={() => setQuarterTurns((turns) => turns - 1)} aria-label="Girar câmera para a esquerda">
              <motion.span data-turns={quarterTurns} className="farm-view__glyph" animate={{ rotate: quarterTurns * 90 }} transition={SPRINGS.snap}>
                ↺
              </motion.span>
            </ToolButton>
            <ToolButton onClick={() => setQuarterTurns((turns) => turns + 1)} aria-label="Girar câmera para a direita">
              <motion.span data-turns={quarterTurns} className="farm-view__glyph" animate={{ rotate: quarterTurns * 90 }} transition={SPRINGS.snap}>
                ↻
              </motion.span>
            </ToolButton>
            <ToolButton onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} aria-label="Afastar câmera" disabled={zoomIndex === 0}>
              −
            </ToolButton>
            <ToolButton onClick={() => setZoomIndex((index) => Math.min(ZOOM_LEVELS.length - 1, index + 1))} aria-label="Aproximar câmera" disabled={zoomIndex === ZOOM_LEVELS.length - 1}>
              +
            </ToolButton>
          </>
        )}
        <ToolButton wide aria-haspopup="dialog" onClick={() => setShowLegend(true)}>
          Legenda
        </ToolButton>
      </div>

      {missingWebgl && (
        <p className="farm-view__notice" role="note">
          A visualização 3D não está disponível neste navegador. Mostrando a fazenda em 2D.
        </p>
      )}

      <div className="farm-view__stage">
        {use3d ? (
          <SceneWithSplash>
            {(onReady) => (
              <FarmScene
                {...props}
                celebrating={props.celebrating ?? false}
                quarterTurns={quarterTurns}
                zoomLevel={ZOOM_LEVELS[zoomIndex]}
                lowGraphics={lowGraphics}
                reducedMotion={reducedMotion}
                onReady={onReady}
              />
            )}
          </SceneWithSplash>
        ) : (
          <Grid2D state={props.state} highlightCells={props.highlightCells} failed={props.failed} />
        )}
      </div>
      <AnimatePresence>
        {props.failed && decorative && (
          <motion.div
            key={`damage-${props.eventKey}`}
            className="farm-view__damage"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.2, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS.damagePulse, ease: EASINGS.easeOutExpo }}
          />
        )}
      </AnimatePresence>

      <LegendDialog open={showLegend} onClose={() => setShowLegend(false)} use3d={use3d} reducedMotion={reducedMotion} />

      <p className="visually-hidden" aria-live="polite">
        {describeRobot(props.state)}
      </p>
    </section>
  )
}
