import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { SPRINGS } from '@/motion/springs'

interface StarRowProps {
  value: number
  label: string
  size?: number
  delay?: number
}

export function StarRow({ value, label, size = 20, delay = 0.3 }: StarRowProps) {
  return (
    <span className="star-row" role="img" aria-label={label}>
      {[1, 2, 3].map((position) => {
        const on = position <= value
        return (
          <motion.span
            key={position}
            aria-hidden="true"
            className={`star-row__star${on ? ' is-on' : ''}`}
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: on ? 1 : 0.35 }}
            transition={{ ...SPRINGS.star, delay: delay + position * 0.25 }}
          >
            <Icon name="star" size={size} />
          </motion.span>
        )
      })}
    </span>
  )
}
