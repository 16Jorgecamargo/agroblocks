export type RobotClip = 'idle' | 'move' | 'turn' | 'till' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'

export type RobotTool = 'none' | 'hoe' | 'seedBag' | 'wateringCan' | 'claw' | 'crate'

export type EyeShape = 'normal' | 'happy' | 'focus' | 'error' | 'blink'

export const ROBOT_TOOLS: readonly RobotTool[] = ['none', 'hoe', 'seedBag', 'wateringCan', 'claw', 'crate']

export const EYE_SHAPES: readonly EyeShape[] = ['normal', 'happy', 'focus', 'error', 'blink']

export interface RobotPose {
  bodyY: number
  bodyPitch: number
  bodyRoll: number
  headYaw: number
  headPitch: number
  shoulder: number
  elbow: number
  toolTilt: number
  wheelSpin: number
  wheelTwist: number
  antennaGlow: number
  eyes: EyeShape
  tool: RobotTool
}

export const REST_POSE: RobotPose = {
  bodyY: 0,
  bodyPitch: 0,
  bodyRoll: 0,
  headYaw: 0,
  headPitch: 0,
  shoulder: 0,
  elbow: 0,
  toolTilt: 0,
  wheelSpin: 0,
  wheelTwist: 0,
  antennaGlow: 0.4,
  eyes: 'normal',
  tool: 'none',
}

export const CLIP_SPEC: Record<RobotClip, { loop: boolean; seconds: number; tool: RobotTool }> = {
  idle: { loop: true, seconds: 3, tool: 'none' },
  move: { loop: true, seconds: 0.6, tool: 'none' },
  success: { loop: true, seconds: 1.2, tool: 'none' },
  turn: { loop: false, seconds: 0.5, tool: 'none' },
  till: { loop: false, seconds: 1, tool: 'hoe' },
  plant: { loop: false, seconds: 0.9, tool: 'seedBag' },
  water: { loop: false, seconds: 1, tool: 'wateringCan' },
  harvest: { loop: false, seconds: 0.9, tool: 'claw' },
  collect: { loop: false, seconds: 0.8, tool: 'none' },
  error: { loop: false, seconds: 0.8, tool: 'none' },
}

const NUMERIC_KEYS = ['bodyY', 'bodyPitch', 'bodyRoll', 'headYaw', 'headPitch', 'shoulder', 'elbow', 'toolTilt', 'wheelSpin', 'wheelTwist', 'antennaGlow'] as const

export function poseAt(clip: RobotClip, time: number): RobotPose {
  const spec = CLIP_SPEC[clip]
  const progress = spec.loop ? (((time % spec.seconds) + spec.seconds) % spec.seconds) / spec.seconds : Math.min(1, Math.max(0, time / spec.seconds))
  const active = spec.loop || (progress > 0 && progress < 1)
  const base: RobotPose = { ...REST_POSE, tool: active ? spec.tool : 'none' }
  if (!active) return base
  const envelope = Math.sin(Math.PI * progress)
  const wave = Math.sin(Math.PI * 2 * progress)
  switch (clip) {
    case 'idle':
      return { ...base, bodyY: 0.015 * wave, headYaw: 0.25 * Math.sin(Math.PI * 2 * progress + 1), antennaGlow: 0.4 + 0.15 * (wave + 1), eyes: progress > 0.6 && progress < 0.64 ? 'blink' : 'normal' }
    case 'move':
      return { ...base, wheelSpin: Math.PI * 2 * progress, bodyPitch: 0.08 + 0.02 * wave, bodyY: 0.012 * Math.sin(Math.PI * 4 * progress) }
    case 'success':
      return { ...base, bodyY: 0.12 * Math.abs(wave), headYaw: 0.3 * wave, shoulder: 2.2, elbow: 0.3 + 0.3 * wave, antennaGlow: 1, eyes: 'happy' }
    case 'turn':
      return { ...base, wheelTwist: 1.2 * envelope, headYaw: 0.35 * envelope, bodyRoll: 0.05 * envelope }
    case 'till': {
      const strike = Math.abs(Math.sin(Math.PI * 4 * progress))
      return { ...base, shoulder: envelope * (0.9 + 0.6 * strike), toolTilt: 0.8 * envelope * strike, bodyPitch: 0.12 * envelope * strike, eyes: 'focus' }
    }
    case 'plant':
      return { ...base, shoulder: 0.9 * envelope, elbow: 0.6 * envelope, toolTilt: 1.1 * envelope * envelope, bodyPitch: 0.15 * envelope, eyes: 'focus' }
    case 'water':
      return { ...base, shoulder: 1.2 * envelope, elbow: 0.3 * envelope, toolTilt: 0.9 * envelope * envelope, headPitch: 0.2 * envelope, eyes: 'happy' }
    case 'harvest':
      return { ...base, shoulder: envelope, elbow: 0.8 * envelope, toolTilt: 0.5 * wave, bodyPitch: 0.1 * envelope, eyes: 'happy' }
    case 'collect':
      return { ...base, shoulder: 0.6 * envelope, elbow: 1.4 * envelope, bodyY: 0.04 * envelope, antennaGlow: 0.4 + 0.6 * envelope, eyes: 'focus' }
    case 'error':
      return { ...base, bodyRoll: 0.12 * envelope * Math.sin(Math.PI * 8 * progress), headYaw: 0.3 * envelope * Math.sin(Math.PI * 6 * progress), antennaGlow: 0.4 + 0.6 * envelope, eyes: 'error' }
  }
}

export function blendPose(from: RobotPose, to: RobotPose, amount: number): RobotPose {
  const result = { ...(amount < 0.5 ? from : to) }
  for (const key of NUMERIC_KEYS) result[key] = from[key] + (to[key] - from[key]) * amount
  return result
}

export function staticPose(clip: RobotClip): RobotPose {
  if (clip === 'error') return { ...REST_POSE, eyes: 'error' }
  if (clip === 'success') return { ...REST_POSE, eyes: 'happy' }
  return REST_POSE
}

export function clipSecondsFor(clip: RobotClip, durationMs: number): number {
  const spec = CLIP_SPEC[clip]
  if (spec.loop || durationMs <= 0) return spec.seconds
  return Math.min(spec.seconds, (durationMs / 1000) * 0.9)
}
