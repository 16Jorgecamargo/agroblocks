import type { KeyboardEvent } from 'react'
import { Icon, type IconName } from '@/components/icons/Icon'

export interface TabItem {
  id: string
  label: string
  icon?: IconName
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  label: string
  idPrefix: string
  orientation?: 'horizontal' | 'vertical'
}

export function Tabs({ items, active, onChange, label, idPrefix, orientation = 'horizontal' }: TabsProps) {
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
    <div role="tablist" aria-label={label} aria-orientation={orientation} className={`tabs tabs--${orientation}`} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <button
          key={item.id}
          id={tabId(idPrefix, item.id)}
          type="button"
          role="tab"
          aria-selected={item.id === active}
          aria-controls={panelId(idPrefix, item.id)}
          tabIndex={item.id === active ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(item.id)}
        >
          {item.icon && <Icon name={item.icon} size={18} />}
          {item.label}
        </button>
      ))}
    </div>
  )
}
