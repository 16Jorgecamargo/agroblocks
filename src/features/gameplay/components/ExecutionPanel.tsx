import { Icon } from '@/components/icons/Icon'
import { Toggle } from '@/components/ui/Toggle'
import { STATUS_LABELS } from '@/features/gameplay/gameplayLogic'
import { SPEEDS, type ExecutionStatus, type Speed } from '@/game/execution/types'

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

export function ExecutionPanel(props: ExecutionPanelProps) {
  const { status, speed, stepMode, actionCount, currentLabel } = props
  const running = status === 'running'
  const paused = status === 'paused'
  const speedIndex = SPEEDS.indexOf(speed)

  return (
    <section className="execution-panel" aria-labelledby="execution-title">
      <h2 id="execution-title" className="side-title">
        Execução
      </h2>
      {stepMode ? (
        <button type="button" className="button button--primary execution-panel__main" onClick={props.onStep} disabled={running}>
          <Icon name="step" /> Próximo passo
        </button>
      ) : (
        <button type="button" className="button button--primary execution-panel__main" onClick={props.onRun} disabled={running}>
          <Icon name="play" /> Executar
        </button>
      )}
      {paused ? (
        <button type="button" className="button execution-panel__secondary" onClick={props.onResume}>
          <Icon name="play" /> Continuar
        </button>
      ) : (
        <button type="button" className="button execution-panel__secondary" onClick={props.onPause} disabled={!running}>
          <Icon name="pause" /> Pausar
        </button>
      )}
      <Toggle label="Passo a passo" checked={stepMode} onChange={props.onStepModeChange} />
      <label className="execution-panel__speed">
        <span>Velocidade</span>
        <input
          type="range"
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          value={speedIndex}
          aria-label="Velocidade"
          aria-valuetext={`${speed.toLocaleString('pt-BR')}x`}
          onChange={(event) => props.onSpeedChange(SPEEDS[Number(event.target.value)])}
        />
        <output>{speed.toLocaleString('pt-BR')}x</output>
      </label>
      <div className="execution-panel__row">
        <button type="button" className="button button--ghost" onClick={props.onStop} disabled={status === 'idle'}>
          <Icon name="stop" /> Parar
        </button>
        <button type="button" className="button button--ghost" onClick={props.onReset}>
          <Icon name="reset" /> Reiniciar
        </button>
      </div>
      <dl className="execution-panel__status">
        <dt>Estado</dt>
        <dd className={`status status--${status}`}>
          <span aria-hidden="true">{STATUS_ICONS[status]}</span> {STATUS_LABELS[status]}
        </dd>
        <dt>Comandos executados</dt>
        <dd>{actionCount}</dd>
        <dt>Bloco atual</dt>
        <dd>{currentLabel}</dd>
      </dl>
    </section>
  )
}
