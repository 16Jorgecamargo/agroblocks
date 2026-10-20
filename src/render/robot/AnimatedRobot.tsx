import { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RobotRig } from '@/render/robot/RobotRig'
import { advancePlayback, startPlayback, syncPlayback, type Playback } from '@/render/robot/robotPlayback'
import { CLIP_SPEC, REST_POSE, staticPose, type RobotClip, type RobotPose, type RobotTool } from '@/render/robot/robotPoses'

interface AnimatedRobotProps {
  clip: RobotClip
  playKey?: number
  clipSeconds?: number
  reducedMotion: boolean
  failed?: boolean
  tool?: RobotTool
  gaze?: MutableRefObject<Gaze | null>
}

export interface Gaze {
  yaw: number
  pitch: number
}

function withGaze(pose: RobotPose, gaze: Gaze | null | undefined): RobotPose {
  return gaze ? { ...pose, headYaw: gaze.yaw, headPitch: gaze.pitch } : pose
}

export function AnimatedRobot({ clip, playKey = 0, clipSeconds, reducedMotion, failed = false, tool, gaze }: AnimatedRobotProps) {
  const seconds = clipSeconds ?? CLIP_SPEC[clip].seconds
  const pose = useRef<RobotPose>(REST_POSE)
  const playback = useRef<Playback>(startPlayback(clip, playKey, seconds, REST_POSE))

  useEffect(() => {
    playback.current = syncPlayback(playback.current, { clip, playKey, clipSeconds: seconds }, pose.current)
  }, [clip, playKey, seconds])

  useFrame((_, delta) => {
    if (reducedMotion) {
      pose.current = withGaze(staticPose(clip), gaze?.current)
      return
    }
    const next = advancePlayback(playback.current, delta, pose.current)
    playback.current = next.playback
    pose.current = withGaze(next.pose, gaze?.current)
  })

  return <RobotRig pose={pose} failed={failed} tool={tool} />
}
