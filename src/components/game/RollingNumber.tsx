import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function RollingNumber({ value }: { value: string }) {
  const characters = [...value]
  return (
    <span className="rolling-number">
      <span className="visually-hidden">{value}</span>
      <span className="rolling-number__digits" aria-hidden="true">
        {characters.map((character, index) => {
          const key = characters.length - index
          if (!/\d/.test(character)) return <span key={`c-${key}`}>{character}</span>
          return (
            <span key={`d-${key}`} className="rolling-number__column">
              <motion.span
                className="rolling-number__strip"
                initial={false}
                animate={{ y: `${-Number(character)}em` }}
                transition={{ duration: DURATIONS.odometer, ease: EASINGS.easeOutCubic }}
              >
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </motion.span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
