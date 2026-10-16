import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import './Logo.css'
import { DURATIONS } from '@/motion/presets'

interface LogoProps {
  size?: 'sm' | 'lg'
  animated?: boolean
}

export const LOGO_SOURCES = {
  sm: `${import.meta.env.BASE_URL}brand/logo-sm.webp`,
  lg: `${import.meta.env.BASE_URL}brand/logo-lg.webp`,
} as const

const LOGO_SIZES = {
  sm: { width: 520, height: 180 },
  lg: { width: 1400, height: 486 },
} as const

export function Logo({ size = 'sm', animated = false }: LogoProps) {
  return (
    <span className={`logo logo--${size}`}>
      <motion.img
        className="logo__image"
        src={LOGO_SOURCES[size]}
        alt="AgroBlocks"
        width={LOGO_SIZES[size].width}
        height={LOGO_SIZES[size].height}
        draggable={false}
        decoding="async"
        animate={animated ? { y: [0, -6, 0] } : { y: 0 }}
        transition={animated ? { duration: DURATIONS.logoSway, ease: EASINGS.easeInOutSine, repeat: Infinity } : { duration: DURATIONS.instant }}
      />
    </span>
  )
}
