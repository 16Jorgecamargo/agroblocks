import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { placeCallout, type Rect, type Size } from '@/features/tutorial/tutorialGeometry'
import type { CalloutSide } from '@/features/tutorial/tutorialTypes'
import { DURATIONS, overshoot } from '@/motion/presets'

interface TutorialCalloutProps {
  target: Rect | null
  prefer?: CalloutSide
  title: string
  text: string
  notice: string | null
  practice: boolean
  onShowHowTo: () => void
}

const FALLBACK: Size = { width: 340, height: 180 }

export function TutorialCallout({ target, prefer, title, text, notice, practice, onShowHowTo }: TutorialCalloutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>(FALLBACK)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const width = element.offsetWidth || FALLBACK.width
      const height = element.offsetHeight || FALLBACK.height
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const placement = target ? placeCallout(target, size, viewport, prefer) : { side: 'bottom' as const, x: (viewport.width - size.width) / 2, y: viewport.height - size.height - 120, arrow: -100 }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={`tutorial-callout tutorial-callout--${placement.side}`}
      data-side={placement.side}
      style={{ left: placement.x, top: placement.y, ['--arrow' as string]: `${placement.arrow}px` }}
      variants={overshoot}
      initial="hidden"
      animate="visible"
    >
      <strong className="tutorial-callout__title">{title}</strong>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={text} className="tutorial-callout__text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DURATIONS.calloutSwap }}>
          {text}
        </motion.p>
      </AnimatePresence>
      {notice && (
        <p className="tutorial-callout__notice" role="status">
          {notice}
        </p>
      )}
      {practice && (
        <div className="tutorial-callout__footer">
          <span className="tutorial-callout__waiting">Faça a ação para continuar.</span>
          <GameButton tone="ghost" icon="eye" onClick={onShowHowTo}>
            Ver animação
          </GameButton>
        </div>
      )}
    </motion.div>
  )
}
