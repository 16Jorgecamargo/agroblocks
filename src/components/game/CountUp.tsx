import { useEffect, useState } from 'react'
import { animate } from 'motion'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

export function CountUp({ value }: { value: number }) {
  const { reduced } = useMotionPrefs()
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: DURATIONS.countUp,
      ease: EASINGS.easeOutExpo,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value, reduced])

  return (
    <span className="count-up">
      <span className="visually-hidden">{value}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}
