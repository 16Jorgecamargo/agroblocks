import { useId } from 'react'
import { motion } from 'motion/react'
import { SPRINGS } from '@/motion/springs'

interface GameToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}

export function GameToggle({ label, checked, onChange, description }: GameToggleProps) {
  const labelId = useId()
  const descriptionId = useId()
  return (
    <div className="toggle-row">
      <div>
        <span id={labelId} className="toggle-row__label">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="toggle-row__description">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        className={`game-toggle${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <motion.span className="game-toggle__thumb" layout transition={SPRINGS.pill} />
        <span className="visually-hidden">{checked ? 'ligado' : 'desligado'}</span>
      </button>
    </div>
  )
}
