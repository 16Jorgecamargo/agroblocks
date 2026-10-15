import { blendPose, CLIP_SPEC, clipSecondsFor, poseAt, REST_POSE, staticPose, type RobotClip, type RobotPose } from '@/render/robot/robotPoses'

const NUMERIC = ['bodyY', 'bodyPitch', 'bodyRoll', 'headYaw', 'headPitch', 'shoulder', 'elbow', 'toolTilt', 'wheelSpin', 'wheelTwist', 'antennaGlow'] as const
const ALL: RobotClip[] = ['idle', 'move', 'turn', 'till', 'plant', 'water', 'harvest', 'collect', 'error', 'success']
const LOOPS = ALL.filter((clip) => CLIP_SPEC[clip].loop)
const ONE_SHOTS = ALL.filter((clip) => !CLIP_SPEC[clip].loop)

function expectSamePose(actual: RobotPose, expected: RobotPose) {
  for (const key of NUMERIC) expect(actual[key]).toBeCloseTo(expected[key], 6)
  expect(actual.eyes).toBe(expected.eyes)
  expect(actual.tool).toBe(expected.tool)
}

function differs(a: RobotPose, b: RobotPose): boolean {
  return NUMERIC.some((key) => Math.abs(a[key] - b[key]) > 0.01) || a.eyes !== b.eyes || a.tool !== b.tool
}

describe('robot poses', () => {
  it('loops idle, move and success and plays the work clips once', () => {
    expect([...LOOPS].sort()).toEqual(['idle', 'move', 'success'])
  })

  it.each(ALL.filter((clip) => clip !== 'idle'))('makes %s look different from idle halfway through', (clip) => {
    const half = CLIP_SPEC[clip].seconds / 2
    expect(differs(poseAt(clip, half), poseAt('idle', half))).toBe(true)
  })

  it.each(LOOPS)('repeats %s every cycle', (clip) => {
    const time = 0.37
    expectSamePose(poseAt(clip, time + CLIP_SPEC[clip].seconds), poseAt(clip, time))
  })

  it.each(ONE_SHOTS)('starts and ends %s at rest', (clip) => {
    expect(poseAt(clip, 0)).toEqual(REST_POSE)
    expect(poseAt(clip, CLIP_SPEC[clip].seconds)).toEqual(REST_POSE)
    expect(poseAt(clip, CLIP_SPEC[clip].seconds * 3)).toEqual(REST_POSE)
  })

  it('holds the right tool in the middle of each work clip', () => {
    const tools = Object.fromEntries(ONE_SHOTS.map((clip) => [clip, poseAt(clip, CLIP_SPEC[clip].seconds / 2).tool]))
    expect(tools).toEqual({ turn: 'none', till: 'hoe', plant: 'seedBag', water: 'wateringCan', harvest: 'claw', collect: 'none', error: 'none' })
  })

  it('shows expressive eyes', () => {
    expect(poseAt('error', CLIP_SPEC.error.seconds / 2).eyes).toBe('error')
    expect(poseAt('success', 0.2).eyes).toBe('happy')
    expect(poseAt('till', CLIP_SPEC.till.seconds / 2).eyes).toBe('focus')
  })

  it('spins the wheels in opposite directions when turning', () => {
    const pose = poseAt('turn', CLIP_SPEC.turn.seconds / 2)
    expect(pose.wheelTwist).toBeGreaterThan(0.5)
    expect(pose.wheelSpin).toBe(0)
  })

  it('blends poses from start to end', () => {
    const to = poseAt('water', CLIP_SPEC.water.seconds / 2)
    expectSamePose(blendPose(REST_POSE, to, 0), REST_POSE)
    expectSamePose(blendPose(REST_POSE, to, 1), to)
    expect(blendPose(REST_POSE, to, 0.5).shoulder).toBeCloseTo(to.shoulder / 2)
  })

  it('keeps a still pose with the right eyes when motion is reduced', () => {
    expect(staticPose('idle')).toEqual(REST_POSE)
    expect(staticPose('till')).toEqual(REST_POSE)
    expect(staticPose('error')).toEqual({ ...REST_POSE, eyes: 'error' })
    expect(staticPose('success')).toEqual({ ...REST_POSE, eyes: 'happy' })
  })

  it('fits one-shot clips inside the step even at 4x speed', () => {
    expect(clipSecondsFor('till', 150)).toBeLessThanOrEqual(0.15)
    expect(clipSecondsFor('till', 150)).toBeGreaterThan(0)
    expect(clipSecondsFor('till', 5000)).toBe(CLIP_SPEC.till.seconds)
    expect(clipSecondsFor('till', 0)).toBe(CLIP_SPEC.till.seconds)
    expect(clipSecondsFor('move', 150)).toBe(CLIP_SPEC.move.seconds)
  })
})
