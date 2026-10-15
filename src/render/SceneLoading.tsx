import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'

export function SceneLoading() {
  return (
    <div className="scene-loading" role="status">
      <motion.div
        className="scene-loading__shimmer"
        aria-hidden="true"
        animate={{ backgroundPositionX: ['-200%', '200%'] }}
        transition={{ duration: DURATIONS.shimmer, repeat: Infinity, ease: 'linear' }}
      />
      <span className="scene-loading__dots" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span key={index} animate={{ y: [0, -8, 0] }} transition={{ duration: DURATIONS.dotBounce, repeat: Infinity, delay: index * 0.12, ease: EASINGS.easeOutQuart }} />
        ))}
      </span>
      <span>Carregando fazenda…</span>
    </div>
  )
}
