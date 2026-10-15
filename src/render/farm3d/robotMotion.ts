import { ERROR_SHAKE } from '@/motion/presets'

export function shakeTrack(centerX: number): number[] {
  return ERROR_SHAKE.keyframes.x.map((offset) => centerX + offset / 120)
}
