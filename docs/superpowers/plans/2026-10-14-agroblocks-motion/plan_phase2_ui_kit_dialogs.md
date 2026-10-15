# AgroBlocks Motion — Fase 2: Kit de interface e diálogos de jogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `Modal`, `Toggle` e `Tabs` por `GameDialog`, `GameToggle`, `PillTabs` e `GameButton` animados com Motion no estilo "painel de jogo", e migrar configurações, briefing e confirmação da tela inicial.

**Architecture:** Componentes em `src/components/game/`. `GameDialog` recebe `open` e cuida da entrada/saída com `AnimatePresence` dentro de um portal; o conteúdo usa `DialogSection` para entrar em cascata. Variantes vêm de `src/motion/presets.ts`.

**Tech Stack:** `motion/react`, React 19, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 3)

Leia `plan_index.md` antes de começar.

---

### Task 2.1: `GameButton`, `GameToggle` e `PillTabs`

**Files:**
- Create: `src/components/game/GameButton.tsx`, `src/components/game/GameToggle.tsx`, `src/components/game/PillTabs.tsx`, `src/components/game/game.css`
- Modify: `src/main.tsx` (importar `game.css`)
- Test: `src/components/game/controls.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `IconName`, `PRESSABLE`, `SPRINGS`.
- Produces:
  - `type ButtonTone = 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost'`
  - `GameButton(props: Omit<HTMLMotionProps<'button'>, 'children'> & { tone?: ButtonTone; size?: 'md' | 'lg'; icon?: IconName; children?: ReactNode })`
  - `GameLink(props: { to: string; tone?: ButtonTone; size?: 'md' | 'lg'; icon?: IconName; className?: string; children?: ReactNode; onClick?: () => void })`
  - `GameToggle({ label, checked, onChange, description? })` com `role="switch"` e polegar animado por `layout`
  - `interface TabItem { id: string; label: string; icon?: IconName }`, `tabId(prefix, id)`, `panelId(prefix, id)`
  - `PillTabs({ items, active, onChange, label, idPrefix, orientation?: 'horizontal' | 'vertical', variant?: 'pill' | 'underline' })` com indicador `layoutId`

- [ ] **Step 1: Escrever teste que falha `src/components/game/controls.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { GameToggle } from '@/components/game/GameToggle'
import { PillTabs } from '@/components/game/PillTabs'

describe('game controls', () => {
  it('renders a pressable game button with an icon and tone', () => {
    const onClick = vi.fn()
    render(
      <GameButton tone="primary" icon="play" onClick={onClick}>
        Executar
      </GameButton>,
    )
    const button = screen.getByRole('button', { name: 'Executar' })
    expect(button).toHaveClass('game-button--primary')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('renders a game link', () => {
    render(
      <MemoryRouter>
        <GameLink to="/missoes" tone="secondary">
          Missões
        </GameLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Missões' })).toHaveAttribute('href', '/missoes')
  })

  it('toggles a switch', () => {
    const onChange = vi.fn()
    render(<GameToggle label="Passo a passo" checked={false} onChange={onChange} />)
    const toggle = screen.getByRole('switch', { name: 'Passo a passo' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders tabs with a single moving indicator and arrow key navigation', () => {
    const onChange = vi.fn()
    const { container } = render(
      <PillTabs
        items={[
          { id: 'a', label: 'Console' },
          { id: 'b', label: 'Dicas' },
        ]}
        active="a"
        onChange={onChange}
        label="Abas"
        idPrefix="t"
      />,
    )
    expect(screen.getByRole('tab', { name: 'Console' })).toHaveAttribute('aria-selected', 'true')
    expect(container.querySelectorAll('.pill-tabs__indicator')).toHaveLength(1)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/game`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/components/game/GameButton.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion, type HTMLMotionProps } from 'motion/react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { PRESSABLE } from '@/motion/presets'

export type ButtonTone = 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost'

type GameButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  tone?: ButtonTone
  size?: 'md' | 'lg'
  icon?: IconName
  children?: ReactNode
}

function classes(tone: ButtonTone, size: 'md' | 'lg', extra: string): string {
  return `game-button game-button--${tone} game-button--${size} ${extra}`.trim()
}

export function GameButton({ tone = 'secondary', size = 'md', icon, className = '', type = 'button', children, ...rest }: GameButtonProps) {
  return (
    <motion.button type={type} className={classes(tone, size, className)} {...PRESSABLE} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children !== undefined && <span className="game-button__label">{children}</span>}
    </motion.button>
  )
}

const MotionLink = motion.create(Link)

interface GameLinkProps {
  to: string
  tone?: ButtonTone
  size?: 'md' | 'lg'
  icon?: IconName
  className?: string
  children?: ReactNode
  onClick?: () => void
}

export function GameLink({ to, tone = 'secondary', size = 'md', icon, className = '', children, onClick }: GameLinkProps) {
  return (
    <MotionLink to={to} className={classes(tone, size, className)} onClick={onClick} {...PRESSABLE}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children !== undefined && <span className="game-button__label">{children}</span>}
    </MotionLink>
  )
}
```

- [ ] **Step 4: Implementar `src/components/game/GameToggle.tsx`**

```tsx
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
```

- [ ] **Step 5: Implementar `src/components/game/PillTabs.tsx`**

```tsx
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
```

- [ ] **Step 6: Criar `src/components/game/game.css` e importar em `src/main.tsx`**

```css
.game-button {
  --btn: #ffffff;
  --btn-dark: #c9d8c0;
  --btn-text: #13261c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
  padding: 0 var(--space-5);
  border: 2px solid var(--btn-dark);
  border-radius: 14px;
  background: var(--btn);
  color: var(--btn-text);
  font: inherit;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 5px 0 var(--btn-dark);
  user-select: none;
}

.game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: 0 2px 0 var(--btn-dark);
}

.game-button--primary {
  --btn: #3fa34d;
  --btn-dark: #2b7a37;
  --btn-text: #ffffff;
}

.game-button--danger {
  --btn: #e5484d;
  --btn-dark: #b3262b;
  --btn-text: #ffffff;
}

.game-button--accent {
  --btn: #f2c14e;
  --btn-dark: #c98b12;
  --btn-text: #2a1f05;
}

.game-button--ghost {
  --btn: transparent;
  --btn-dark: rgb(255 255 255 / 0.18);
  --btn-text: inherit;
}

.game-button--lg {
  min-height: 60px;
  padding: 0 var(--space-6);
  font-size: var(--text-lg);
  border-radius: 18px;
}

.game-button__label {
  white-space: nowrap;
}

.game-toggle {
  position: relative;
  flex: none;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 58px;
  height: 34px;
  padding: 4px;
  border: none;
  border-radius: 999px;
  background: #b7c2bb;
  box-shadow: inset 0 2px 4px rgb(0 0 0 / 0.18);
  cursor: pointer;
}

.game-toggle.is-on {
  justify-content: flex-end;
  background: var(--green-600);
}

.game-toggle__thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 0 rgb(0 0 0 / 0.2);
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
  font-weight: 600;
}

.toggle-row__description {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.pill-tabs {
  display: flex;
  gap: var(--space-1);
  padding: 4px;
  border-radius: 14px;
  background: var(--color-surface-alt);
}

.pill-tabs--vertical {
  flex-direction: column;
}

.pill-tabs--underline {
  background: transparent;
  padding: 0;
  border-bottom: 2px solid var(--color-border);
  border-radius: 0;
}

.pill-tabs__tab {
  position: relative;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.pill-tabs__label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.pill-tabs__indicator {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 10px;
  background: var(--water-500);
}

.pill-tabs--pill .pill-tabs__tab.is-selected {
  color: #ffffff;
}

.pill-tabs__indicator--underline {
  inset: auto 8px -2px 8px;
  height: 3px;
  border-radius: 3px;
  background: var(--green-600);
}
```

Em `src/main.tsx`, adicionar `import '@/components/game/game.css'` após `import '@/components/layout/layout.css'`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/components/game && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/game src/main.tsx
git commit -m "feat(ui): add pressable game buttons, spring toggle and pill tabs with Motion"
```

---

### Task 2.2: `GameDialog` e migração dos diálogos

**Files:**
- Create: `src/components/game/GameDialog.tsx`, `src/components/game/GameDialog.css`
- Modify (substituir): `src/features/settings/SettingsDialog.tsx`, `src/features/gameplay/components/BriefingDialog.tsx`
- Modify: `src/features/settings/SettingsDialog.test.tsx`, `src/features/home/HomePage.tsx`, `src/features/gameplay/GameplayPage.tsx`, `src/features/gameplay/components/ExecutionPanel.tsx`, `src/components/ui/ui.css`
- Delete: `src/components/ui/Modal.tsx`, `src/components/ui/Modal.test.tsx`, `src/components/ui/Toggle.tsx`, `src/components/ui/Tabs.tsx`
- Test: `src/components/game/GameDialog.test.tsx`

**Interfaces:**
- Consumes: Task 2.1; `dialogBackdrop`, `dialogSheet`, `overshoot`, `questBanner`, `staggerContainer`, `staggerItem`, `NUDGE`.
- Produces:
  - `type DialogTone = 'success' | 'info' | 'danger' | 'warning'`
  - `GameDialog({ open, title, icon, tone?, size?: 'md' | 'lg', onClose?, children })` — portal em `document.body`; `role="dialog"`, `aria-modal`, foco inicial, Esc, Tab circular, foco devolvido após a saída
  - `DialogSection({ children, className? })` — item da cascata
  - `SettingsDialog({ open, onClose })` (antes: sem `open`)
  - `BriefingDialog({ open, mission, onStart, onDemo })` (antes: sem `open`)

- [ ] **Step 1: Escrever teste que falha `src/components/game/GameDialog.test.tsx`**

```tsx
import { useState } from 'react'
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { GameDialog, DialogSection } from '@/components/game/GameDialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <GameDialog open={open} title="Configurações" icon="gear" tone="info" onClose={() => setOpen(false)}>
        <DialogSection>
          <button type="button">Primeiro</button>
        </DialogSection>
        <DialogSection>
          <button type="button">Último</button>
        </DialogSection>
      </GameDialog>
    </>
  )
}

describe('GameDialog', () => {
  it('opens as an accessible game panel and focuses the close button', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog', { name: 'Configurações' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveClass('game-dialog--info')
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })

  it('wraps focus with Tab', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    screen.getByRole('button', { name: 'Último' }).focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })

  it('closes on Escape, leaves the DOM after the exit animation and returns focus', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'), { timeout: 2000 })
    expect(opener).toHaveFocus()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/game/GameDialog.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/components/game/GameDialog.tsx`**

```tsx
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { dialogBackdrop, dialogSheet, overshoot, staggerContainer, staggerItem } from '@/motion/presets'
import './GameDialog.css'

export type DialogTone = 'success' | 'info' | 'danger' | 'warning'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'

interface DialogFrameProps {
  title: string
  icon: IconName
  tone: DialogTone
  size: 'md' | 'lg'
  onClose?: () => void
  children: ReactNode
}

function DialogFrame({ title, icon, tone, size, onClose, children }: DialogFrameProps) {
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

  return (
    <motion.div className="game-dialog-backdrop" variants={dialogBackdrop} initial="hidden" animate="visible" exit="exit">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`game-dialog game-dialog--${tone} game-dialog--${size}`}
        variants={dialogSheet}
        onKeyDown={onKeyDown}
      >
        <motion.header className="game-dialog__ribbon" variants={overshoot}>
          <span className="game-dialog__icon" aria-hidden="true">
            <Icon name={icon} size={28} />
          </span>
          <h2 id={titleId} className="game-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="game-dialog__close" onClick={onClose} aria-label="Fechar">
              <Icon name="close" />
            </button>
          )}
        </motion.header>
        <motion.div className="game-dialog__body" variants={staggerContainer(0.06, 0.12)}>
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

interface GameDialogProps {
  open: boolean
  title: string
  icon: IconName
  tone?: DialogTone
  size?: 'md' | 'lg'
  onClose?: () => void
  children: ReactNode
}

export function GameDialog({ open, tone = 'success', size = 'md', ...rest }: GameDialogProps) {
  return createPortal(
    <AnimatePresence>{open && <DialogFrame key="game-dialog" tone={tone} size={size} {...rest} />}</AnimatePresence>,
    document.body,
  )
}

export function DialogSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={`game-dialog__section ${className}`.trim()} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Criar `src/components/game/GameDialog.css`**

```css
.game-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--space-6) var(--space-4) var(--space-4);
  background: rgb(10 20 15 / 0.6);
}

.game-dialog {
  --dialog-tone: #3fa34d;
  --dialog-tone-dark: #2b7a37;
  position: relative;
  width: min(560px, 100%);
  background: #fffdf7;
  color: #13261c;
  border: 4px solid var(--dialog-tone);
  border-radius: 24px;
  box-shadow:
    0 8px 0 var(--dialog-tone-dark),
    0 24px 60px rgb(0 0 0 / 0.35);
  outline: none;
}

.game-dialog--lg {
  width: min(920px, 100%);
}

.game-dialog--info {
  --dialog-tone: #4c8df6;
  --dialog-tone-dark: #2f6fd6;
}

.game-dialog--danger {
  --dialog-tone: #e5484d;
  --dialog-tone-dark: #b3262b;
}

.game-dialog--warning {
  --dialog-tone: #e0a526;
  --dialog-tone-dark: #9a6a0c;
}

.game-dialog__ribbon {
  position: absolute;
  top: -26px;
  left: -16px;
  right: -16px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
  padding: var(--space-2) var(--space-4);
  border-radius: 16px;
  background: var(--dialog-tone);
  color: #ffffff;
  box-shadow: 0 5px 0 var(--dialog-tone-dark);
}

.game-dialog__ribbon::before,
.game-dialog__ribbon::after {
  content: '';
  position: absolute;
  bottom: -12px;
  border-top: 12px solid var(--dialog-tone-dark);
}

.game-dialog__ribbon::before {
  left: 0;
  border-left: 16px solid transparent;
}

.game-dialog__ribbon::after {
  right: 0;
  border-right: 16px solid transparent;
}

.game-dialog__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 56px;
  height: 56px;
  margin-top: -22px;
  border: 4px solid var(--dialog-tone);
  border-radius: 18px;
  background: #ffffff;
  color: var(--dialog-tone-dark);
  box-shadow: 0 4px 0 var(--dialog-tone-dark);
}

.game-dialog__title {
  flex: 1;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 800;
  letter-spacing: -0.01em;
}

.game-dialog__close {
  display: grid;
  place-items: center;
  width: var(--tap-size);
  height: var(--tap-size);
  border: 2px solid rgb(255 255 255 / 0.5);
  border-radius: 12px;
  background: rgb(0 0 0 / 0.12);
  color: #ffffff;
  cursor: pointer;
}

.game-dialog__body {
  display: grid;
  gap: var(--space-3);
  max-height: calc(100vh - 140px);
  overflow: auto;
  padding: 52px var(--space-5) var(--space-5);
}

.game-dialog__section > :first-child {
  margin-top: 0;
}

.game-dialog__section > :last-child {
  margin-bottom: 0;
}

.game-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-top: var(--space-2);
}

:root[data-theme='dark'] .game-dialog {
  background: #1d2e25;
  color: #e8f1e3;
}
```

- [ ] **Step 5: Substituir `src/features/settings/SettingsDialog.tsx`**

```tsx
import { useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { GameToggle } from '@/components/game/GameToggle'
import { PillTabs, panelId, tabId, type TabItem } from '@/components/game/PillTabs'
import { Icon } from '@/components/icons/Icon'
import { SPEEDS, type Speed } from '@/game/execution/types'
import { fadeSlide, NUDGE } from '@/motion/presets'
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

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('general')
  const [confirmReset, setConfirmReset] = useState(false)
  const settings = useSettingsStore((store) => store.settings)
  const update = useSettingsStore((store) => store.update)
  const participantCode = useProgressStore((store) => store.save.participantCode)
  const setParticipantCode = useProgressStore((store) => store.setParticipantCode)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [code, setCode] = useState(participantCode ?? '')
  const [warningScope, animateWarning] = useAnimate()

  const askReset = () => {
    setConfirmReset(true)
    requestAnimationFrame(() => {
      if (warningScope.current) animateWarning(warningScope.current, NUDGE.keyframes, NUDGE.options)
    })
  }

  return (
    <GameDialog open={open} title="Configurações" icon="gear" tone="info" size="lg" onClose={onClose}>
      <DialogSection className="settings__layout">
        <PillTabs items={TABS} active={tab} onChange={setTab} label="Seções das configurações" idPrefix={PREFIX} orientation="vertical" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={panelId(PREFIX, tab)}
            aria-labelledby={tabId(PREFIX, tab)}
            className="settings__panel"
            variants={fadeSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {tab === 'general' && (
              <>
                <label className="field">
                  <span className="field__label">Idioma</span>
                  <select value="pt-BR" disabled aria-describedby="language-note">
                    <option value="pt-BR">Português (Brasil)</option>
                  </select>
                </label>
                <p id="language-note" className="settings__note">
                  Esta versão está disponível apenas em português.
                </p>
                <GameToggle label="Modo escuro" checked={settings.theme === 'dark'} onChange={(on) => update({ theme: on ? 'dark' : 'light' })} />
              </>
            )}
            {tab === 'sound' && (
              <>
                <GameToggle label="Música" checked={settings.musicEnabled} onChange={(on) => update({ musicEnabled: on })} />
                <GameToggle label="Efeitos sonoros" checked={settings.soundEnabled} onChange={(on) => update({ soundEnabled: on })} />
              </>
            )}
            {tab === 'visual' && (
              <>
                <GameToggle
                  label="Reduzir animações"
                  description="Remove movimentos, confetes, partículas e giros automáticos."
                  checked={settings.motion === 'reduced'}
                  onChange={(on) => update({ motion: on ? 'reduced' : 'system' })}
                />
                <GameToggle
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
                  <input value={code} maxLength={32} placeholder="Ex.: ALUNO-07" onChange={(event) => setCode(event.target.value)} onBlur={() => setParticipantCode(code)} />
                </label>
                <p className="settings__note">
                  Use apenas um código combinado com o professor. Não digite nome, e-mail ou outros dados pessoais. Os dados ficam somente neste navegador.
                </p>
                <GameLink to="/painel" tone="secondary" icon="chart" onClick={onClose}>
                  Abrir painel e exportar dados
                </GameLink>
                {confirmReset ? (
                  <div className="settings__confirm" role="alert">
                    <p ref={warningScope}>
                      <Icon name="trash" /> Tem certeza? Todo o progresso, tentativas e respostas de avaliação deste navegador serão apagados.
                    </p>
                    <div className="settings__confirm-actions">
                      <GameButton
                        tone="danger"
                        onClick={() => {
                          resetProgress()
                          setConfirmReset(false)
                          setCode('')
                        }}
                      >
                        Sim, apagar tudo
                      </GameButton>
                      <GameButton tone="secondary" onClick={() => setConfirmReset(false)}>
                        Cancelar
                      </GameButton>
                    </div>
                  </div>
                ) : (
                  <GameButton tone="danger" icon="trash" className="settings__reset" onClick={askReset}>
                    Reiniciar progresso
                  </GameButton>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogSection>
    </GameDialog>
  )
}
```

Em `src/features/settings/SettingsDialog.css`, trocar `.settings__layout .tabs--vertical` por `.settings__layout .pill-tabs--vertical` (bloco do media query), e acrescentar:
```css
.settings__confirm p {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}
```

- [ ] **Step 6: Atualizar `src/features/settings/SettingsDialog.test.tsx`**

Trocar `<SettingsDialog onClose={() => undefined} />` por `<SettingsDialog open onClose={() => undefined} />`. Nenhuma outra mudança: os nomes acessíveis ("Modo escuro", aba "Visual", "Visualização da fazenda", "Reiniciar progresso", "Sim, apagar tudo") são mantidos.

- [ ] **Step 7: Substituir `src/features/gameplay/components/BriefingDialog.tsx`**

```tsx
import { motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { Icon } from '@/components/icons/Icon'
import { describeConstraint, describeObjective } from '@/game/missions/goals'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import { questBanner, staggerContainer, staggerItem } from '@/motion/presets'
import { EASINGS } from '@/motion/easings'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface BriefingDialogProps {
  open: boolean
  mission: MissionDefinition
  onStart: () => void
  onDemo: () => void
}

export function BriefingDialog({ open, mission, onStart, onDemo }: BriefingDialogProps) {
  const { ambient } = useMotionPrefs()
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const { resources } = mission
  return (
    <GameDialog open={open} title={title} icon="flag" tone="success" onClose={onStart}>
      <DialogSection>
        <motion.p className="briefing__concept" variants={questBanner}>
          <Icon name="bulb" size={18} /> Conceito: <strong>{CONCEPT_LABELS[mission.concept]}</strong>
        </motion.p>
      </DialogSection>
      <DialogSection>
        <p>{mission.briefing.conceptIntro}</p>
      </DialogSection>
      <DialogSection>
        <h3 className="briefing__heading">Objetivo</h3>
        <p>{mission.briefing.goalText}</p>
        <motion.ul className="briefing__list" variants={staggerContainer(0.08, 0.2)}>
          {mission.objectives.map((objective, index) => (
            <motion.li key={index} variants={staggerItem}>
              <Icon name="flag" size={16} /> {describeObjective(objective)}
            </motion.li>
          ))}
          {(mission.constraints ?? []).map((constraint, index) => (
            <motion.li key={`c-${index}`} variants={staggerItem}>
              <Icon name="lock" size={16} /> {describeConstraint(constraint)}
            </motion.li>
          ))}
        </motion.ul>
      </DialogSection>
      <DialogSection>
        <p className="briefing__resources">
          Recursos iniciais: sementes {formatResource(resources.seeds)} · água {formatResource(resources.water)} · energia {formatResource(resources.energy)}
        </p>
        <p className="briefing__reminder">O objetivo é entender o algoritmo, não terminar rápido. Teste, observe e corrija.</p>
      </DialogSection>
      <DialogSection className="game-dialog__actions">
        {mission.briefing.demo && (
          <GameButton tone="secondary" icon="eye" onClick={onDemo}>
            Ver demonstração
          </GameButton>
        )}
        <motion.span
          className="briefing__start"
          animate={ambient ? { boxShadow: ['0 0 0 0 rgba(63,163,77,0.55)', '0 0 0 12px rgba(63,163,77,0)'] } : undefined}
          transition={ambient ? { duration: 1.6, repeat: Infinity, ease: EASINGS.easeOutCubic } : undefined}
        >
          <GameButton tone="primary" size="lg" icon="play" onClick={onStart}>
            Começar
          </GameButton>
        </motion.span>
      </DialogSection>
    </GameDialog>
  )
}
```

Acrescentar ao CSS do gameplay (`src/features/gameplay/GameplayPage.css`): `.briefing__start { display: inline-flex; border-radius: 18px; }`.

- [ ] **Step 8: Migrar os chamadores**

Em `src/features/gameplay/GameplayPage.tsx`:
- Trocar `import { Tabs, panelId, tabId, type TabItem } from '@/components/ui/Tabs'` por `import { PillTabs, panelId, tabId, type TabItem } from '@/components/game/PillTabs'`.
- Trocar os dois `<Tabs ... />` por `<PillTabs ... />`; no das abas laterais (`idPrefix="side"`) acrescentar `variant="underline"`.
- Trocar o bloco
```tsx
      {showBriefing && (
        <BriefingDialog
          mission={mission}
```
por
```tsx
      <BriefingDialog
          open={showBriefing}
          mission={mission}
```
fechando com `/>` sem a chave final `)}`; e trocar `{showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}` por `<SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />`.

Em `src/features/gameplay/components/ExecutionPanel.tsx`: trocar `import { Toggle } from '@/components/ui/Toggle'` por `import { GameToggle } from '@/components/game/GameToggle'` e `<Toggle ` por `<GameToggle ` (a Fase 4 reescreve este arquivo).

Em `src/features/home/HomePage.tsx`:
- Trocar `import { Modal } from '@/components/ui/Modal'` por `import { GameButton } from '@/components/game/GameButton'` e `import { DialogSection, GameDialog } from '@/components/game/GameDialog'`.
- Trocar `{showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}` por `<SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />`.
- Substituir o bloco `{confirmNew && (<Modal ...>...</Modal>)}` por:
```tsx
      <GameDialog open={confirmNew} title="Começar uma nova fazenda?" icon="trash" tone="danger" onClose={() => setConfirmNew(false)}>
        <DialogSection>
          <p>Isso apaga o progresso, as tentativas e as respostas de avaliação salvas neste navegador.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirmNew(false)}>
            Cancelar
          </GameButton>
          <GameButton
            tone="danger"
            onClick={() => {
              resetProgress()
              navigate(`/jogar/${TRAINING_ID}`)
            }}
          >
            Apagar e começar
          </GameButton>
        </DialogSection>
      </GameDialog>
```
- Remover a regra `.home__confirm` de `HomePage.css`.

Apagar `src/components/ui/Modal.tsx`, `src/components/ui/Modal.test.tsx`, `src/components/ui/Toggle.tsx`, `src/components/ui/Tabs.tsx`. Em `src/components/ui/ui.css`, apagar as regras `.modal-backdrop`, `.modal*`, `@keyframes modal-in`, `.toggle-row*`, `.toggle*`, `.tabs*`, mantendo apenas `.field*`.

- [ ] **Step 9: Rodar tudo**

Run: `grep -rn "components/ui/Modal\|components/ui/Toggle\|components/ui/Tabs" src; npx vitest run && npm run typecheck`
Expected: grep sem resultados; suíte e typecheck verdes.

- [ ] **Step 10: Verificação visual**

Run: `npm run dev`; abrir `#/jogar/m1-first-harvest` (briefing), engrenagem (configurações) e `#/` com progresso → "Iniciar nova fazenda" (confirmação). Expected: painel com fita de título colorida, ícone em selo, entrada com mola e conteúdo em cascata; troca de abas com pílula deslizando; saída encolhendo.

- [ ] **Step 11: Commit**

```bash
git add src
git commit -m "feat(ui): replace modals with animated game dialogs and migrate settings, briefing and confirmations"
```
