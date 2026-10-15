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
        <motion.header className="game-dialog__header" variants={overshoot}>
          <span className="game-dialog__icon" aria-hidden="true">
            <Icon name={icon} size={26} />
          </span>
          <h2 id={titleId} className="game-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="game-dialog__close" onClick={onClose} aria-label="Fechar">
              <Icon name="close" size={22} />
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
