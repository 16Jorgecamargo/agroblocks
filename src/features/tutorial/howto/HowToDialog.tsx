import { useEffect, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { HowToStage } from '@/features/tutorial/howto/HowToStage'
import type { HowToId } from '@/features/tutorial/tutorialTypes'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import './HowToDialog.css'

interface HowToDialogProps {
  open: boolean
  howTo: HowToId
  onPractice: () => void
}

export function HowToDialog({ open, howTo, onPractice }: HowToDialogProps) {
  const { reduced } = useMotionPrefs()
  const script = HOWTO_SCRIPTS[howTo]
  const [segment, setSegment] = useState(0)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    setSegment(0)
  }, [howTo, open])

  const replay = () => {
    setSegment(0)
    setPlayKey((value) => value + 1)
  }

  useEffect(() => {
    if (reduced || script.segments.length < 2 || !open) return
    const cycle = script.segments[segment].duration + DURATIONS.howtoLoopPause * 1000
    const timer = window.setTimeout(() => setSegment((value) => (value + 1) % script.segments.length), cycle)
    return () => window.clearTimeout(timer)
  }, [reduced, script, segment, open, playKey])

  return (
    <GameDialog open={open} title={script.title} icon="eye" tone="info" size="lg" onClose={onPractice}>
      <DialogSection className="howto-dialog__body">
        {script.segments.length > 1 && (
          <div className="howto-dialog__ways" role="tablist" aria-label="Formas de fazer">
            {script.segments.map((item, index) => (
              <button key={item.label} type="button" role="tab" aria-selected={index === segment} className={`howto-dialog__way${index === segment ? ' is-active' : ''}`} onClick={() => setSegment(index)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
        <HowToStage script={script} segment={segment} reduced={reduced} playKey={playKey} />
        <p className="howto-dialog__caption">{script.segments[segment].caption}</p>
      </DialogSection>
      <DialogSection className="game-dialog__actions">
        <GameButton tone="secondary" icon="reset" onClick={replay}>
          Ver de novo
        </GameButton>
        <GameButton tone="primary" size="lg" icon="play" onClick={onPractice}>
          Praticar
        </GameButton>
      </DialogSection>
    </GameDialog>
  )
}
