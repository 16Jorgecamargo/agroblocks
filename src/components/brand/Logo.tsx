import { useId } from 'react'
import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import './Logo.css'
import { DURATIONS } from '@/motion/presets'

interface LogoProps {
  size?: 'sm' | 'lg'
  variant?: 'brand' | 'mono'
  animated?: boolean
}

function LeafA() {
  const id = useId()
  const body = `${id}-body`
  const leaf = `${id}-leaf`
  return (
    <svg className="logo__a" viewBox="0 0 112 150" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#8fd14f" />
          <stop offset="0.45" stopColor="#4cab3f" />
          <stop offset="1" stopColor="#1f7a34" />
        </linearGradient>
        <linearGradient id={leaf} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fb043" />
          <stop offset="1" stopColor="#1d7030" />
        </linearGradient>
      </defs>
      <path className="logo__a-leaf" d="M41 22C29 20 23 9 26 -3C38 2 45 11 41 22Z" fill={`url(#${leaf})`} />
      <path
        className="logo__a-body"
        fillRule="evenodd"
        d="M35 27C37 20 42 16 49 16H66C73 16 78 20 80 27L106 112C108 118 104 122 98 122H80C75 122 72 119 71 115L67 95H45L38 115C37 119 34 122 29 122H10C4 122 0 117 2 112ZM49 73H64L57 45Z"
        fill={`url(#${body})`}
      />
      <path className="logo__a-leaf" d="M88 118C95 132 86 146 64 149C61 134 70 122 88 118Z" fill={`url(#${leaf})`} />
      <path d="M85 122C79 132 73 139 67 145" stroke="#b6e58d" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ size = 'sm', variant, animated = false }: LogoProps) {
  const tone = variant ?? (size === 'lg' ? 'brand' : 'mono')
  return (
    <span className={`logo logo--${size} logo--${tone}`}>
      <span className="visually-hidden">AgroBlocks</span>
      <span className="logo__word" aria-hidden="true">
        <LeafA />
        <span className="logo__agro">gro</span>
        <span className="logo__blocks">
          Bloc
          <span className="logo__k">
            k
            {size === 'lg' && (
              <motion.svg
                className="logo__sprout"
                viewBox="0 0 64 48"
                aria-hidden="true"
                focusable="false"
                style={{ originX: 0.3, originY: 1 }}
                animate={animated ? { rotate: [-4, 4, -4] } : { rotate: 0 }}
                transition={animated ? { duration: DURATIONS.logoSway, ease: EASINGS.easeInOutSine, repeat: Infinity } : { duration: DURATIONS.instant }}
              >
                <path d="M21 32C10 34 2 28 1 17C12 15 21 21 21 32Z" fill="#3e9d3a" />
                <path d="M21 31C13 28 8 24 5 19" stroke="#a8de84" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <path d="M23 31C21 14 34 2 62 1C63 22 46 34 23 31Z" fill="#4cae40" />
                <path d="M24 30C34 21 45 12 56 6" stroke="#b6e58d" strokeWidth="2" strokeLinecap="round" fill="none" />
              </motion.svg>
            )}
          </span>
          s
        </span>
      </span>
    </span>
  )
}
