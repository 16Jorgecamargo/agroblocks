import { useEffect, useRef } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { ConsoleEntry, ConsoleKind } from '@/game/execution/types'

const MARKERS: Record<ConsoleKind, string> = {
  info: 'ℹ',
  action: '▶',
  check: '?',
  error: '✕',
  success: '✓',
  warning: '⚠',
}

export function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  const listRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [entries])
  return (
    <div className="console-panel">
      <div className="console-panel__header">
        <span className="side-subtitle">Console</span>
        <button type="button" className="icon-button" onClick={onClear} aria-label="Limpar console">
          <Icon name="trash" size={18} />
        </button>
      </div>
      <ol ref={listRef} role="log" aria-live="polite" className="console-panel__list">
        {entries.length === 0 && <li className="console-entry console-entry--info">Pronto para executar.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className={`console-entry console-entry--${entry.kind}`}>
            <span aria-hidden="true">{MARKERS[entry.kind]}</span> {entry.text}
          </li>
        ))}
      </ol>
    </div>
  )
}
