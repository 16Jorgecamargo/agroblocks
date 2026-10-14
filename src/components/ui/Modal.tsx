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
