export interface SpringSpec {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

function spring(stiffness: number, damping: number, mass = 1): SpringSpec {
  return { type: 'spring', stiffness, damping, mass }
}

export const SPRINGS = {
  snap: spring(180, 13, 0.6),
  bounce: spring(150, 9, 0.8),
  smooth: spring(120, 26),
  modal: spring(280, 28),
  sheet: spring(260, 20),
  pill: spring(240, 24),
  push3d: spring(420, 24),
  star: spring(400, 14),
  marker: spring(150, 15),
  achievement: spring(240, 22),
  toast: spring(300, 24),
  cameraKick: spring(220, 18),
  jelly: spring(290, 6.8),
} as const

export type SpringName = keyof typeof SPRINGS

export function scaleSpring(base: SpringSpec, speed: number): SpringSpec {
  return { ...base, stiffness: base.stiffness * speed * speed, damping: base.damping * speed }
}
