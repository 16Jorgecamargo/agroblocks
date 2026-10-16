import { useEffect, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { HOWTO_CLIPS } from '@/features/tutorial/howto/howtoClips'
import { HowToVideo } from '@/features/tutorial/howto/HowToVideo'
import type { HowToId } from '@/features/tutorial/tutorialTypes'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import './HowToDialog.css'

interface HowToDialogProps {
  open: boolean
  howTo: HowToId
  onPractice: () => void
}

export function HowToDialog({ open, howTo, onPractice }: HowToDialogProps) {
  const { reduced } = useMotionPrefs()
  const entry = HOWTO_CLIPS[howTo]
  const [segment, setSegment] = useState(0)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    setSegment(0)
  }, [howTo, open])

  const replay = () => {
    setSegment(0)
    setPlayKey((value) => value + 1)
  }

  const clip = entry.clips[Math.min(segment, entry.clips.length - 1)]

  return (
    <GameDialog open={open} title={entry.title} icon="eye" tone="info" size="xl" onClose={onPractice}>
      <DialogSection className="howto-dialog__body">
        {entry.clips.length > 1 && (
          <div className="howto-dialog__ways" role="tablist" aria-label="Formas de fazer">
            {entry.clips.map((item, index) => (
              <button key={item.name} type="button" role="tab" aria-selected={index === segment} className={`howto-dialog__way${index === segment ? ' is-active' : ''}`} onClick={() => setSegment(index)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
        <HowToVideo
          key={`${clip.name}-${playKey}`}
          clip={clip}
          reduced={reduced}
          loop={entry.clips.length === 1}
          onEnded={() => setSegment((value) => (value + 1) % entry.clips.length)}
        />
        <p className="howto-dialog__caption">{clip.caption}</p>
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
