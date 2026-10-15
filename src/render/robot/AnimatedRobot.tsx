import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RobotRig } from '@/render/robot/RobotRig'
import { blendPose, CLIP_SPEC, poseAt, REST_POSE, staticPose, type RobotClip, type RobotPose, type RobotTool } from '@/render/robot/robotPoses'

const BLEND_SECONDS = 0.15

interface AnimatedRobotProps {
  clip: RobotClip
  playKey?: number
  clipSeconds?: number
  reducedMotion: boolean
  failed?: boolean
  tool?: RobotTool
}

interface Playback {
  clip: RobotClip
  time: number
  rate: number
  from: RobotPose
  blend: number
}

export function AnimatedRobot({ clip, playKey = 0, clipSeconds, reducedMotion, failed = false, tool }: AnimatedRobotProps) {
  const pose = useRef<RobotPose>(REST_POSE)
  const playback = useRef<Playback>({ clip, time: 0, rate: 1, from: REST_POSE, blend: 1 })

  useEffect(() => {
    const seconds = clipSeconds ?? CLIP_SPEC[clip].seconds
    playback.current = { clip, time: 0, rate: CLIP_SPEC[clip].seconds / Math.max(seconds, 0.01), from: { ...pose.current }, blend: 0 }
  }, [clip, playKey, clipSeconds])

  useFrame((_, delta) => {
    if (reducedMotion) {
      pose.current = staticPose(clip)
      return
    }
    const current = playback.current
    const spec = CLIP_SPEC[current.clip]
    current.time += delta * (spec.loop ? 1 : current.rate)
    current.blend = Math.min(1, current.blend + delta / BLEND_SECONDS)
    if (!spec.loop && current.time >= spec.seconds) {
      playback.current = { clip: 'idle', time: 0, rate: 1, from: { ...pose.current }, blend: 0 }
      return
    }
    pose.current = blendPose(current.from, poseAt(current.clip, current.time), current.blend)
  })

  return <RobotRig pose={pose} failed={failed} tool={tool} />
}
