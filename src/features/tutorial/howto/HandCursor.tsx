import type { HandMode, Point } from '@/features/tutorial/howto/howtoTypes'
import { toPercent } from '@/features/tutorial/howto/replicaLayout'

export function HandCursor({ x, y, mode }: Point & { mode: HandMode }) {
  return (
    <span className={`howto-hand howto-hand--${mode}`} style={toPercent({ x, y })} aria-hidden="true">
      {mode === 'press' && <span className="howto-hand__ring" />}
      <svg viewBox="0 0 32 32" focusable="false">
        <path
          d="M11 3.5c1.4 0 2.5 1.1 2.5 2.5v8.2l1-.3V4.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v9l1 .2V7c0-1.4 1.1-2.5 2.5-2.5S25.5 5.6 25.5 7v12.5c0 5.2-3.8 9.5-9 9.5h-1.2c-2.9 0-5.5-1.5-7-3.9L4 18.6c-.8-1.2-.4-2.8.8-3.5 1.1-.6 2.5-.3 3.2.7l.5.7V6c0-1.4 1.1-2.5 2.5-2.5z"
          fill={mode === 'drag' ? '#ffe7c2' : '#fff4e0'}
          stroke="#1b2630"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
