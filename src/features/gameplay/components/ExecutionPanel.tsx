import { useEffect, type CSSProperties } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { GameToggle } from '@/components/game/GameToggle'
import { Icon, type IconName } from '@/components/icons/Icon'
import { SPEEDS, type ExecutionStatus, type Speed } from '@/game/execution/types'
import { BADGE_POP, DURATIONS, ERROR_SHAKE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { EASINGS } from '@/motion/easings'

interface ExecutionPanelProps {
  status: ExecutionStatus
  speed: Speed
  stepMode: boolean
  onRun: () => void
  onStep: () => void
  onStop: () => void
  onSpeedChange: (speed: Speed) => void
  onStepModeChange: (enabled: boolean) => void
}

function SwapIcon({ name }: { name: IconName }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={name}
        className="icon-swap"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90, transition: { duration: DURATIONS.iconSwapExit } }}
        transition={SPRINGS.snap}
      >
        <Icon name={name} />
      </motion.span>
    </AnimatePresence>
  )
}

export function ExecutionPanel(props: ExecutionPanelProps) {
  const { status, speed, stepMode } = props
  const running = status === 'running'
  const active = running || status === 'paused'
  const stepping = stepMode && active
  const [scope, animatePanel] = useAnimate<HTMLElement>()

  useEffect(() => {
    if (status === 'failed' && scope.current) animatePanel(scope.current, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
  }, [status, animatePanel, scope])

  return (
    <section ref={scope} className="execution-panel" aria-labelledby="execution-title">
      <h2 id="execution-title" className="side-title">
        Execução
      </h2>
      <div className="execution-panel__actions" role={stepping ? 'group' : undefined} aria-label={stepping ? 'Controles do passo a passo' : undefined}>
        <div className="execution-panel__slot">
          {stepping ? (
            <GameButton tone="primary" size="lg" className="execution-panel__main" onClick={props.onStep} disabled={running}>
              <SwapIcon name="step" />
              Próximo
            </GameButton>
          ) : active ? (
            <GameButton tone="danger" size="lg" icon="stop" className="execution-panel__main" onClick={props.onStop}>
              Parar
            </GameButton>
          ) : (
            <GameButton tone="primary" size="lg" className="execution-panel__main" onClick={stepMode ? props.onStep : props.onRun}>
              <SwapIcon name="play" />
              Executar
            </GameButton>
          )}
        </div>
        <AnimatePresence initial={false}>
          {stepping && (
            <motion.div
              key="stop"
              className="execution-panel__slot execution-panel__slot--stop"
              initial={{ width: 0, marginLeft: 0, opacity: 0 }}
              animate={{ width: 'calc(50% - 4px)', marginLeft: 8, opacity: 1 }}
              exit={{ width: 0, marginLeft: 0, opacity: 0 }}
              transition={{ duration: DURATIONS.panelSplit, ease: EASINGS.easeOutCubic }}
            >
              <GameButton tone="danger" size="lg" icon="stop" className="execution-panel__main" onClick={props.onStop}>
                Parar
              </GameButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <GameToggle label="Passo a passo" checked={stepMode} onChange={props.onStepModeChange} />
      <label className="execution-panel__speed">
        <span>Velocidade</span>
        <input
          type="range"
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          value={SPEEDS.indexOf(speed)}
          aria-label="Velocidade"
          aria-valuetext={`${speed.toLocaleString('pt-BR')}x`}
          style={{ '--fill': `${(SPEEDS.indexOf(speed) / (SPEEDS.length - 1)) * 100}%` } as CSSProperties}
          onChange={(event) => props.onSpeedChange(SPEEDS[Number(event.target.value)])}
        />
        <motion.output key={speed} className="execution-panel__speed-value" animate={BADGE_POP.keyframes} transition={BADGE_POP.options}>
          {speed.toLocaleString('pt-BR')}x
        </motion.output>
      </label>
    </section>
  )
}
