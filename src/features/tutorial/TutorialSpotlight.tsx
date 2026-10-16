import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { HOLE_PADDING, padRect, spotlightPath, type Rect, type Size } from '@/features/tutorial/tutorialGeometry'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

function useViewport(): Size {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState<Size>(read)
  useEffect(() => {
    const update = () => setSize(read())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

export function TutorialSpotlight({ rects }: { rects: Rect[] }) {
  const viewport = useViewport()
  const { ambient } = useMotionPrefs()
  const holes = rects.map((rect) => padRect(rect, HOLE_PADDING))
  return (
    <>
      <div className="tutorial-spotlight" data-testid="tutorial-spotlight" style={{ clipPath: `path(evenodd, "${spotlightPath(holes, viewport)}")` }} />
      {holes.map((hole, index) => (
        <motion.span
          key={index}
          className="tutorial-spotlight__ring"
          aria-hidden="true"
          style={{ left: hole.x, top: hole.y, width: hole.width, height: hole.height }}
          animate={ambient ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
          transition={ambient ? { duration: DURATIONS.spotlightPulse, repeat: Infinity, ease: EASINGS.easeInOutSine } : { duration: DURATIONS.instant }}
        />
      ))}
    </>
  )
}
