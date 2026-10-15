import { useEffect, type CSSProperties } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { GameToggle } from '@/components/game/GameToggle'
import { Icon, type IconName } from '@/components/icons/Icon'
import { STATUS_LABELS } from '@/features/gameplay/gameplayLogic'
import { SPEEDS, type ExecutionStatus, type Speed } from '@/game/execution/types'
import { BADGE_POP, DURATIONS, ERROR_SHAKE, snapIn } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'

interface ExecutionPanelProps {
  status: ExecutionStatus
  speed: Speed
  stepMode: boolean
  actionCount: number
  currentLabel: string
  onRun: () => void
  onStep: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onSpeedChange: (speed: Speed) => void
  onStepModeChange: (enabled: boolean) => void
}

const STATUS_ICONS: Record<ExecutionStatus, string> = {
  idle: '●',
  running: '▶',
  paused: '❚❚',
  finished: '✓',
  failed: '✕',
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
  const { status, speed, stepMode, actionCount, currentLabel } = props
  const running = status === 'running'
  const paused = status === 'paused'
  const [scope, animatePanel] = useAnimate<HTMLElement>()

  useEffect(() => {
    if (status === 'failed' && scope.current) animatePanel(scope.current, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
  }, [status, animatePanel, scope])

  return (
    <section ref={scope} className="execution-panel" aria-labelledby="execution-title">
      <h2 id="execution-title" className="side-title">
        Execução
      </h2>
      <GameButton tone="primary" size="lg" className="execution-panel__main" onClick={stepMode ? props.onStep : props.onRun} disabled={running}>
        <SwapIcon name={stepMode ? 'step' : 'play'} />
        {stepMode ? 'Próximo passo' : 'Executar'}
      </GameButton>
      <GameButton tone="secondary" className="execution-panel__secondary" onClick={paused ? props.onResume : props.onPause} disabled={!running && !paused}>
        <SwapIcon name={paused ? 'play' : 'pause'} />
        {paused ? 'Continuar' : 'Pausar'}
      </GameButton>
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
      <div className="execution-panel__row">
        <GameButton tone="secondary" icon="stop" onClick={props.onStop} disabled={status === 'idle'}>
          Parar
        </GameButton>
        <GameButton tone="secondary" icon="reset" onClick={props.onReset}>
          Reiniciar
        </GameButton>
      </div>
      <dl className="execution-panel__status">
        <dt>Estado</dt>
        <dd className={`status status--${status}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status} variants={snapIn} initial="hidden" animate="visible" exit="exit">
              <span aria-hidden="true">{STATUS_ICONS[status]}</span> {STATUS_LABELS[status]}
            </motion.span>
          </AnimatePresence>
        </dd>
        <dt>Comandos executados</dt>
        <dd>{actionCount}</dd>
        <dt>Bloco atual</dt>
        <dd>{currentLabel}</dd>
      </dl>
    </section>
  )
}
