import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import './Logo.css'
import { DURATIONS } from '@/motion/presets'

interface LogoProps {
  size?: 'sm' | 'lg'
  variant?: 'brand' | 'mono'
  animated?: boolean
}

export function Logo({ size = 'sm', variant, animated = false }: LogoProps) {
  const tone = variant ?? (size === 'lg' ? 'brand' : 'mono')
  return (
    <span className={`logo logo--${size} logo--${tone}`}>
      <svg className="logo__leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 21C3 11 9 4 21 3c0 12-7 18-18 18z" fill="#4caf43" />
        <path d="M3 21L14 10" stroke="#1f5a2c" strokeWidth="1.8" fill="none" />
      </svg>
      <span className="visually-hidden">AgroBlocks</span>
      <span className="logo__word" aria-hidden="true">
        <span className="logo__agro">Agro</span>
        <span className="logo__blocks">Blocks</span>
        {size === 'lg' && (
          <motion.svg
            className="logo__sprout"
            viewBox="0 0 48 40"
            aria-hidden="true"
            focusable="false"
            style={{ originX: 0.5, originY: 1 }}
            animate={animated ? { rotate: [-5, 5, -5] } : { rotate: 0 }}
            transition={animated ? { duration: DURATIONS.logoSway, ease: EASINGS.easeInOutSine, repeat: Infinity } : { duration: DURATIONS.instant }}
          >
            <path d="M24 40V22" stroke="#2f7a32" strokeWidth="3" strokeLinecap="round" />
            <path d="M24 24C22 12 12 6 2 8c2 10 10 16 22 16z" fill="#4caf43" />
            <path d="M24 22C26 9 35 2 46 3c-1 11-9 18-22 19z" fill="#5cbf4f" />
            <path d="M24 22C30 14 36 9 44 6" stroke="#2f7a32" strokeWidth="1.6" fill="none" />
          </motion.svg>
        )}
      </span>
    </span>
  )
}
