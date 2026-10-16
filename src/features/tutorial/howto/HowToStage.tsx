import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from 'motion/react'
import { HandCursor } from '@/features/tutorial/howto/HandCursor'
import type { HowToScript } from '@/features/tutorial/howto/howtoTypes'
import { Replica } from '@/features/tutorial/howto/Replica'
import { replicaAt } from '@/features/tutorial/howto/replicaAt'
import { toPercent } from '@/features/tutorial/howto/replicaLayout'
import { DURATIONS } from '@/motion/presets'

interface HowToStageProps {
  script: HowToScript
  segment: number
  reduced: boolean
  playKey: number
}

export function HowToStage({ script, segment, reduced, playKey }: HowToStageProps) {
  const chosen = script.segments[segment]
  const [time, setTime] = useState(0)
  const [frame, setFrame] = useState(0)
  const started = useRef<number | null>(null)

  useEffect(() => {
    started.current = null
    setTime(0)
    setFrame(0)
  }, [segment, playKey, script])

  useAnimationFrame((now) => {
    if (reduced) return
    if (started.current === null) started.current = now
    const cycle = chosen.lengthMs + DURATIONS.howtoLoopPause * 1000
    setTime(Math.min((now - started.current) % cycle, chosen.lengthMs))
  })

  const beats = chosen.beats
  const frameTime = beats[Math.min(frame, beats.length - 1)]?.at ?? 0
  const { state, hand } = replicaAt(chosen, reduced ? frameTime : time)

  return (
    <div className="howto-stage" data-segment={segment} data-frame={reduced ? frame : undefined}>
      <Replica parts={script.parts} state={state} />
      {state.dragging && (
        <span className="replica__block replica__block--movement replica__block--dragging" style={toPercent({ x: hand.x - 15, y: hand.y })} aria-hidden="true">
          {state.dragging}
        </span>
      )}
      <HandCursor {...hand} />
      {reduced && (
        <div className="howto-stage__frames">
          <button type="button" className="icon-button" aria-label="Quadro anterior" disabled={frame === 0} onClick={() => setFrame((value) => Math.max(0, value - 1))}>
            ←
          </button>
          <span>
            {frame + 1}/{beats.length}
          </span>
          <button type="button" className="icon-button" aria-label="Próximo quadro" disabled={frame >= beats.length - 1} onClick={() => setFrame((value) => Math.min(beats.length - 1, value + 1))}>
            →
          </button>
        </div>
      )}
    </div>
  )
}
