import type { CSSProperties } from 'react'
import type { ReplicaPart, ReplicaState } from '@/features/tutorial/howto/howtoTypes'
import {
  CATEGORY_POINTS,
  farmCellAt,
  FLYOUT_LABELS,
  flyoutBlockAt,
  HAT_POINT,
  HINT_BUTTON_POINT,
  KEY_POINT,
  PLANT_CELL,
  ROCK_CELL,
  RUN_POINT,
  stackBlockAt,
  STEP_TOGGLE_POINT,
  TAB_POINTS,
  toPercent,
  TRASH_POINT,
} from '@/features/tutorial/howto/replicaLayout'
import type { SideTab } from '@/features/tutorial/tutorialTypes'

const TAB_LABELS: Record<SideTab, string> = { console: 'Console', hints: 'Dicas', pseudocode: 'Pseudocódigo' }

function tone(label: string): string {
  return label === 'colher planta' ? 'farm' : 'movement'
}

function at(point: { x: number; y: number }): CSSProperties {
  return toPercent(point)
}

export function Replica({ parts, state }: { parts: ReplicaPart[]; state: ReplicaState }) {
  const show = new Set(parts)
  return (
    <div className="replica" aria-hidden="true">
      {show.has('toolbox') && (
        <>
          <div className="replica__toolbox" />
          <span className="replica__category replica__category--movement" style={at(CATEGORY_POINTS.movement)}>
            Movimento
          </span>
          <span className="replica__category replica__category--farm" style={at(CATEGORY_POINTS.farm)}>
            Agricultura
          </span>
          {state.toolboxOpen && (
            <div className="replica__flyout">
              {FLYOUT_LABELS.map((label, index) => (
                <span key={label} className={`replica__block replica__block--${tone(label)}`} style={at(flyoutBlockAt(index))}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      {show.has('workspace') && (
        <>
          <span className="replica__block replica__block--hat" style={at(HAT_POINT)}>
            quando executar
          </span>
          {state.stack.map((label, index) => (
            <span
              key={`${index}-${label}`}
              className={`replica__block replica__block--${tone(label)}${state.selected === index ? ' is-selected' : ''}${state.highlight === index ? ' is-running' : ''}`}
              style={at(stackBlockAt(index))}
            >
              {label}
            </span>
          ))}
        </>
      )}
      {show.has('trash') && (
        <span className={`replica__trash${state.trashOpen ? ' is-open' : ''}`} style={at(TRASH_POINT)}>
          <span className="replica__trash-lid" />
          <span className="replica__trash-can" />
        </span>
      )}
      {show.has('key') && (
        <span className={`replica__key${state.keyDown ? ' is-down' : ''}`} style={at(KEY_POINT)}>
          Delete
        </span>
      )}
      {show.has('run') && (
        <>
          <span className={`replica__run replica__run--${state.run === 'running' ? 'stop' : 'go'}`} style={at(RUN_POINT)}>
            {state.run === 'running' ? 'Parar' : state.stepMode ? 'Próximo' : 'Executar'}
          </span>
          <span className={`replica__toggle${state.stepMode ? ' is-on' : ''}`} style={at(STEP_TOGGLE_POINT)}>
            <span className="replica__toggle-label">Passo a passo</span>
            <span className="replica__toggle-track" />
          </span>
        </>
      )}
      {show.has('side') && (
        <div className="replica__side">
          {(Object.keys(TAB_POINTS) as SideTab[]).map((tab) => (
            <span key={tab} className={`replica__tab${state.tab === tab ? ' is-active' : ''}`} style={at(TAB_POINTS[tab])}>
              {TAB_LABELS[tab]}
            </span>
          ))}
          <div className="replica__panel">
            {state.tab === 'console' && (state.consoleLines.length ? state.consoleLines : ['Pronto para executar.']).map((line) => <p key={line} className={state.consoleLines.length ? 'is-error' : ''}>{line}</p>)}
            {state.tab === 'pseudocode' && <pre>{['quando executar:', ...state.stack.map((label) => `    ${label}`)].join('\n')}</pre>}
            {state.tab === 'hints' && state.hintsShown > 0 && <p className="is-hint">Conte quantas casas há até a planta.</p>}
          </div>
          {state.tab === 'hints' && (
            <span className="replica__hint-button" style={at(HINT_BUTTON_POINT)}>
              Pedir dica
            </span>
          )}
        </div>
      )}
      {show.has('farm') && (
        <div className="replica__farm">
          {[0, 1, 2, 3, 4].map((cell) => (
            <span key={cell} className="replica__cell" style={at(farmCellAt(cell))}>
              {cell === PLANT_CELL && !state.harvested && <span className="replica__plant" />}
              {cell === ROCK_CELL && <span className="replica__rock" />}
            </span>
          ))}
          <span className={`replica__robot${state.robotHit ? ' is-hit' : ''}`} style={at(farmCellAt(state.robotCell))}>
            <span className="replica__robot-eyes">{state.robotHit ? '× ×' : '● ●'}</span>
          </span>
        </div>
      )}
    </div>
  )
}
