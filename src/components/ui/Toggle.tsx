import { useId } from 'react'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}

export function Toggle({ label, checked, onChange, description }: ToggleProps) {
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
        className="toggle"
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__thumb" />
        <span className="visually-hidden">{checked ? 'ligado' : 'desligado'}</span>
      </button>
    </div>
  )
}
