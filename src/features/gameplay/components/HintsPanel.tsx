import { Icon } from '@/components/icons/Icon'
import { HINT_LEVEL_LABELS } from '@/features/gameplay/gameplayLogic'

interface HintsPanelProps {
  hints: [string, string, string, string]
  revealed: number
  canReveal: boolean
  failedAttempts: number
  onReveal: () => void
}

export function HintsPanel({ hints, revealed, canReveal, failedAttempts, onReveal }: HintsPanelProps) {
  const lockedLast = revealed === 3 && failedAttempts < 2
  return (
    <div className="hints-panel">
      <p className="hints-panel__intro">
        Tente primeiro sozinho. As dicas vão da ideia geral até um exemplo parcial e ficam registradas para o professor.
      </p>
      <ol className="hints-panel__list">
        {hints.slice(0, revealed).map((hint, index) => (
          <li key={index} className="hint">
            <strong>
              <Icon name="bulb" size={16} /> {HINT_LEVEL_LABELS[index]}
            </strong>
            <span>{hint}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="button button--accent" onClick={onReveal} disabled={!canReveal}>
        <Icon name="bulb" /> Pedir dica ({revealed}/4)
      </button>
      {lockedLast && <p className="hints-panel__lock">O exemplo parcial libera depois de 2 tentativas sem sucesso.</p>}
    </div>
  )
}
