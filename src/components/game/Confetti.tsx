import { useMemo } from 'react'
import { motion } from 'motion/react'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { createRandom, hashString } from '@/render/seededRandom'

const COLORS = ['#e2533b', '#f2c14e', '#4185d6', '#3fa34d', '#e0508f', '#8e5be8']

export function Confetti({ pieces = 60, seed = 'confetti' }: { pieces?: number; seed?: string }) {
  const { decorative } = useMotionPrefs()
  const items = useMemo(() => {
    const random = createRandom(hashString(seed))
    return Array.from({ length: pieces }, (_, index) => ({
      id: index,
      left: random() * 100,
      color: COLORS[index % COLORS.length],
      width: 6 + random() * 6,
      height: 10 + random() * 8,
      spin: (random() > 0.5 ? 1 : -1) * (360 + random() * 540),
      drift: (random() - 0.5) * 120,
      delay: random() * 0.8,
      duration: DURATIONS.confetti * (0.7 + random() * 0.6),
    }))
  }, [pieces, seed])

  if (!decorative) return null
  return (
    <div className="confetti" aria-hidden="true">
      {items.map((item) => (
        <motion.span
          key={item.id}
          className="confetti__piece"
          style={{ left: `${item.left}%`, width: item.width, height: item.height, background: item.color }}
          initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', x: item.drift, rotate: item.spin, opacity: [1, 1, 0] }}
          transition={{ duration: item.duration, delay: item.delay, ease: 'linear' }}
        />
      ))}
    </div>
  )
}
