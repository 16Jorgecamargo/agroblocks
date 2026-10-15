import { advancePlayback, startPlayback, syncPlayback } from '@/render/robot/robotPlayback'
import { CLIP_SPEC, clipSecondsFor, poseAt, REST_POSE, type RobotPose } from '@/render/robot/robotPoses'

function run(clip: 'till' | 'water', clipSeconds: number, seconds: number) {
  let playback = startPlayback(clip, 1, clipSeconds, REST_POSE)
  let pose: RobotPose = REST_POSE
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
    const next = advancePlayback(playback, 1 / 60, pose)
    playback = next.playback
    pose = next.pose
  }
  return { playback, pose }
}

describe('robot playback', () => {
  it('does not replay the last action when only the speed changes', () => {
    const finished = run('water', 1, 1.5).playback
    expect(finished.clip).toBe('idle')
    const synced = syncPlayback(finished, { clip: 'water', playKey: 1, clipSeconds: clipSecondsFor('water', 150) }, REST_POSE)
    expect(synced.clip).toBe('idle')
  })

  it('replays when a new step arrives with the same action', () => {
    const finished = run('water', 1, 1.5).playback
    const synced = syncPlayback(finished, { clip: 'water', playKey: 2, clipSeconds: 1 }, REST_POSE)
    expect(synced.clip).toBe('water')
    expect(synced.time).toBe(0)
  })

  it('reaches the full swing of a work clip even at 4x speed', () => {
    const clipSeconds = clipSecondsFor('till', 125)
    const { pose } = run('till', clipSeconds, clipSeconds / 2)
    const peak = poseAt('till', CLIP_SPEC.till.seconds / 2)
    expect(pose.shoulder).toBeGreaterThanOrEqual(peak.shoulder * 0.85)
  })
})
