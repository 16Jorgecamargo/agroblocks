import { lazy, useMemo } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { DEMO_TIMING, demoFrames } from '@/features/demo/demoFrames'
import { useDemoPlayback } from '@/features/demo/useDemoPlayback'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { hasWebGL } from '@/render/hasWebGL'
import { SceneWithSplash } from '@/render/SceneWithSplash'
import { useSettingsStore } from '@/stores/settingsStore'
import './DemoDialog.css'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

const DEMO_ZOOM = 1.5

interface DemoDialogProps {
  open: boolean
  mission: MissionDefinition
  onBack: () => void
  onStart: () => void
}

function DemoStage({ mission }: { mission: MissionDefinition }) {
  const { lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  const frames = useMemo(() => demoFrames(mission), [mission])
  const { index, cycle } = useDemoPlayback(frames.length, true)
  const frame = frames[index]
  if (!frame) return null
  const eventKey = cycle * frames.length + index
  const use3d = webgl

  return (
    <div className="demo-dialog__stage" role="img" aria-label="Demonstração: o robô na fazenda" data-frame={index} data-cycle={cycle}>
      <div className="demo-dialog__scene" aria-hidden="true">
        {use3d ? (
          <SceneWithSplash label="Carregando demonstração…">
            {(onReady) => (
              <FarmScene
                state={frame.state}
                lastEvents={frame.events}
                eventKey={eventKey}
                stepDurationMs={DEMO_TIMING.stepMs * 0.8}
                highlightCells={[]}
                failed={false}
                seedKey={mission.id}
                growTicks={mission.growTicks}
                celebrating={false}
                quarterTurns={0}
                zoomLevel={DEMO_ZOOM}
                lowGraphics={lowGraphics}
                reducedMotion={reducedMotion}
                onReady={onReady}
              />
            )}
          </SceneWithSplash>
        ) : (
          <Grid2D state={frame.state} highlightCells={[]} failed={false} />
        )}
      </div>
    </div>
  )
}

export function DemoDialog({ open, mission, onBack, onStart }: DemoDialogProps) {
  return (
    <GameDialog open={open} title="Demonstração" icon="eye" tone="info" size="fixed" onClose={onBack}>
      <DialogSection className="demo-dialog__body">
        <DemoStage mission={mission} />
        <p className="demo-dialog__caption">Observe o que o robô faz. Depois monte o seu programa para cumprir a missão.</p>
      </DialogSection>
      <DialogSection className="game-dialog__actions">
        <GameButton tone="secondary" icon="back" onClick={onBack}>
          Voltar
        </GameButton>
        <GameButton tone="primary" size="lg" icon="play" onClick={onStart}>
          Começar
        </GameButton>
      </DialogSection>
    </GameDialog>
  )
}
