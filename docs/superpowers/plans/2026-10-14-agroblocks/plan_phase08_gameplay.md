# AgroBlocks — Fase 8: Tela de gameplay, configurações e tutorial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fluxo essencial completo na interface: montar blocos → executar → observar o robô → fazenda muda → objetivo verificado → feedback → tentativa registrada. Layout fiel à referência visual (HUD escuro, categorias + workspace à esquerda, cena ao centro, painel "Execução" + console à direita), modal de configurações e tutorial guiado por ações reais.

**Architecture:** Lógica de tela em funções puras (`gameplayLogic.ts`, `tutorialMachine.ts`) testadas sem DOM. `useGameplaySession` orquestra controller, serializer, progresso e dicas. Componentes visuais recebem dados prontos via props. Componentes compartilhados (`Modal`, `Toggle`, `Tabs`, `Icon`, `Logo`, `SettingsDialog`) ficam em `src/components/` e `src/features/settings/`.

**Tech Stack:** React 19, react-router 7, Zustand, Testing Library, CSS.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seções 5, 6, 7) + `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`

Leia `plan_index.md` antes de começar.

---

### Task 8.1: Componentes compartilhados e modal de configurações

**Files:**
- Create: `src/components/icons/Icon.tsx`
- Create: `src/components/brand/Logo.tsx`, `src/components/brand/Logo.css`
- Create: `src/components/ui/Modal.tsx`, `src/components/ui/Toggle.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/ui.css`
- Create: `src/features/settings/SettingsDialog.tsx`, `src/features/settings/SettingsDialog.css`
- Modify: `src/main.tsx` (importar `ui.css`)
- Test: `src/components/ui/Modal.test.tsx`, `src/features/settings/SettingsDialog.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore`, `useProgressStore`, `SPEEDS`, `Speed`.
- Produces:
  - `type IconName`, `Icon({ name, size?, title? })`
  - `Logo({ size?: 'sm' | 'lg' })`
  - `Modal({ title, onClose, children, size?: 'md' | 'lg', className? })` — portal em `document.body`, `role="dialog"`, `aria-modal`, foco inicial no primeiro elemento focável, `Esc` fecha, `Tab` circula, foco volta ao elemento anterior ao fechar
  - `Toggle({ label, checked, onChange, description? })` — `role="switch"`
  - `interface TabItem { id: string; label: string; icon?: IconName }`, `Tabs({ items, active, onChange, label, idPrefix, orientation? })`, `tabId(prefix, id)`, `panelId(prefix, id)`
  - `SettingsDialog({ onClose })`

- [ ] **Step 1: Criar `src/components/icons/Icon.tsx`**

```tsx
import type { ReactNode } from 'react'

export type IconName =
  | 'seed'
  | 'drop'
  | 'bolt'
  | 'basket'
  | 'help'
  | 'gear'
  | 'play'
  | 'pause'
  | 'step'
  | 'stop'
  | 'reset'
  | 'trash'
  | 'back'
  | 'lock'
  | 'check'
  | 'star'
  | 'bulb'
  | 'close'
  | 'chart'
  | 'book'
  | 'flag'
  | 'sound'
  | 'eye'
  | 'keyboard'
  | 'database'

const PATHS: Record<IconName, ReactNode> = {
  seed: <path d="M12 21c-4-2-6-6-6-10 3 0 6 2 6 6 0-6 3-10 7-11 0 6-2 12-7 15z" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  basket: (
    <>
      <path d="M3 10h18l-2 10H5z" />
      <path d="M8 10l4-6 4 6" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </>
  ),
  step: (
    <>
      <path d="M5 4l10 8-10 8z" fill="currentColor" />
      <path d="M19 4v16" />
    </>
  ),
  stop: <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />,
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  star: <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z" fill="currentColor" />,
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19V5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  title?: string
}

export function Icon({ name, size = 20, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
```

- [ ] **Step 2: Criar `src/components/brand/Logo.tsx` e `Logo.css`**

```tsx
import './Logo.css'

export function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span className={`logo logo--${size}`}>
      <svg className="logo__leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 20C4 10 10 4 21 3c0 11-6 17-17 17z" fill="#5cbf4f" />
        <path d="M4 20L15 9" stroke="#1f5a2c" strokeWidth="1.6" fill="none" />
      </svg>
      <span className="logo__text">AgroBlocks</span>
    </span>
  )
}
```

```css
.logo {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

.logo__text {
  background: linear-gradient(180deg, #8fdc6a 0%, #3fa34d 55%, #2b7a37 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 0 rgb(15 42 25 / 0.55));
}

.logo--sm {
  font-size: 1.6rem;
}

.logo--sm .logo__leaf {
  width: 18px;
  height: 18px;
}

.logo--lg {
  font-size: clamp(2.6rem, 7vw, 4.6rem);
}

.logo--lg .logo__leaf {
  width: 0.7em;
  height: 0.7em;
  margin-bottom: 0.5em;
}
```

- [ ] **Step 3: Escrever testes que falham**

`src/components/ui/Modal.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders an accessible dialog, focuses the first control and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal title="Configurações" onClose={onClose}>
        <button type="button">Primeiro</button>
        <button type="button">Segundo</button>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Configurações' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('wraps focus with Tab', () => {
    render(
      <Modal title="Teste" onClose={() => undefined}>
        <button type="button">Último</button>
      </Modal>,
    )
    const last = screen.getByRole('button', { name: 'Último' })
    last.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })
})
```

`src/features/settings/SettingsDialog.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function renderDialog() {
  return render(
    <MemoryRouter>
      <SettingsDialog onClose={() => undefined} />
    </MemoryRouter>,
  )
}

describe('SettingsDialog', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS })
    useProgressStore.getState().resetProgress()
  })

  it('toggles dark mode from the general tab', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('switch', { name: 'Modo escuro' }))
    expect(useSettingsStore.getState().settings.theme).toBe('dark')
  })

  it('switches tabs and changes the render mode', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('tab', { name: /Visual/ }))
    fireEvent.change(screen.getByLabelText('Visualização da fazenda'), { target: { value: '2d' } })
    expect(useSettingsStore.getState().settings.renderMode).toBe('2d')
  })

  it('asks for confirmation before resetting progress', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    renderDialog()
    fireEvent.click(screen.getByRole('tab', { name: /Dados/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar progresso' }))
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar tudo' }))
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(0)
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/components src/features/settings`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 5: Implementar `src/components/ui/Modal.tsx`**

```tsx
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/icons/Icon'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  title: string
  onClose?: () => void
  children: ReactNode
  size?: 'md' | 'lg'
  className?: string
}

export function Modal({ title, onClose, children, size = 'md', className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const node = dialogRef.current
    const first = node?.querySelector<HTMLElement>(FOCUSABLE)
    const target = first ?? node
    target?.focus()
    return () => previous?.focus()
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && onClose) {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="modal-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`modal modal--${size} ${className}`}
        onKeyDown={onKeyDown}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
              <Icon name="close" />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 6: Implementar `src/components/ui/Toggle.tsx`**

```tsx
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
```

- [ ] **Step 7: Implementar `src/components/ui/Tabs.tsx`**

```tsx
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
```

- [ ] **Step 8: Criar `src/components/ui/ui.css` e importar em `src/main.tsx`**

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgb(10 20 15 / 0.55);
  backdrop-filter: blur(2px);
}

.modal {
  width: min(560px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.35);
  animation: modal-in var(--duration-base) ease;
}

.modal--lg {
  width: min(900px, 100%);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.modal__title {
  margin: 0;
  font-size: var(--text-lg);
}

.modal__close {
  display: grid;
  place-items: center;
  width: var(--tap-size);
  height: var(--tap-size);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.modal__body {
  padding: var(--space-5);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--tap-size);
}

.toggle-row__label {
  display: block;
  font-weight: 500;
}

.toggle-row__description {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.toggle {
  position: relative;
  flex: none;
  width: 52px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #b7c2bb;
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.toggle[aria-checked='true'] {
  background: var(--color-primary);
}

.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-fast) ease;
}

.toggle[aria-checked='true'] .toggle__thumb {
  transform: translateX(22px);
}

.tabs {
  display: flex;
  gap: var(--space-1);
}

.tabs--vertical {
  flex-direction: column;
}

.tabs__tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.tabs__tab[aria-selected='true'] {
  background: var(--color-water);
  color: #fff;
}

.field {
  display: grid;
  gap: var(--space-1);
}

.field__label {
  font-weight: 500;
}

.field select,
.field input {
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
```

Em `src/main.tsx`, adicionar após `import '@/styles/global.css'`:
```ts
import '@/components/ui/ui.css'
```

- [ ] **Step 9: Implementar `src/features/settings/SettingsDialog.tsx`**

```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { Tabs, panelId, tabId, type TabItem } from '@/components/ui/Tabs'
import { Toggle } from '@/components/ui/Toggle'
import { Icon } from '@/components/icons/Icon'
import { SPEEDS, type Speed } from '@/game/execution/types'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Settings } from '@/services/storage/settingsStorage'
import './SettingsDialog.css'

const TABS: TabItem[] = [
  { id: 'general', label: 'Geral', icon: 'gear' },
  { id: 'sound', label: 'Som', icon: 'sound' },
  { id: 'visual', label: 'Visual', icon: 'eye' },
  { id: 'controls', label: 'Controles', icon: 'keyboard' },
  { id: 'data', label: 'Dados', icon: 'database' },
]

const PREFIX = 'settings'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState('general')
  const [confirmReset, setConfirmReset] = useState(false)
  const settings = useSettingsStore((store) => store.settings)
  const update = useSettingsStore((store) => store.update)
  const participantCode = useProgressStore((store) => store.save.participantCode)
  const setParticipantCode = useProgressStore((store) => store.setParticipantCode)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [code, setCode] = useState(participantCode ?? '')

  return (
    <Modal title="Configurações" onClose={onClose} size="lg" className="settings">
      <div className="settings__layout">
        <Tabs items={TABS} active={tab} onChange={setTab} label="Seções das configurações" idPrefix={PREFIX} orientation="vertical" />
        <div role="tabpanel" id={panelId(PREFIX, tab)} aria-labelledby={tabId(PREFIX, tab)} className="settings__panel">
          {tab === 'general' && (
            <>
              <label className="field">
                <span className="field__label">Idioma</span>
                <select value="pt-BR" disabled aria-describedby="language-note">
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
              </label>
              <p id="language-note" className="settings__note">Esta versão está disponível apenas em português.</p>
              <Toggle label="Modo escuro" checked={settings.theme === 'dark'} onChange={(on) => update({ theme: on ? 'dark' : 'light' })} />
            </>
          )}
          {tab === 'sound' && (
            <>
              <Toggle label="Música" checked={settings.musicEnabled} onChange={(on) => update({ musicEnabled: on })} />
              <Toggle label="Efeitos sonoros" checked={settings.soundEnabled} onChange={(on) => update({ soundEnabled: on })} />
            </>
          )}
          {tab === 'visual' && (
            <>
              <Toggle
                label="Reduzir animações"
                description="Remove movimentos suaves, partículas e giros automáticos."
                checked={settings.motion === 'reduced'}
                onChange={(on) => update({ motion: on ? 'reduced' : 'system' })}
              />
              <Toggle
                label="Gráficos leves"
                description="Recomendado para computadores mais simples."
                checked={settings.lowGraphics}
                onChange={(on) => update({ lowGraphics: on })}
              />
              <label className="field">
                <span className="field__label">Visualização da fazenda</span>
                <select value={settings.renderMode} onChange={(event) => update({ renderMode: event.target.value as Settings['renderMode'] })}>
                  <option value="auto">Automática</option>
                  <option value="3d">3D</option>
                  <option value="2d">2D (grade simples)</option>
                </select>
              </label>
            </>
          )}
          {tab === 'controls' && (
            <>
              <label className="field">
                <span className="field__label">Velocidade padrão de execução</span>
                <select value={settings.defaultSpeed} onChange={(event) => update({ defaultSpeed: Number(event.target.value) as Speed })}>
                  {SPEEDS.map((speed) => (
                    <option key={speed} value={speed}>
                      {speed.toLocaleString('pt-BR')}x
                    </option>
                  ))}
                </select>
              </label>
              <dl className="settings__shortcuts">
                <dt>Ctrl + Enter</dt>
                <dd>Executar</dd>
                <dt>Espaço</dt>
                <dd>Pausar ou continuar</dd>
                <dt>. (ponto)</dt>
                <dd>Executar um passo</dd>
                <dt>Esc</dt>
                <dd>Parar</dd>
              </dl>
            </>
          )}
          {tab === 'data' && (
            <>
              <label className="field">
                <span className="field__label">Código de participante (opcional)</span>
                <input
                  value={code}
                  maxLength={32}
                  placeholder="Ex.: ALUNO-07"
                  onChange={(event) => setCode(event.target.value)}
                  onBlur={() => setParticipantCode(code)}
                />
              </label>
              <p className="settings__note">
                Use apenas um código combinado com o professor. Não digite nome, e-mail ou outros dados pessoais. Os dados ficam somente neste navegador.
              </p>
              <Link to="/painel" className="button button--ghost" onClick={onClose}>
                <Icon name="chart" /> Abrir painel e exportar dados
              </Link>
              {confirmReset ? (
                <div className="settings__confirm" role="alert">
                  <p>Tem certeza? Todo o progresso, tentativas e respostas de avaliação deste navegador serão apagados.</p>
                  <div className="settings__confirm-actions">
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => {
                        resetProgress()
                        setConfirmReset(false)
                        setCode('')
                      }}
                    >
                      Sim, apagar tudo
                    </button>
                    <button type="button" className="button" onClick={() => setConfirmReset(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="button button--danger settings__reset" onClick={() => setConfirmReset(true)}>
                  <Icon name="trash" /> Reiniciar progresso
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 10: Criar `src/features/settings/SettingsDialog.css`**

```css
.settings__layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--space-5);
  min-height: 320px;
}

.settings__panel {
  display: grid;
  align-content: start;
  gap: var(--space-4);
}

.settings__note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.settings__shortcuts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  margin: 0;
}

.settings__shortcuts dt {
  font-family: var(--font-mono);
  font-weight: 600;
}

.settings__shortcuts dd {
  margin: 0;
}

.settings__reset {
  width: 100%;
}

.settings__confirm {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-danger);
}

.settings__confirm-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .settings__layout {
    grid-template-columns: 1fr;
  }

  .settings__layout .tabs--vertical {
    flex-direction: row;
    overflow-x: auto;
  }
}
```

- [ ] **Step 11: Rodar e ver passar**

Run: `npx vitest run src/components src/features/settings && npm run typecheck`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src/components src/features/settings src/main.tsx
git commit -m "feat(ui): add icons, logo, modal, toggle, tabs and settings dialog"
```

---

### Task 8.2: Lógica pura da tela de gameplay e do tutorial

**Files:**
- Create: `src/features/gameplay/gameplayLogic.ts`
- Create: `src/features/tutorial/tutorialMachine.ts`
- Test: `src/features/gameplay/gameplayLogic.test.ts`, `src/features/tutorial/tutorialMachine.test.ts`

**Interfaces:**
- Consumes: `ExecutionSnapshot`, `ExecutionStatus`, `ExecStep`, `MissionDefinition`, `AttemptInput`, `computeEfficiencyStars`, `CellRef`, `WorkspaceJson`, `programToWorkspaceJson`, `ACTION_LABELS`.
- Produces:
  - `buildAttemptInput(snapshot: ExecutionSnapshot, mission: MissionDefinition, blockCount: number, pseudocode: string, timestamp: string): AttemptInput`
  - `loadInitialWorkspace(saved: string | null, mission: MissionDefinition): WorkspaceJson | null`
  - `objectiveCells(mission: MissionDefinition): CellRef[]`
  - `canRevealHint(revealed: number, failed: number): boolean`
  - `HINT_LEVEL_LABELS: [string, string, string, string]`
  - `STATUS_LABELS: Record<ExecutionStatus, string>`
  - `currentStepLabel(step: ExecStep | null): string`
  - `type ShortcutAction = 'run' | 'toggle' | 'step' | 'stop'`
  - `shortcutFor(input: { key: string; ctrlKey: boolean; metaKey: boolean; targetTag: string; inEditor: boolean }): ShortcutAction | null`
  - `formatResource(value: number | null): string`
  - Tutorial: `type TutorialSignal = 'blockAdded' | 'blockRemoved' | 'run' | 'pause' | 'resume' | 'error' | 'success'`, `interface TutorialStep { id: string; text: string; waitFor: TutorialSignal | null; skipOn?: TutorialSignal[] }`, `TUTORIAL_STEPS`, `advanceTutorial(index: number, signal: TutorialSignal): number`, `statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null`

- [ ] **Step 1: Escrever testes que falham**

`src/features/gameplay/gameplayLogic.test.ts`:
```ts
import {
  buildAttemptInput,
  canRevealHint,
  currentStepLabel,
  formatResource,
  loadInitialWorkspace,
  objectiveCells,
  shortcutFor,
} from '@/features/gameplay/gameplayLogic'
import { getMission } from '@/data/missions'
import { ExecutionController } from '@/game/execution/controller'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import { toControllerMission } from '@/game/missions/toControllerMission'
import type { MissionDefinition } from '@/game/missions/missionTypes'

function mission(id: string): MissionDefinition {
  const found = getMission(id)
  if (!found) throw new Error(id)
  return found
}

function finishedSnapshot(item: MissionDefinition, useReference: boolean) {
  const scheduler = new ManualScheduler()
  const controller = new ExecutionController(toControllerMission(item), scheduler)
  controller.run(useReference ? item.referenceSolution : { main: [], procedures: {} })
  scheduler.runAll()
  return controller.getSnapshot()
}

describe('gameplayLogic', () => {
  it('builds a successful attempt with efficiency stars', () => {
    const item = mission('m1-first-harvest')
    const input = buildAttemptInput(finishedSnapshot(item, true), item, 8, 'quando executar:', '2026-10-14T12:00:00.000Z')
    expect(input).toMatchObject({ missionId: 'm1-first-harvest', outcome: 'success', errorCode: null, actions: 8, blocks: 8, efficiencyStars: 3 })
    expect(input.usage).toEqual({ seeds: 0, water: 0, energy: 7 })
  })

  it('builds an objective failure without stars', () => {
    const item = mission('m1-first-harvest')
    const input = buildAttemptInput(finishedSnapshot(item, false), item, 0, '', 'now')
    expect(input).toMatchObject({ outcome: 'objectiveFailed', efficiencyStars: null })
  })

  it('loads a saved workspace, falls back to the mission initial program, else null', () => {
    const saved = JSON.stringify({ blocks: { languageVersion: 0, blocks: [] } })
    expect(loadInitialWorkspace(saved, mission('m1-first-harvest'))).toEqual({ blocks: { languageVersion: 0, blocks: [] } })
    expect(loadInitialWorkspace('{broken', mission('m1-first-harvest'))).toBeNull()
    expect(loadInitialWorkspace(null, mission('m6-efficient-farm'))?.blocks?.blocks.length).toBeGreaterThan(1)
  })

  it('collects objective cells from cell based objectives', () => {
    expect(objectiveCells(mission('m2-row-planting'))).toHaveLength(6)
    expect(objectiveCells(mission('m1-first-harvest'))).toEqual([])
  })

  it('locks the fourth hint until two failed attempts', () => {
    expect(canRevealHint(0, 0)).toBe(true)
    expect(canRevealHint(2, 0)).toBe(true)
    expect(canRevealHint(3, 1)).toBe(false)
    expect(canRevealHint(3, 2)).toBe(true)
    expect(canRevealHint(4, 9)).toBe(false)
  })

  it('labels the current step', () => {
    expect(currentStepLabel(null)).toBe('—')
    expect(currentStepLabel({ type: 'action', action: 'water', blockId: 'x' })).toBe('regar canteiro')
    expect(currentStepLabel({ type: 'check', blockId: 'x', label: 'o solo está seco?', result: true })).toBe('o solo está seco? → sim')
  })

  it('maps keyboard shortcuts and ignores typing contexts', () => {
    const base = { ctrlKey: false, metaKey: false, targetTag: 'DIV', inEditor: false }
    expect(shortcutFor({ ...base, key: 'Enter', ctrlKey: true })).toBe('run')
    expect(shortcutFor({ ...base, key: 'Enter', metaKey: true, inEditor: true })).toBe('run')
    expect(shortcutFor({ ...base, key: ' ' })).toBe('toggle')
    expect(shortcutFor({ ...base, key: '.' })).toBe('step')
    expect(shortcutFor({ ...base, key: 'Escape' })).toBe('stop')
    expect(shortcutFor({ ...base, key: ' ', targetTag: 'BUTTON' })).toBeNull()
    expect(shortcutFor({ ...base, key: '.', targetTag: 'INPUT' })).toBeNull()
    expect(shortcutFor({ ...base, key: ' ', inEditor: true })).toBeNull()
  })

  it('formats unlimited resources', () => {
    expect(formatResource(null)).toBe('∞')
    expect(formatResource(3)).toBe('3')
  })
})
```

`src/features/tutorial/tutorialMachine.test.ts`:
```ts
import { advanceTutorial, statusSignal, TUTORIAL_STEPS } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snapshot = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as ExecutionSnapshot

describe('tutorialMachine', () => {
  it('has six steps', () => {
    expect(TUTORIAL_STEPS).toHaveLength(6)
  })

  it('advances only on the awaited signal', () => {
    expect(advanceTutorial(1, 'run')).toBe(1)
    expect(advanceTutorial(1, 'blockAdded')).toBe(2)
    expect(advanceTutorial(2, 'blockRemoved')).toBe(3)
    expect(advanceTutorial(3, 'run')).toBe(4)
    expect(advanceTutorial(4, 'pause')).toBe(4)
    expect(advanceTutorial(4, 'resume')).toBe(5)
  })

  it('skips the pause step if the run already ended', () => {
    expect(advanceTutorial(4, 'error')).toBe(5)
  })

  it('finishes on success after the run step', () => {
    expect(advanceTutorial(5, 'success')).toBe(TUTORIAL_STEPS.length)
    expect(advanceTutorial(4, 'success')).toBe(TUTORIAL_STEPS.length)
    expect(advanceTutorial(1, 'success')).toBe(1)
  })

  it('derives signals from status transitions', () => {
    expect(statusSignal('idle', snapshot('running'))).toBe('run')
    expect(statusSignal('running', snapshot('paused'))).toBe('pause')
    expect(statusSignal('paused', snapshot('running'))).toBe('resume')
    expect(statusSignal('running', snapshot('failed'))).toBe('error')
    expect(statusSignal('running', snapshot('finished', true))).toBe('success')
    expect(statusSignal('running', snapshot('finished', false))).toBe('error')
    expect(statusSignal('running', snapshot('running'))).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/gameplayLogic.test.ts src/features/tutorial`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/gameplay/gameplayLogic.ts`**

```ts
import type { ExecStep } from '@/blocks/interpreter/interpreter'
import { ACTION_LABELS } from '@/blocks/pseudocode/pseudocode'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'
import { computeEfficiencyStars } from '@/game/missions/efficiency'
import type { CellRef } from '@/game/missions/goals'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { MAX_HINTS, type AttemptInput } from '@/game/progress/types'

export function buildAttemptInput(
  snapshot: ExecutionSnapshot,
  mission: MissionDefinition,
  blockCount: number,
  pseudocode: string,
  timestamp: string,
): AttemptInput {
  const success = snapshot.status === 'finished' && snapshot.validation?.success === true
  const outcome = snapshot.status === 'failed' ? 'error' : success ? 'success' : 'objectiveFailed'
  const actions = snapshot.state.actionCount
  return {
    missionId: mission.id,
    timestamp,
    outcome,
    errorCode: snapshot.error?.code ?? null,
    actions,
    blocks: blockCount,
    usage: snapshot.state.usage,
    efficiencyStars: success ? computeEfficiencyStars({ actions, blocks: blockCount }, mission.efficiency) : null,
    pseudocode,
  }
}

export function loadInitialWorkspace(saved: string | null, mission: MissionDefinition): WorkspaceJson | null {
  if (saved !== null) {
    try {
      const parsed: unknown = JSON.parse(saved)
      return parsed && typeof parsed === 'object' ? (parsed as WorkspaceJson) : null
    } catch {
      return null
    }
  }
  return mission.initialProgram ? programToWorkspaceJson(mission.initialProgram) : null
}

export function objectiveCells(mission: MissionDefinition): CellRef[] {
  const cells = mission.objectives.flatMap((objective) =>
    objective.kind === 'cellsInState' || objective.kind === 'cellsWet' ? objective.cells : [],
  )
  const unique = new Map(cells.map((cell) => [`${cell[0]},${cell[1]}`, cell]))
  return [...unique.values()]
}

export const HINT_LEVEL_LABELS: [string, string, string, string] = [
  'Ideia',
  'O que verificar',
  'Qual bloco usar',
  'Exemplo parcial',
]

export function canRevealHint(revealed: number, failed: number): boolean {
  if (revealed >= MAX_HINTS) return false
  if (revealed === MAX_HINTS - 1) return failed >= 2
  return true
}

export const STATUS_LABELS: Record<ExecutionStatus, string> = {
  idle: 'Pronto para executar',
  running: 'Executando',
  paused: 'Pausado',
  finished: 'Programa terminou',
  failed: 'Execução interrompida por erro',
}

export function currentStepLabel(step: ExecStep | null): string {
  if (!step) return '—'
  switch (step.type) {
    case 'action':
      return ACTION_LABELS[step.action]
    case 'check':
      return `${step.label} → ${step.result ? 'sim' : 'não'}`
    case 'loop':
      return `repetição ${step.iteration} de ${step.total}`
    case 'variable':
      return `${step.name} = ${step.value}`
    case 'call':
      return `procedimento ${step.name}`
  }
}

export type ShortcutAction = 'run' | 'toggle' | 'step' | 'stop'

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function shortcutFor(input: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  targetTag: string
  inEditor: boolean
}): ShortcutAction | null {
  if (input.key === 'Enter' && (input.ctrlKey || input.metaKey)) return 'run'
  if (TYPING_TAGS.has(input.targetTag) || input.inEditor) return null
  if (input.key === 'Escape') return 'stop'
  if (input.targetTag === 'BUTTON') return null
  if (input.key === ' ') return 'toggle'
  if (input.key === '.') return 'step'
  return null
}

export function formatResource(value: number | null): string {
  return value === null ? '∞' : String(value)
}
```

- [ ] **Step 4: Implementar `src/features/tutorial/tutorialMachine.ts`**

```ts
import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'

export type TutorialSignal = 'blockAdded' | 'blockRemoved' | 'run' | 'pause' | 'resume' | 'error' | 'success'

export interface TutorialStep {
  id: string
  text: string
  waitFor: TutorialSignal | null
  skipOn?: TutorialSignal[]
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    text: 'Este é o robô agrícola. Ele se move e trabalha seguindo, na ordem, as instruções do seu programa.',
    waitFor: null,
  },
  {
    id: 'add',
    text: 'Abra a categoria Movimento e arraste o bloco "mover para frente" para dentro de "quando executar".',
    waitFor: 'blockAdded',
  },
  {
    id: 'remove',
    text: 'Para remover um bloco, arraste-o de volta para a biblioteca ou para a lixeira. Experimente remover um.',
    waitFor: 'blockRemoved',
  },
  {
    id: 'build',
    text: 'Monte três blocos "mover para frente" e depois "colher planta". Clique em Executar e observe o robô.',
    waitFor: 'run',
  },
  {
    id: 'pause',
    text: 'Enquanto o robô anda, clique em Pausar. Depois clique em Continuar.',
    waitFor: 'resume',
    skipOn: ['error'],
  },
  {
    id: 'fix',
    text: 'Se o robô bateu na pedra, leia a explicação no console, remova um "mover para frente" e execute de novo.',
    waitFor: 'success',
  },
]

const BUILD_INDEX = TUTORIAL_STEPS.findIndex((step) => step.id === 'build')

export function advanceTutorial(index: number, signal: TutorialSignal): number {
  if (index >= TUTORIAL_STEPS.length) return index
  if (signal === 'success' && index > BUILD_INDEX) return TUTORIAL_STEPS.length
  const step = TUTORIAL_STEPS[index]
  if (step.waitFor === signal) return index + 1
  if (step.skipOn?.includes(signal)) return index + 1
  return index
}

export function statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null {
  const next = snapshot.status
  if (previous === next) return null
  if (next === 'running') return previous === 'paused' ? 'resume' : 'run'
  if (next === 'paused' && previous === 'running') return 'pause'
  if (next === 'failed') return 'error'
  if (next === 'finished') return snapshot.validation?.success ? 'success' : 'error'
  return null
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/features && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/gameplayLogic.ts src/features/gameplay/gameplayLogic.test.ts src/features/tutorial
git commit -m "feat(gameplay): add attempt building, hint gating, shortcuts and tutorial state machine"
```

---

### Task 8.3: HUD, painel de execução, console, dicas e pseudocódigo

**Files:**
- Modify: `src/game/execution/controller.ts` (adicionar `clearLog`)
- Modify: `src/game/execution/controller.test.ts` (teste de `clearLog`)
- Create: `src/features/gameplay/components/GameHud.tsx`
- Create: `src/features/gameplay/components/ExecutionPanel.tsx`
- Create: `src/features/gameplay/components/ConsolePanel.tsx`
- Create: `src/features/gameplay/components/HintsPanel.tsx`
- Create: `src/features/gameplay/components/PseudocodePanel.tsx`
- Create: `src/features/gameplay/components/panels.css`
- Test: `src/features/gameplay/components/components.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `Logo`, `Toggle`, `formatResource`, `HINT_LEVEL_LABELS`, `STATUS_LABELS`, `SPEEDS`, `Speed`, `ConsoleEntry`, `ExecutionStatus`, `Resources`, `MissionDefinition`.
- Produces:
  - `ExecutionController.clearLog(): void`
  - `GameHud({ mission, resources, onHelp, onSettings, onExit })`
  - `ExecutionPanel({ status, speed, stepMode, actionCount, currentLabel, onRun, onStep, onPause, onResume, onStop, onReset, onSpeedChange, onStepModeChange })`
  - `ConsolePanel({ entries, onClear })`
  - `HintsPanel({ hints, revealed, canReveal, failedAttempts, onReveal })`
  - `PseudocodePanel({ text, valid })`

- [ ] **Step 1: Adicionar `clearLog` ao controller (teste primeiro)**

Adicionar em `src/game/execution/controller.test.ts`, dentro do `describe`:
```ts
  it('clears the console without touching the state', () => {
    const { controller } = setup()
    controller.step(solution)
    controller.clearLog()
    expect(controller.getSnapshot().log).toEqual([])
    expect(controller.getSnapshot().state.robot.x).toBe(1)
  })
```

Run: `npx vitest run src/game/execution` → Expected: FAIL (`clearLog is not a function`).

Adicionar em `src/game/execution/controller.ts`, logo após o método `addLog`:
```ts
  clearLog(): void {
    this.patch({ log: [] })
  }
```

Run: `npx vitest run src/game/execution` → Expected: PASS.

- [ ] **Step 2: Escrever teste que falha `src/features/gameplay/components/components.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { ExecutionPanel } from '@/features/gameplay/components/ExecutionPanel'
import { ConsolePanel } from '@/features/gameplay/components/ConsolePanel'
import { HintsPanel } from '@/features/gameplay/components/HintsPanel'
import { getMission } from '@/data/missions'

const mission = getMission('m2-row-planting')
if (!mission) throw new Error('mission missing')

const panelProps = {
  speed: 1 as const,
  stepMode: false,
  actionCount: 0,
  currentLabel: '—',
  onRun: vi.fn(),
  onStep: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onStop: vi.fn(),
  onReset: vi.fn(),
  onSpeedChange: vi.fn(),
  onStepModeChange: vi.fn(),
}

describe('gameplay components', () => {
  it('shows mission info and real resource values in the HUD', () => {
    render(
      <GameHud
        mission={mission}
        resources={{ seeds: 5, water: null, energy: 20, harvested: 0 }}
        onHelp={vi.fn()}
        onSettings={vi.fn()}
        onExit={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Fase 2 - Plantação em série' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sementes: 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Água: ilimitada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('enables controls according to the execution status', () => {
    const { rerender } = render(<ExecutionPanel {...panelProps} status="idle" />)
    expect(screen.getByRole('button', { name: 'Executar' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Parar' })).toBeDisabled()

    rerender(<ExecutionPanel {...panelProps} status="running" />)
    expect(screen.getByRole('button', { name: 'Executar' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(panelProps.onPause).toHaveBeenCalled()

    rerender(<ExecutionPanel {...panelProps} status="paused" />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(panelProps.onResume).toHaveBeenCalled()
  })

  it('turns the main button into a single step in step mode', () => {
    render(<ExecutionPanel {...panelProps} status="paused" stepMode />)
    fireEvent.click(screen.getByRole('button', { name: 'Próximo passo' }))
    expect(panelProps.onStep).toHaveBeenCalled()
  })

  it('maps the speed slider to the four speeds', () => {
    render(<ExecutionPanel {...panelProps} status="idle" />)
    fireEvent.change(screen.getByRole('slider', { name: 'Velocidade' }), { target: { value: '3' } })
    expect(panelProps.onSpeedChange).toHaveBeenCalledWith(4)
  })

  it('renders console entries with a non-color marker', () => {
    render(<ConsolePanel entries={[{ id: 1, kind: 'error', text: 'Bateu.' }]} onClear={vi.fn()} />)
    expect(screen.getByRole('log')).toHaveTextContent('✕ Bateu.')
  })

  it('reveals hints progressively and explains the lock', () => {
    const onReveal = vi.fn()
    render(<HintsPanel hints={mission.hints} revealed={3} canReveal={false} failedAttempts={1} onReveal={onReveal} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Pedir dica/ })).toBeDisabled()
    expect(screen.getByText(/depois de 2 tentativas/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/components`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 4: Implementar `src/features/gameplay/components/GameHud.tsx`**

```tsx
import { Icon, type IconName } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Resources } from '@/game/world/types'
import './panels.css'

interface GameHudProps {
  mission: MissionDefinition
  resources: Resources
  onHelp: () => void
  onSettings: () => void
  onExit: () => void
}

function ResourceChip({ icon, label, value, tone }: { icon: IconName; label: string; value: number | null; tone: string }) {
  const text = formatResource(value)
  const spoken = value === null ? `${label}: ilimitada` : `${label}: ${text}`
  return (
    <div className={`resource-chip resource-chip--${tone}`} aria-label={spoken} role="group">
      <Icon name={icon} size={22} />
      <span className="resource-chip__text" aria-hidden="true">
        <span className="resource-chip__label">{label}</span>
        <span key={text} className="resource-chip__value">
          {text}
        </span>
      </span>
    </div>
  )
}

export function GameHud({ mission, resources, onHelp, onSettings, onExit }: GameHudProps) {
  return (
    <header className="game-hud">
      <Logo />
      <div className="game-hud__mission">
        <h1 className="game-hud__title">{mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`}</h1>
        <p className="game-hud__goal">{mission.briefing.goalText}</p>
      </div>
      <div className="game-hud__resources" aria-label="Recursos">
        <ResourceChip icon="seed" label="Sementes" value={resources.seeds} tone="seed" />
        <ResourceChip icon="drop" label="Água" value={resources.water} tone="water" />
        <ResourceChip icon="bolt" label="Energia" value={resources.energy} tone="energy" />
        <ResourceChip icon="basket" label="Colheita" value={resources.harvested} tone="harvest" />
      </div>
      <div className="game-hud__actions">
        <button type="button" className="hud-button" onClick={onHelp} aria-label="Ver objetivo e conceito da fase">
          <Icon name="help" />
        </button>
        <button type="button" className="hud-button" onClick={onSettings} aria-label="Configurações">
          <Icon name="gear" />
        </button>
        <button type="button" className="hud-button hud-button--exit" onClick={onExit}>
          Sair
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Implementar `src/features/gameplay/components/ExecutionPanel.tsx`**

```tsx
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
```

- [ ] **Step 6: Implementar `src/features/gameplay/components/ConsolePanel.tsx`**

```tsx
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
```

- [ ] **Step 7: Implementar `src/features/gameplay/components/HintsPanel.tsx`**

```tsx
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
```

- [ ] **Step 8: Implementar `src/features/gameplay/components/PseudocodePanel.tsx`**

```tsx
export function PseudocodePanel({ text, valid }: { text: string; valid: boolean }) {
  return (
    <figure className="pseudocode-panel">
      <figcaption>Gerado automaticamente a partir dos seus blocos.</figcaption>
      {valid ? (
        <pre className="pseudocode-panel__code">{text}</pre>
      ) : (
        <p className="pseudocode-panel__invalid">Complete os blocos destacados para ver o pseudocódigo.</p>
      )}
    </figure>
  )
}
```

- [ ] **Step 9: Criar `src/features/gameplay/components/panels.css`**

```css
.game-hud {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-2) var(--space-4);
  background: var(--chrome-bg);
  color: var(--chrome-text);
  border-bottom: 1px solid var(--chrome-border);
  min-height: 72px;
}

.game-hud__mission {
  flex: 1;
  min-width: 0;
  padding-left: var(--space-4);
  border-left: 1px solid var(--chrome-border);
}

.game-hud__title {
  margin: 0;
  font-size: var(--text-md);
}

.game-hud__goal {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--chrome-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-hud__resources {
  display: flex;
  gap: var(--space-2);
}

.resource-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 96px;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--chrome-surface);
  border: 1px solid var(--chrome-border);
}

.resource-chip--seed { color: #d9a46b; }
.resource-chip--water { color: #6aa8f0; }
.resource-chip--energy { color: #f2c14e; }
.resource-chip--harvest { color: #7ccf6a; }

.resource-chip__text {
  display: grid;
  line-height: 1.15;
}

.resource-chip__label {
  font-size: var(--text-xs);
  color: var(--chrome-text-muted);
}

.resource-chip__value {
  font-weight: 700;
  color: var(--chrome-text);
  animation: chip-pop var(--duration-base) ease;
}

@keyframes chip-pop {
  from {
    transform: scale(1.35);
    color: var(--sun-400);
  }
}

.game-hud__actions {
  display: flex;
  gap: var(--space-2);
}

.hud-button {
  display: grid;
  place-items: center;
  min-width: var(--tap-size);
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--chrome-border);
  background: var(--chrome-surface);
  color: var(--chrome-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.hud-button--exit {
  background: var(--exit-600);
  border-color: var(--exit-600);
  color: #fff;
  min-width: 88px;
}

.side-title {
  margin: 0;
  font-size: var(--text-lg);
}

.side-subtitle {
  font-weight: 700;
}

.execution-panel {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
}

.execution-panel__main,
.execution-panel__secondary {
  width: 100%;
  min-height: 48px;
}

.execution-panel__speed {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
}

.execution-panel__speed input {
  accent-color: var(--color-water);
  min-height: var(--tap-size);
}

.execution-panel__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.execution-panel__status {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  font-size: var(--text-sm);
}

.execution-panel__status dt {
  color: var(--color-text-muted);
}

.execution-panel__status dd {
  margin: 0;
  font-weight: 600;
}

.status--failed { color: var(--color-danger); }
.status--finished { color: var(--color-success); }

.console-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.console-panel__list {
  list-style: none;
  margin: 0;
  padding: var(--space-2);
  max-height: 260px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
}

.console-entry {
  padding: 2px 0;
}

.console-entry--error { color: var(--color-danger); font-weight: 600; }
.console-entry--success { color: var(--color-success); font-weight: 600; }
.console-entry--warning { color: #9a6a0c; }
.console-entry--check { color: #6b3fc4; }

.hints-panel {
  display: grid;
  gap: var(--space-3);
}

.hints-panel__intro,
.hints-panel__lock {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.hints-panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-2);
}

.hint {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: #fdf3d8;
  color: #3a2e0c;
  border-left: 4px solid var(--sun-400);
}

.hint strong {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pseudocode-panel {
  margin: 0;
}

.pseudocode-panel figcaption,
.pseudocode-panel__invalid {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.pseudocode-panel__code {
  margin: var(--space-2) 0 0;
  padding: var(--space-3);
  max-height: 300px;
  overflow: auto;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .game-hud {
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .game-hud__resources {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
}
```

- [ ] **Step 10: Rodar e ver passar**

Run: `npx vitest run src/features/gameplay src/game/execution && npm run typecheck`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/game/execution src/features/gameplay/components
git commit -m "feat(gameplay): add HUD, execution panel, console, hints and pseudocode panels"
```

---

### Task 8.4: Sessão de jogo, briefing e página de gameplay

**Files:**
- Create: `src/features/gameplay/useGameplaySession.ts`
- Create: `src/features/gameplay/useGameplayShortcuts.ts`
- Create: `src/features/gameplay/components/BriefingDialog.tsx`
- Create: `src/features/gameplay/GameplayPage.tsx`
- Create: `src/features/gameplay/GameplayPage.css`
- Modify: `src/app/routes.tsx`
- Test: `src/features/gameplay/GameplayPage.test.tsx`

**Interfaces:**
- Consumes: tudo das Tasks 8.1–8.3; `BlocklyEditor`, `buildToolbox`, `serializeWorkspace`, `programToPseudocode`, `detectRepetition`, `REPETITION_TIP`, `useExecutionController`, `toControllerMission`, `useProgressStore`, `failedAttempts`, `FarmView`, `stepDelayMs`, `getMission`, `describeObjective`, `describeConstraint`, `CONCEPT_LABELS`.
- Produces:
  - `useGameplaySession(mission: MissionDefinition)` retornando `{ snapshot, controller, toolbox, initialJson, serialized, program, pseudocode, errorBlock, onWorkspaceChange, run, step, runDemo, hintsRevealed, canReveal, failed, revealHint, lastAttempt }`
  - `useGameplayShortcuts(handlers: Record<ShortcutAction, () => void>): void`
  - `BriefingDialog({ mission, onStart, onDemo })`
  - `GameplayPage` na rota `/jogar/:missionId`; missão inexistente ou bloqueada → `<Navigate to="/missoes" replace />`; sucesso (fora do tutorial) → `/resultado/:missionId` após a celebração.

- [ ] **Step 1: Escrever teste que falha `src/features/gameplay/GameplayPage.test.tsx`**

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { GameplayPage } from '@/features/gameplay/GameplayPage'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

vi.mock('@/blocks/editor/BlocklyEditor', async () => {
  const { useEffect } = await import('react')
  const { programToWorkspaceJson } = await import('@/blocks/serializer/programToWorkspaceJson')
  const { getMission } = await import('@/data/missions')
  return {
    BlocklyEditor: ({ onChange }: { onChange: (json: unknown) => void }) => {
      useEffect(() => {
        const mission = getMission('m1-first-harvest')
        if (mission) onChange(programToWorkspaceJson(mission.referenceSolution))
      }, [onChange])
      return <div data-testid="editor" />
    },
  }
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jogar/:missionId" element={<GameplayPage />} />
        <Route path="/resultado/:missionId" element={<p>Tela de resultado</p>} />
        <Route path="/missoes" element={<p>Mapa de missões</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GameplayPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'reduced' } })
    useProgressStore.getState().resetProgress()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('redirects locked missions to the mission map', () => {
    renderAt('/jogar/m6-efficient-farm')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })

  it('runs the student program, updates the farm, records the attempt and opens the result', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].status).toBe('completed')
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('Tela de resultado')).toBeInTheDocument()
  })

  it('pauses and continues', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    const before = screen.getByRole('grid', { name: 'Mapa da fazenda' }).innerHTML
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' }).innerHTML).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/GameplayPage.test.tsx`
Expected: FAIL — `GameplayPage` não encontrado.

- [ ] **Step 3: Implementar `src/features/gameplay/useGameplaySession.ts`**

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { detectRepetition, REPETITION_TIP } from '@/blocks/analysis/detectRepetition'
import type { Program } from '@/blocks/interpreter/ast'
import { programToPseudocode } from '@/blocks/pseudocode/pseudocode'
import { serializeWorkspace, type SerializeResult } from '@/blocks/serializer/serializeWorkspace'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { buildToolbox } from '@/blocks/toolbox/buildToolbox'
import { buildAttemptInput, canRevealHint, loadInitialWorkspace } from '@/features/gameplay/gameplayLogic'
import { useExecutionController } from '@/features/gameplay/useExecutionController'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { failedAttempts } from '@/game/progress/progression'
import type { AttemptRecord } from '@/game/progress/types'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'

const SAVE_DELAY_MS = 400

export function useGameplaySession(mission: MissionDefinition) {
  const controllerMission = useMemo(() => toControllerMission(mission), [mission])
  const defaultSpeed = useSettingsStore((store) => store.settings.defaultSpeed)
  const { controller, snapshot } = useExecutionController(controllerMission, {
    speed: mission.tutorial ? 0.5 : defaultSpeed,
  })
  const save = useProgressStore((store) => store.save)
  const storeProgram = useProgressStore((store) => store.storeProgram)
  const recordAttempt = useProgressStore((store) => store.recordAttempt)
  const registerHint = useProgressStore((store) => store.registerHint)

  const [initialJson] = useState<WorkspaceJson | null>(() =>
    loadInitialWorkspace(useProgressStore.getState().save.missions[mission.id]?.savedProgram ?? null, mission),
  )
  const toolbox = useMemo(() => buildToolbox(mission.allowedBlocks), [mission])
  const [serialized, setSerialized] = useState<SerializeResult | null>(null)
  const [validationError, setValidationError] = useState<{ id: string; message: string } | null>(null)
  const [lastAttempt, setLastAttempt] = useState<AttemptRecord | null>(null)
  const saveTimer = useRef<number | null>(null)
  const repetitionTipShown = useRef(false)
  const recordedRunId = useRef<number | null>(null)
  const demoRunId = useRef<number | null>(null)

  const onWorkspaceChange = useCallback(
    (json: WorkspaceJson) => {
      setSerialized(serializeWorkspace(json))
      setValidationError(null)
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => storeProgram(mission.id, JSON.stringify(json)), SAVE_DELAY_MS)
    },
    [mission.id, storeProgram],
  )

  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    },
    [],
  )

  const program: Program | null = serialized?.ok ? serialized.program : null
  const pseudocode = useMemo(() => (program ? programToPseudocode(program) : ''), [program])

  useEffect(() => {
    if (!program || mission.order < 2 || repetitionTipShown.current) return
    if (detectRepetition(program)) {
      repetitionTipShown.current = true
      controller.addLog('info', REPETITION_TIP)
    }
  }, [program, mission.order, controller])

  const readyProgram = useCallback((): Program | null => {
    if (!serialized) return null
    if (serialized.ok) return serialized.program
    for (const error of serialized.errors) controller.addLog('error', error.message)
    const located = serialized.errors.find((error) => error.blockId !== null)
    setValidationError(located?.blockId ? { id: located.blockId, message: located.message } : null)
    return null
  }, [serialized, controller])

  const logWarnings = useCallback(() => {
    if (!serialized?.ok) return
    for (const warning of serialized.warnings) controller.addLog('warning', warning.message)
  }, [serialized, controller])

  const run = useCallback(() => {
    const ready = readyProgram()
    if (!ready) return
    controller.run(ready)
    logWarnings()
  }, [readyProgram, controller, logWarnings])

  const step = useCallback(() => {
    const ready = readyProgram()
    if (ready) controller.step(ready)
  }, [readyProgram, controller])

  const runDemo = useCallback(() => {
    const demo = mission.briefing.demo
    if (!demo) return
    controller.reset()
    controller.addLog('info', 'Demonstração: observe o que o robô faz. Depois clique em Reiniciar e monte o seu programa.')
    controller.run(demo)
    demoRunId.current = controller.getSnapshot().runId
  }, [mission, controller])

  useEffect(() => {
    const ended = snapshot.status === 'finished' || snapshot.status === 'failed'
    if (!ended || recordedRunId.current === snapshot.runId || demoRunId.current === snapshot.runId) return
    recordedRunId.current = snapshot.runId
    const blockCount = serialized?.ok ? serialized.blockCount : 0
    const input = buildAttemptInput(snapshot, mission, blockCount, pseudocode, new Date().toISOString())
    setLastAttempt(recordAttempt(input))
  }, [snapshot, mission, serialized, pseudocode, recordAttempt])

  const progress = save.missions[mission.id]
  const hintsRevealed = progress?.hintsUsed ?? 0
  const failed = failedAttempts(save, mission.id)
  const canReveal = canRevealHint(hintsRevealed, failed)
  const revealHint = useCallback(() => {
    if (canReveal) registerHint(mission.id)
  }, [canReveal, registerHint, mission.id])

  const errorBlock =
    snapshot.status === 'failed' && snapshot.error && snapshot.errorBlockId
      ? { id: snapshot.errorBlockId, message: `${snapshot.error.message} ${snapshot.error.hint}` }
      : validationError

  return {
    snapshot,
    controller,
    toolbox,
    initialJson,
    serialized,
    program,
    pseudocode,
    errorBlock,
    onWorkspaceChange,
    run,
    step,
    runDemo,
    hintsRevealed,
    canReveal,
    failed,
    revealHint,
    lastAttempt,
  }
}
```

- [ ] **Step 4: Implementar `src/features/gameplay/useGameplayShortcuts.ts`**

```ts
import { useEffect, useRef } from 'react'
import { shortcutFor, type ShortcutAction } from '@/features/gameplay/gameplayLogic'

export function useGameplayShortcuts(handlers: Record<ShortcutAction, () => void>): void {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const action = shortcutFor({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        targetTag: target?.tagName ?? '',
        inEditor: Boolean(target?.closest('.blockly-editor, [role="dialog"]')),
      })
      if (!action) return
      event.preventDefault()
      handlersRef.current[action]()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
```

- [ ] **Step 5: Implementar `src/features/gameplay/components/BriefingDialog.tsx`**

```tsx
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/icons/Icon'
import { describeConstraint, describeObjective } from '@/game/missions/goals'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import { formatResource } from '@/features/gameplay/gameplayLogic'

interface BriefingDialogProps {
  mission: MissionDefinition
  onStart: () => void
  onDemo: () => void
}

export function BriefingDialog({ mission, onStart, onDemo }: BriefingDialogProps) {
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const { resources } = mission
  return (
    <Modal title={title} onClose={onStart} className="briefing">
      <p className="briefing__concept">
        <Icon name="bulb" size={18} /> Conceito: <strong>{CONCEPT_LABELS[mission.concept]}</strong>
      </p>
      <p>{mission.briefing.conceptIntro}</p>
      <h3 className="briefing__heading">Objetivo</h3>
      <p>{mission.briefing.goalText}</p>
      <ul className="briefing__list">
        {mission.objectives.map((objective, index) => (
          <li key={index}>
            <Icon name="flag" size={16} /> {describeObjective(objective)}
          </li>
        ))}
        {(mission.constraints ?? []).map((constraint, index) => (
          <li key={`c-${index}`}>
            <Icon name="lock" size={16} /> {describeConstraint(constraint)}
          </li>
        ))}
      </ul>
      <p className="briefing__resources">
        Recursos iniciais: sementes {formatResource(resources.seeds)} · água {formatResource(resources.water)} · energia{' '}
        {formatResource(resources.energy)}
      </p>
      <p className="briefing__reminder">O objetivo é entender o algoritmo, não terminar rápido. Teste, observe e corrija.</p>
      <div className="briefing__actions">
        {mission.briefing.demo && (
          <button type="button" className="button" onClick={onDemo}>
            <Icon name="eye" /> Ver demonstração
          </button>
        )}
        <button type="button" className="button button--primary" onClick={onStart}>
          Começar
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 6: Implementar `src/features/gameplay/GameplayPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { BlocklyEditor } from '@/blocks/editor/BlocklyEditor'
import { getMission } from '@/data/missions'
import { BriefingDialog } from '@/features/gameplay/components/BriefingDialog'
import { ConsolePanel } from '@/features/gameplay/components/ConsolePanel'
import { ExecutionPanel } from '@/features/gameplay/components/ExecutionPanel'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { HintsPanel } from '@/features/gameplay/components/HintsPanel'
import { PseudocodePanel } from '@/features/gameplay/components/PseudocodePanel'
import { currentStepLabel, objectiveCells } from '@/features/gameplay/gameplayLogic'
import { useGameplaySession } from '@/features/gameplay/useGameplaySession'
import { useGameplayShortcuts } from '@/features/gameplay/useGameplayShortcuts'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { TutorialOverlay } from '@/features/tutorial/TutorialOverlay'
import { Tabs, panelId, tabId, type TabItem } from '@/components/ui/Tabs'
import { stepDelayMs } from '@/game/execution/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { FarmView } from '@/render/FarmView'
import { useProgressStore } from '@/stores/progressStore'
import './GameplayPage.css'

const SIDE_TABS: TabItem[] = [
  { id: 'console', label: 'Console' },
  { id: 'hints', label: 'Dicas' },
  { id: 'pseudocode', label: 'Pseudocódigo' },
]

const PANE_TABS: TabItem[] = [
  { id: 'program', label: 'Programa' },
  { id: 'farm', label: 'Fazenda' },
  { id: 'run', label: 'Execução' },
]

function GameplayScreen({ mission }: { mission: MissionDefinition }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const session = useGameplaySession(mission)
  const { snapshot, controller } = session
  const [showBriefing, setShowBriefing] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [sideTab, setSideTab] = useState('console')
  const [pane, setPane] = useState('program')
  const [blockEvent, setBlockEvent] = useState<{ kind: 'added' | 'removed'; id: number } | null>(null)
  const blockEventId = useRef(0)
  const highlightCells = useMemo(() => objectiveCells(mission), [mission])
  const succeeded = snapshot.status === 'finished' && snapshot.validation?.success === true

  useEffect(() => {
    if (!succeeded || mission.tutorial || !session.lastAttempt || session.lastAttempt.outcome !== 'success') return
    const timer = window.setTimeout(() => navigate(`/resultado/${mission.id}`), reducedMotion ? 600 : 1800)
    return () => window.clearTimeout(timer)
  }, [succeeded, mission, session.lastAttempt, navigate, reducedMotion])

  useGameplayShortcuts({
    run: () => (stepMode ? session.step() : session.run()),
    toggle: () => (snapshot.status === 'running' ? controller.pause() : snapshot.status === 'paused' ? controller.resume() : session.run()),
    step: () => session.step(),
    stop: () => controller.stop(),
  })

  const locked = snapshot.status === 'running' || snapshot.status === 'paused'

  return (
    <div className="gameplay" data-pane={pane}>
      <GameHud
        mission={mission}
        resources={snapshot.state.resources}
        onHelp={() => setShowBriefing(true)}
        onSettings={() => setShowSettings(true)}
        onExit={() => navigate('/missoes')}
      />
      <p className="gameplay__small-screen" role="note">
        A experiência completa de programação funciona melhor em telas a partir de 768 px (computador ou tablet).
      </p>
      <div className="gameplay__pane-tabs">
        <Tabs items={PANE_TABS} active={pane} onChange={setPane} label="Áreas da tela" idPrefix="pane" />
      </div>
      <main className="gameplay__body">
        <section className="gameplay__editor" aria-label="Programa" id={panelId('pane', 'program')} aria-labelledby={tabId('pane', 'program')}>
          <BlocklyEditor
            toolbox={session.toolbox}
            initialJson={session.initialJson}
            readOnly={locked}
            highlightBlockId={snapshot.currentBlockId}
            errorBlock={session.errorBlock}
            looseBlockIds={session.serialized?.looseBlockIds ?? []}
            onChange={session.onWorkspaceChange}
            onLoadFailed={() => controller.addLog('warning', 'Não foi possível abrir o programa salvo desta fase. O editor foi reiniciado.')}
            onBlockEvent={(kind) => {
              blockEventId.current += 1
              setBlockEvent({ kind, id: blockEventId.current })
            }}
          />
        </section>
        <section className="gameplay__farm" id={panelId('pane', 'farm')} aria-labelledby={tabId('pane', 'farm')}>
          <FarmView
            state={snapshot.state}
            lastEvents={snapshot.lastEvents}
            eventKey={snapshot.stepCount}
            stepDurationMs={stepDelayMs(snapshot.speed)}
            highlightCells={highlightCells}
            failed={snapshot.status === 'failed'}
            seedKey={mission.id}
          />
          {succeeded && (
            <div className="gameplay__celebration" role="status">
              <strong>Missão concluída!</strong>
              {mission.tutorial && <span> Você completou o treinamento.</span>}
            </div>
          )}
          {mission.tutorial && <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />}
        </section>
        <aside className="gameplay__side" id={panelId('pane', 'run')} aria-labelledby={tabId('pane', 'run')}>
          <ExecutionPanel
            status={snapshot.status}
            speed={snapshot.speed}
            stepMode={stepMode}
            actionCount={snapshot.state.actionCount}
            currentLabel={currentStepLabel(snapshot.lastStep)}
            onRun={session.run}
            onStep={session.step}
            onPause={() => controller.pause()}
            onResume={() => controller.resume()}
            onStop={() => controller.stop()}
            onReset={() => controller.reset()}
            onSpeedChange={(speed) => controller.setSpeed(speed)}
            onStepModeChange={setStepMode}
          />
          <div className="gameplay__side-tabs">
            <Tabs items={SIDE_TABS} active={sideTab} onChange={setSideTab} label="Informações da execução" idPrefix="side" />
            <div role="tabpanel" id={panelId('side', sideTab)} aria-labelledby={tabId('side', sideTab)} className="gameplay__side-panel">
              {sideTab === 'console' && <ConsolePanel entries={snapshot.log} onClear={() => controller.clearLog()} />}
              {sideTab === 'hints' && (
                <HintsPanel
                  hints={mission.hints}
                  revealed={session.hintsRevealed}
                  canReveal={session.canReveal}
                  failedAttempts={session.failed}
                  onReveal={session.revealHint}
                />
              )}
              {sideTab === 'pseudocode' && <PseudocodePanel text={session.pseudocode} valid={session.program !== null} />}
            </div>
          </div>
        </aside>
      </main>
      {showBriefing && (
        <BriefingDialog
          mission={mission}
          onStart={() => setShowBriefing(false)}
          onDemo={() => {
            setShowBriefing(false)
            session.runDemo()
          }}
        />
      )}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export function GameplayPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const status = useProgressStore((store) => store.save.missions[missionId]?.status)
  if (!mission || !status || status === 'locked') return <Navigate to="/missoes" replace />
  return <GameplayScreen key={mission.id} mission={mission} />
}
```

- [ ] **Step 7: Criar stub temporário `src/features/tutorial/TutorialOverlay.tsx`** (a Task 8.5 o substitui)

```tsx
import type { ExecutionSnapshot } from '@/game/execution/types'

export function TutorialOverlay(props: { snapshot: ExecutionSnapshot; blockEvent: { kind: 'added' | 'removed'; id: number } | null }) {
  return <div data-status={props.snapshot.status} />
}
```

- [ ] **Step 8: Criar `src/features/gameplay/GameplayPage.css`**

```css
.gameplay {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  height: 100vh;
  min-height: 640px;
  background: var(--chrome-bg);
}

.gameplay__small-screen,
.gameplay__pane-tabs {
  display: none;
}

.gameplay__body {
  display: grid;
  grid-template-columns: minmax(420px, 1.15fr) minmax(360px, 1.25fr) 300px;
  gap: var(--space-2);
  padding: var(--space-2);
  min-height: 0;
}

.gameplay__editor,
.gameplay__farm {
  position: relative;
  min-height: 0;
}

.gameplay__side {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--space-2);
  min-height: 0;
  overflow: auto;
}

.gameplay__side-tabs {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  min-height: 0;
}

.gameplay__side-panel {
  min-height: 0;
  overflow: auto;
}

.gameplay__celebration {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
  font-size: var(--text-lg);
  animation: celebrate var(--duration-base) ease;
}

@keyframes celebrate {
  from {
    transform: translateX(-50%) scale(0.7);
    opacity: 0;
  }
}

.briefing__concept {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: #fdf3d8;
  color: #3a2e0c;
}

.briefing__heading {
  margin-top: var(--space-4);
  font-size: var(--text-md);
}

.briefing__list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.briefing__list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.briefing__resources,
.briefing__reminder {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.briefing__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
}

@media (max-width: 1100px) {
  .gameplay {
    height: auto;
    min-height: 100vh;
  }

  .gameplay__pane-tabs {
    display: block;
    padding: var(--space-2);
    color: var(--chrome-text);
  }

  .gameplay__body {
    grid-template-columns: 1fr;
  }

  .gameplay__editor,
  .gameplay__farm,
  .gameplay__side {
    display: none;
    min-height: 70vh;
  }

  .gameplay[data-pane='program'] .gameplay__editor,
  .gameplay[data-pane='farm'] .gameplay__farm,
  .gameplay[data-pane='run'] .gameplay__side {
    display: grid;
  }
}

@media (max-width: 767px) {
  .gameplay__small-screen {
    display: block;
    margin: 0;
    padding: var(--space-2) var(--space-4);
    background: var(--color-accent);
    color: #1d1a0e;
    font-size: var(--text-sm);
  }
}
```

- [ ] **Step 9: Registrar rotas em `src/app/routes.tsx`**

```tsx
import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { GameplayPage } from '@/features/gameplay/GameplayPage'

export const appRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/jogar/:missionId', element: <GameplayPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]
```

- [ ] **Step 10: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS em toda a suíte.

- [ ] **Step 11: Verificação manual no navegador**

Run: `npm run dev` e abra `http://localhost:5173/#/jogar/m1-first-harvest`.
Expected: briefing abre; arrastar blocos funciona; Executar move o robô na cena 3D com destaque do bloco atual; Pausar/Continuar/Passo a passo/Parar/Reiniciar funcionam; erro destaca o bloco em vermelho com aviso; sucesso mostra "Missão concluída!" (a rota `/resultado` ainda redireciona para `/` até a Fase 9). Recarregar a página mantém os blocos.

- [ ] **Step 12: Commit**

```bash
git add src/features src/app/routes.tsx
git commit -m "feat(gameplay): add gameplay page wiring editor, execution, farm view and progress"
```

---

### Task 8.5: Tutorial guiado por ações reais

**Files:**
- Modify (substituir stub): `src/features/tutorial/TutorialOverlay.tsx`
- Create: `src/features/tutorial/TutorialOverlay.css`
- Test: `src/features/tutorial/TutorialOverlay.test.tsx`

**Interfaces:**
- Consumes: `TUTORIAL_STEPS`, `advanceTutorial`, `statusSignal`, `ExecutionSnapshot`, `Icon`.
- Produces: `TutorialOverlay({ snapshot, blockEvent })` — balão de fala sobre a cena, indicador `n/6` com pontos, botões ← e Próximo (Próximo desabilitado enquanto o passo espera uma ação), tela final com link "Ir para as missões".

- [ ] **Step 1: Escrever teste que falha**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TutorialOverlay } from '@/features/tutorial/TutorialOverlay'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snap = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as ExecutionSnapshot

function renderOverlay(snapshot: ExecutionSnapshot, blockEvent: { kind: 'added' | 'removed'; id: number } | null = null) {
  return render(
    <MemoryRouter>
      <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />
    </MemoryRouter>,
  )
}

describe('TutorialOverlay', () => {
  it('walks through steps driven by real events', () => {
    const { rerender } = renderOverlay(snap('idle'))
    expect(screen.getByText('1/6')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByText('2/6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('idle')} blockEvent={{ kind: 'added', id: 1 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('3/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('idle')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('4/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('running')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('5/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('failed')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('6/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('running')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('finished', true)} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Treinamento concluído!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para as missões' })).toHaveAttribute('href', '/missoes')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/tutorial/TutorialOverlay.test.tsx`
Expected: FAIL — stub não mostra `1/6`.

- [ ] **Step 3: Implementar `src/features/tutorial/TutorialOverlay.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { advanceTutorial, statusSignal, TUTORIAL_STEPS, type TutorialSignal } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'
import './TutorialOverlay.css'

interface TutorialOverlayProps {
  snapshot: ExecutionSnapshot
  blockEvent: { kind: 'added' | 'removed'; id: number } | null
}

export function TutorialOverlay({ snapshot, blockEvent }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0)
  const previousStatus = useRef(snapshot.status)
  const lastBlockEvent = useRef<number | null>(null)

  const signal = (value: TutorialSignal) => setIndex((current) => advanceTutorial(current, value))

  useEffect(() => {
    const derived = statusSignal(previousStatus.current, snapshot)
    previousStatus.current = snapshot.status
    if (derived) signal(derived)
  }, [snapshot])

  useEffect(() => {
    if (!blockEvent || lastBlockEvent.current === blockEvent.id) return
    lastBlockEvent.current = blockEvent.id
    signal(blockEvent.kind === 'added' ? 'blockAdded' : 'blockRemoved')
  }, [blockEvent])

  if (index >= TUTORIAL_STEPS.length) {
    return (
      <div className="tutorial-bubble tutorial-bubble--done" role="status">
        <strong>Treinamento concluído!</strong>
        <p>Você montou, executou, pausou e corrigiu um programa. Agora é hora das missões.</p>
        <Link className="button button--primary" to="/missoes">
          Ir para as missões
        </Link>
      </div>
    )
  }

  const step = TUTORIAL_STEPS[index]
  return (
    <div className="tutorial-bubble" role="region" aria-label="Tutorial" aria-live="polite">
      <div className="tutorial-bubble__top">
        <span className="tutorial-bubble__count">
          {index + 1}/{TUTORIAL_STEPS.length}
        </span>
        <span className="tutorial-bubble__dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((item, position) => (
            <span key={item.id} className={position <= index ? 'is-done' : ''} />
          ))}
        </span>
      </div>
      <p className="tutorial-bubble__text">{step.text}</p>
      {step.waitFor && <p className="tutorial-bubble__waiting">Faça a ação para continuar.</p>}
      <div className="tutorial-bubble__actions">
        <button type="button" className="button button--ghost" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} aria-label="Passo anterior">
          <Icon name="back" />
        </button>
        <button type="button" className="button button--primary" disabled={step.waitFor !== null} onClick={() => setIndex((current) => current + 1)}>
          Próximo
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Criar `src/features/tutorial/TutorialOverlay.css`**

```css
.tutorial-bubble {
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  bottom: var(--space-4);
  max-width: 420px;
  z-index: 3;
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
}

.tutorial-bubble::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 40px;
  border: 10px solid transparent;
  border-top: 0;
  border-bottom-color: var(--color-surface);
}

.tutorial-bubble__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.tutorial-bubble__dots {
  display: flex;
  gap: 6px;
}

.tutorial-bubble__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
}

.tutorial-bubble__dots span.is-done {
  background: var(--color-primary);
}

.tutorial-bubble__text {
  margin: 0;
}

.tutorial-bubble__waiting {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tutorial-bubble__actions {
  display: flex;
  justify-content: space-between;
}

.tutorial-bubble--done {
  text-align: center;
  justify-items: center;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/tutorial
git commit -m "feat(tutorial): add guided tutorial driven by real editor and execution events"
```
