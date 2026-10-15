import { blendPose, CLIP_SPEC, poseAt, type RobotClip, type RobotPose } from '@/render/robot/robotPoses'

const MAX_BLEND_SECONDS = 0.15

export interface Playback {
  requested: RobotClip
  playKey: number
  clipSeconds: number
  clip: RobotClip
  time: number
  rate: number
  from: RobotPose
  blend: number
  blendSeconds: number
}

export function startPlayback(clip: RobotClip, playKey: number, clipSeconds: number, from: RobotPose): Playback {
  return { requested: clip, playKey, clipSeconds, clip, time: 0, rate: CLIP_SPEC[clip].seconds / Math.max(clipSeconds, 0.01), from: { ...from }, blend: 0, blendSeconds: Math.min(MAX_BLEND_SECONDS, clipSeconds * 0.3) }
}

export function syncPlayback(current: Playback, input: { clip: RobotClip; playKey: number; clipSeconds: number }, pose: RobotPose): Playback {
  if (input.clip !== current.requested || input.playKey !== current.playKey) return startPlayback(input.clip, input.playKey, input.clipSeconds, pose)
  if (input.clipSeconds === current.clipSeconds) return current
  return { ...current, clipSeconds: input.clipSeconds, rate: CLIP_SPEC[current.clip].seconds / Math.max(input.clipSeconds, 0.01) }
}

export function advancePlayback(current: Playback, delta: number, pose: RobotPose): { playback: Playback; pose: RobotPose } {
  const spec = CLIP_SPEC[current.clip]
  const time = current.time + delta * (spec.loop ? 1 : current.rate)
  const blend = Math.min(1, current.blend + delta / current.blendSeconds)
  if (!spec.loop && time >= spec.seconds) {
    const idle = { ...startPlayback('idle', current.playKey, CLIP_SPEC.idle.seconds, pose), requested: current.requested, clipSeconds: current.clipSeconds }
    return { playback: idle, pose }
  }
  const playback = { ...current, time, blend }
  return { playback, pose: blendPose(current.from, poseAt(current.clip, time), blend) }
}
