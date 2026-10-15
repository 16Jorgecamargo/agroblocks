import type { KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { SPRINGS } from '@/motion/springs'

export interface TabItem {
  id: string
  label: string
  icon?: IconName
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`

interface PillTabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  label: string
  idPrefix: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'pill' | 'underline'
}

export function PillTabs({ items, active, onChange, label, idPrefix, orientation = 'horizontal', variant = 'pill' }: PillTabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const index = items.findIndex((item) => item.id === active)
    const delta = event.key === keys[0] ? -1 : 1
    const next = items[(index + delta + items.length) % items.length]
    onChange(next.id)
    document.getElementById(tabId(idPrefix, next.id))?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={`pill-tabs pill-tabs--${orientation} pill-tabs--${variant}`}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            id={tabId(idPrefix, item.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(idPrefix, item.id)}
            tabIndex={selected ? 0 : -1}
            className={`pill-tabs__tab${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {selected && (
              <motion.span layoutId={`${idPrefix}-indicator`} className={`pill-tabs__indicator pill-tabs__indicator--${variant}`} transition={SPRINGS.pill} />
            )}
            <span className="pill-tabs__label">
              {item.icon && <Icon name={item.icon} size={18} />}
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
