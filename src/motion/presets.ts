import type { Variants } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'

export const DURATIONS = {
  fadeSlide: 0.6,
  softRise: 0.9,
  snapIn: 0.38,
  shrinkFadeExit: 0.52,
  staggerList: 0.76,
  gridWave: 0.9,
  overshoot: 0.6,
  questBanner: 0.8,
  errorShake: 0.54,
  nudge: 0.52,
  badgePop: 0.45,
  focusHalo: 0.9,
  blurCrossfade: 0.6,
  iris: 0.6,
  push: 0.4,
  odometer: 0.75,
  countUp: 2,
  rowExpand: 0.72,
  harvestFlight: 0.9,
  confetti: 2.8,
} as const

export const fadeSlide: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATIONS.fadeSlide, ease: EASINGS.easeOutCubic } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: EASINGS.easeInCubic } },
}

export const softRise: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DURATIONS.softRise, ease: EASINGS.easeOutSine } },
}

export const snapIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATIONS.snapIn, ease: EASINGS.easeOutExpo } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: EASINGS.easeInCubic } },
}

export const overshoot: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATIONS.overshoot, ease: EASINGS.easeOutBack } },
}

export const questBanner: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  visible: {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: DURATIONS.questBanner, ease: EASINGS.easeOutExpo },
  },
}

export function staggerContainer(stagger = 0.06, delay = 0): Variants {
  return { hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATIONS.staggerList, ease: EASINGS.easeOutCubic } },
}

export const gridWaveItem: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATIONS.gridWave, ease: EASINGS.easeOutCubic, delay: index * 0.07 },
  }),
}

export const rowExpand: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: DURATIONS.rowExpand, ease: EASINGS.easeOutBack } },
}

export const toastItem: Variants = {
  hidden: { opacity: 0, x: -16, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: SPRINGS.toast },
}

export const dialogBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(4px)', transition: { duration: 0.3, ease: EASINGS.easeOutCubic } },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', pointerEvents: 'none', transition: { duration: 0.3, ease: EASINGS.easeInCubic } },
}

export const dialogSheet: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.sheet },
  exit: { opacity: 0, scale: 0.9, transition: { duration: DURATIONS.shrinkFadeExit, ease: EASINGS.easeInCubic } },
}

export type PageTransitionKind = 'blurCrossfade' | 'iris' | 'push'

export const pageVariants: Record<PageTransitionKind, Variants> = {
  blurCrossfade: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: DURATIONS.blurCrossfade, ease: EASINGS.easeInOutSine } },
    exit: { opacity: 0, filter: 'blur(10px)', transition: { duration: 0.3, ease: EASINGS.easeInOutSine } },
  },
  iris: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(150% at 50% 50%)', transition: { duration: DURATIONS.iris, ease: EASINGS.easeInCubic } },
    exit: { opacity: 0, transition: { duration: 0.25 } },
  },
  push: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0, transition: { duration: DURATIONS.push, ease: EASINGS.easeInOutCubic } },
    exit: { opacity: 0, x: 60, transition: { duration: 0.25, ease: EASINGS.easeInOutCubic } },
  },
}

export const ERROR_SHAKE = {
  keyframes: { x: [0, -10, 10, -7, 7, -3, 3, 0] },
  options: { duration: DURATIONS.errorShake, ease: EASINGS.easeOutExpo },
}

export const NUDGE = {
  keyframes: { x: [0, 6, 0, 4, 0] },
  options: { duration: DURATIONS.nudge, ease: EASINGS.easeOutBack },
}

export const BADGE_POP = {
  keyframes: { scale: [1, 1.35, 0.95, 1] },
  options: { duration: DURATIONS.badgePop, ease: EASINGS.easeOutBack },
}

export const FOCUS_HALO = {
  keyframes: {
    filter: [
      'drop-shadow(0 0 0px rgba(242,193,78,0.9))',
      'drop-shadow(0 0 10px rgba(242,193,78,0.9))',
      'drop-shadow(0 0 0px rgba(242,193,78,0.9))',
    ],
  },
  options: { duration: DURATIONS.focusHalo, ease: EASINGS.easeOutCubic, repeat: Infinity },
}

export const HEARTBEAT = {
  keyframes: { scale: [1, 1.06, 1, 1.04, 1] },
  options: { duration: 1.2, ease: EASINGS.easeInOutSine, repeat: Infinity, repeatDelay: 0.8 },
}

export const PRESSABLE = {
  whileHover: { y: -2 },
  whileTap: { y: 3, scale: 0.97 },
  transition: SPRINGS.push3d,
}
