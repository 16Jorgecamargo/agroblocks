import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduced } = useMotionPrefs()
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ duration: DURATIONS.fadeSlide, ease: EASINGS.easeOutCubic }}>
      {children}
    </MotionConfig>
  )
}
