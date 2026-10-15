import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import type { ConsoleEntry, ConsoleKind } from '@/game/execution/types'
import { BADGE_POP, ERROR_SHAKE, toastItem } from '@/motion/presets'

const MARKERS: Record<ConsoleKind, string> = {
  info: 'ℹ',
  action: '▶',
  check: '?',
  error: '✕',
  success: '✓',
  warning: '⚠',
}

function emphasis(kind: ConsoleKind) {
  if (kind === 'error') return { animate: ERROR_SHAKE.keyframes, transition: ERROR_SHAKE.options }
  if (kind === 'success') return { animate: BADGE_POP.keyframes, transition: BADGE_POP.options }
  return null
}

export function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  const listRef = useRef<HTMLOListElement>(null)
  const initialIds = useRef(new Set(entries.map((entry) => entry.id)))

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
        {entries.map((entry) => {
          const isNew = !initialIds.current.has(entry.id)
          const extra = isNew ? emphasis(entry.kind) : null
          return (
            <motion.li
              key={entry.id}
              className={`console-entry console-entry--${entry.kind}`}
              data-new={isNew ? 'true' : undefined}
              variants={toastItem}
              initial={isNew ? 'hidden' : false}
              animate="visible"
            >
              <motion.span className="console-entry__inner" animate={extra?.animate} transition={extra?.transition}>
                <span aria-hidden="true">{MARKERS[entry.kind]}</span> {entry.text}
              </motion.span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
