# Phase 3 — Reference robot with tool animations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 3. Note: `RobotPose` gains one field the spec did not list, `wheelTwist` (left wheel `wheelSpin + wheelTwist`, right wheel `wheelSpin - wheelTwist`), so `turn` can spin the wheels in opposite directions.

### Task 3.1: Pure pose engine and clip selection

**Files:**
- Create: `src/render/robot/robotPoses.ts`, `src/render/robot/robotPoses.test.ts`, `src/render/robot/clipForStep.ts`, `src/render/robot/clipForStep.test.ts`

**Interfaces:**
- Produces:
  - `type RobotClip = 'idle' | 'move' | 'turn' | 'till' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'`
  - `type RobotTool = 'none' | 'hoe' | 'seedBag' | 'wateringCan' | 'claw' | 'crate'`, `ROBOT_TOOLS: readonly RobotTool[]`
  - `type EyeShape = 'normal' | 'happy' | 'focus' | 'error' | 'blink'`, `EYE_SHAPES: readonly EyeShape[]`
  - `interface RobotPose { bodyY; bodyPitch; bodyRoll; headYaw; headPitch; shoulder; elbow; toolTilt; wheelSpin; wheelTwist; antennaGlow: number; eyes: EyeShape; tool: RobotTool }`
  - `REST_POSE`, `CLIP_SPEC: Record<RobotClip, { loop: boolean; seconds: number; tool: RobotTool }>`
  - `poseAt(clip, time): RobotPose`, `blendPose(from, to, amount): RobotPose`, `staticPose(clip): RobotPose`, `clipSecondsFor(clip, durationMs): number`
  - `clipForStep({ events, failed, celebrating, moving }): RobotClip`
- Consumed by: Task 3.2.

- [ ] **Step 1: Write the failing tests**

`src/render/robot/robotPoses.test.ts`:
```ts
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
    expect(LOOPS.sort()).toEqual(['idle', 'move', 'success'])
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
```

`src/render/robot/clipForStep.test.ts`:
```ts
import { clipForStep } from '@/render/robot/clipForStep'
import type { GameEvent } from '@/game/world/types'

const still = { failed: false, celebrating: false, moving: false }

function plot(to: 'tilled' | 'seeded' | 'growing' | 'mature' | 'harvested'): GameEvent {
  return { type: 'plotChanged', x: 0, y: 0, from: 'untilled', to }
}

describe('clipForStep', () => {
  it('puts failure first and celebration second', () => {
    expect(clipForStep({ events: [plot('tilled')], failed: true, celebrating: true, moving: true })).toBe('error')
    expect(clipForStep({ events: [plot('tilled')], failed: false, celebrating: true, moving: true })).toBe('success')
  })

  it('maps each farm action to its clip', () => {
    expect(clipForStep({ ...still, events: [plot('tilled')] })).toBe('till')
    expect(clipForStep({ ...still, events: [plot('seeded')] })).toBe('plant')
    expect(clipForStep({ ...still, events: [{ type: 'moistureChanged', x: 0, y: 0, moisture: 'wet' }] })).toBe('water')
    expect(clipForStep({ ...still, events: [plot('harvested')] })).toBe('harvest')
    expect(clipForStep({ ...still, events: [{ type: 'resourcesCollected', resource: 'water', amount: 3 }] })).toBe('collect')
    expect(clipForStep({ ...still, events: [{ type: 'robotTurned', facing: 'N' }] })).toBe('turn')
  })

  it('ignores growth and drying that happen during a move', () => {
    const events: GameEvent[] = [
      { type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
      plot('growing'),
      plot('mature'),
      { type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' },
    ]
    expect(clipForStep({ ...still, events })).toBe('idle')
    expect(clipForStep({ ...still, events, moving: true })).toBe('move')
  })

  it('stops driving once the move has finished even if the event is still there', () => {
    expect(clipForStep({ ...still, events: [{ type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }] })).toBe('idle')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/robot`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the pose engine**

`src/render/robot/robotPoses.ts`:
```ts
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
```

`src/render/robot/clipForStep.ts`:
```ts
import type { GameEvent } from '@/game/world/types'
import type { RobotClip } from '@/render/robot/robotPoses'

interface StepInput {
  events: GameEvent[]
  failed: boolean
  celebrating: boolean
  moving: boolean
}

function workClip(event: GameEvent): RobotClip | null {
  if (event.type === 'plotChanged' && event.to === 'tilled') return 'till'
  if (event.type === 'plotChanged' && event.to === 'seeded') return 'plant'
  if (event.type === 'plotChanged' && event.to === 'harvested') return 'harvest'
  if (event.type === 'moistureChanged' && event.moisture === 'wet') return 'water'
  if (event.type === 'resourcesCollected') return 'collect'
  if (event.type === 'robotTurned') return 'turn'
  return null
}

export function clipForStep({ events, failed, celebrating, moving }: StepInput): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  for (const event of events) {
    const clip = workClip(event)
    if (clip) return clip
  }
  return moving ? 'move' : 'idle'
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/render/robot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/robot
git commit -m "feat(robot): pure pose engine with ten clips and step-based clip selection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3.2: Procedural robot rig and wiring

**Files:**
- Create: `src/render/robot/RobotRig.tsx`, `src/render/robot/AnimatedRobot.tsx`
- Modify: `src/render/farm3d/RobotModel.tsx`, `src/render/farm3d/FarmScene.tsx`, `src/features/home/HomeLandscape.tsx`, `src/features/results/CelebrationScene.tsx`, `src/render/models/manifest.ts`, `src/render/models/manifest.test.ts`, `src/render/models/generatedModels.test.ts`
- Delete: `src/render/models/modelChoice.ts`, `src/render/models/modelChoice.test.ts`

**Interfaces:**
- Consumes: Task 3.1 exports.
- Produces: `<RobotRig pose failed tool />`; `<AnimatedRobot clip playKey clipSeconds reducedMotion failed tool />`; `RobotShowcase({ clip, tool?, reducedMotion? })` still exported from `@/render/farm3d/RobotModel`; `RobotModel` gains props `events: GameEvent[]` and `eventKey: number`.

- [ ] **Step 1: Write the failing tests**

In `src/render/models/manifest.test.ts`, change the first test to:
```ts
  it('lists the models the scene needs without crop or robot models', () => {
    expect(REQUIRED_MODEL_IDS).not.toContain('robot')
    expect(REQUIRED_MODEL_IDS.filter((id) => id.startsWith('crop-'))).toHaveLength(0)
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/render/models/manifest.test.ts`
Expected: FAIL — `REQUIRED_MODEL_IDS` contains `robot`.

- [ ] **Step 3: Drop the robot model id**

- `src/render/models/manifest.ts`: delete `'robot'` from `REQUIRED_MODEL_IDS`.
- `src/render/models/generatedModels.test.ts`: delete the test `'maps the four robot clips'`; in `'keeps proportions between the robot, a cow and the big barn'` rename it to `'measures a cow and the big barn'` and delete the line `expect(height('robot')).toBeGreaterThan(0)`.
- Delete `src/render/models/modelChoice.ts` and `src/render/models/modelChoice.test.ts`.

- [ ] **Step 4: Robot rig**

`src/render/robot/RobotRig.tsx`:
```tsx
import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, type Group, type MeshStandardMaterial } from 'three'
import { Flat } from '@/render/farm3d/materials'
import { PALETTE } from '@/render/palette'
import { EYE_SHAPES, ROBOT_TOOLS, type EyeShape, type RobotPose, type RobotTool } from '@/render/robot/robotPoses'

const BODY_Y = 0.2
const HAND_TOOLS: RobotTool[] = ['hoe', 'seedBag', 'wateringCan', 'claw']
const EYE_COLOR = new Color(PALETTE.robotEye)
const ERROR_COLOR = new Color(PALETTE.error)

function EyeMark({ shape }: { shape: EyeShape }) {
  const color = shape === 'error' ? PALETTE.error : PALETTE.robotEye
  if (shape === 'happy') {
    return (
      <mesh>
        <torusGeometry args={[0.045, 0.014, 6, 12, Math.PI]} />
        <meshBasicMaterial color={color} />
      </mesh>
    )
  }
  if (shape === 'error') {
    return (
      <>
        {[Math.PI / 4, -Math.PI / 4].map((angle) => (
          <mesh key={angle} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.11, 0.022, 0.01]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </>
    )
  }
  if (shape === 'blink') {
    return (
      <mesh>
        <boxGeometry args={[0.1, 0.016, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
    )
  }
  return (
    <mesh scale={[1, shape === 'focus' ? 0.45 : 1, 1]}>
      <circleGeometry args={[0.055, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Tool({ tool }: { tool: RobotTool }) {
  if (tool === 'hoe') {
    return (
      <>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.34, 6]} />
          <Flat color={PALETTE.woodFrame} />
        </mesh>
        <mesh position={[0, -0.32, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.03, 0.1]} />
          <Flat color={PALETTE.metal} />
        </mesh>
      </>
    )
  }
  if (tool === 'seedBag') {
    return (
      <>
        <mesh position={[0, -0.09, 0]} scale={[1, 1.1, 0.9]} castShadow>
          <sphereGeometry args={[0.08, 8, 6]} />
          <Flat color={PALETTE.sack} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 0.03, 6]} />
          <Flat color={PALETTE.woodFrame} />
        </mesh>
      </>
    )
  }
  if (tool === 'wateringCan') {
    return (
      <>
        <mesh position={[0, -0.09, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 10]} />
          <Flat color={PALETTE.water} />
        </mesh>
        <mesh position={[0, -0.08, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.018, 0.14, 6]} />
          <Flat color={PALETTE.water} />
        </mesh>
      </>
    )
  }
  if (tool === 'claw') {
    return (
      <>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.1, 0.03, 0.06]} />
          <Flat color={PALETTE.metal} />
        </mesh>
        {[-0.035, 0.035].map((x) => (
          <mesh key={x} position={[x, -0.08, 0]}>
            <boxGeometry args={[0.025, 0.1, 0.025]} />
            <Flat color={PALETTE.metal} />
          </mesh>
        ))}
      </>
    )
  }
  if (tool === 'crate') {
    return (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.18, 0.24]} />
          <Flat color={PALETTE.crate} />
        </mesh>
        {[-0.11, -0.03, 0.05, 0.12].map((x, index) => (
          <mesh key={x} position={[x, 0.12, (index % 2) * 0.08 - 0.04]}>
            <icosahedronGeometry args={[0.06, 1]} />
            <Flat color={PALETTE.fruit} />
          </mesh>
        ))}
      </>
    )
  }
  return null
}

function Wheel() {
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
        <Flat color={PALETTE.wheel} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.13, 8]} />
        <Flat color={PALETTE.metal} />
      </mesh>
    </>
  )
}

interface RobotRigProps {
  pose: MutableRefObject<RobotPose>
  failed?: boolean
  tool?: RobotTool
}

export function RobotRig({ pose, failed = false, tool }: RobotRigProps) {
  const body = useRef<Group>(null)
  const head = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const leftWheel = useRef<Group>(null)
  const rightWheel = useRef<Group>(null)
  const antenna = useRef<MeshStandardMaterial>(null)
  const eyes = useRef<Partial<Record<EyeShape, Group | null>>>({})
  const tools = useRef<Partial<Record<RobotTool, Group | null>>>({})

  useFrame(() => {
    const current = pose.current
    if (body.current) {
      body.current.position.y = BODY_Y + current.bodyY
      body.current.rotation.x = current.bodyPitch
      body.current.rotation.z = current.bodyRoll
    }
    if (head.current) {
      head.current.rotation.y = current.headYaw
      head.current.rotation.x = current.headPitch
    }
    if (shoulder.current) shoulder.current.rotation.x = -current.shoulder
    if (elbow.current) elbow.current.rotation.x = -current.elbow
    if (hand.current) hand.current.rotation.x = -current.toolTilt
    if (leftWheel.current) leftWheel.current.rotation.x = current.wheelSpin + current.wheelTwist
    if (rightWheel.current) rightWheel.current.rotation.x = current.wheelSpin - current.wheelTwist
    const shownEyes = failed ? 'error' : current.eyes
    for (const shape of EYE_SHAPES) {
      const node = eyes.current[shape]
      if (node) node.visible = shape === shownEyes
    }
    const shownTool = tool ?? current.tool
    for (const item of ROBOT_TOOLS) {
      const node = tools.current[item]
      if (node) node.visible = item === shownTool
    }
    if (antenna.current) {
      antenna.current.emissive.copy(shownEyes === 'error' ? ERROR_COLOR : EYE_COLOR)
      antenna.current.emissiveIntensity = current.antennaGlow * 1.5
    }
  })

  return (
    <group>
      <group ref={leftWheel} position={[-0.34, 0.2, 0]}>
        <Wheel />
      </group>
      <group ref={rightWheel} position={[0.34, 0.2, 0]}>
        <Wheel />
      </group>
      <mesh position={[0, 0.07, -0.2]} castShadow>
        <sphereGeometry args={[0.07, 10, 8]} />
        <Flat color={PALETTE.wheel} />
      </mesh>
      <group ref={body} position={[0, BODY_Y, 0]}>
        <RoundedBox args={[0.56, 0.36, 0.46]} radius={0.08} smoothness={3} position={[0, 0.2, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.robotBody} roughness={0.5} emissive={failed ? PALETTE.error : '#000000'} emissiveIntensity={failed ? 0.25 : 0} />
        </RoundedBox>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.58, 0.06, 0.48]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.08, 8]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <group ref={head} position={[0, 0.46, 0]}>
          <RoundedBox args={[0.52, 0.38, 0.44]} radius={0.1} smoothness={3} position={[0, 0.19, 0]} castShadow>
            <meshStandardMaterial color={PALETTE.robotBody} roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[0.42, 0.24, 0.04]} radius={0.05} smoothness={2} position={[0, 0.2, 0.215]}>
            <meshStandardMaterial color={PALETTE.robotVisor} roughness={0.3} />
          </RoundedBox>
          {EYE_SHAPES.map((shape) => (
            <group
              key={shape}
              ref={(node) => {
                eyes.current[shape] = node
              }}
              position={[0, 0.2, 0.24]}
              visible={shape === 'normal'}
            >
              {[-0.1, 0.1].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                  <EyeMark shape={shape} />
                </group>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
            <Flat color={PALETTE.robotTrim} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial ref={antenna} color={PALETTE.robotEye} emissive={PALETTE.robotEye} emissiveIntensity={0.6} />
          </mesh>
        </group>
        <mesh position={[-0.32, 0.22, 0.02]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.22, 0.07]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <group ref={shoulder} position={[0.32, 0.32, 0.02]}>
          <mesh>
            <sphereGeometry args={[0.05, 8, 6]} />
            <Flat color={PALETTE.robotTrim} />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.07, 0.2, 0.07]} />
            <Flat color={PALETTE.robotBody} />
          </mesh>
          <group ref={elbow} position={[0, -0.2, 0]}>
            <mesh position={[0, -0.09, 0]} castShadow>
              <boxGeometry args={[0.06, 0.18, 0.06]} />
              <Flat color={PALETTE.robotTrim} />
            </mesh>
            <group ref={hand} position={[0, -0.19, 0]}>
              {HAND_TOOLS.map((item) => (
                <group
                  key={item}
                  ref={(node) => {
                    tools.current[item] = node
                  }}
                  visible={false}
                >
                  <Tool tool={item} />
                </group>
              ))}
            </group>
          </group>
        </group>
        <group
          ref={(node) => {
            tools.current.crate = node
          }}
          position={[0, 0.3, 0.36]}
          visible={false}
        >
          <Tool tool="crate" />
        </group>
      </group>
    </group>
  )
}
```

- [ ] **Step 5: Clip player**

`src/render/robot/AnimatedRobot.tsx`:
```tsx
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
```

- [ ] **Step 6: Rewire `RobotModel.tsx`**

Replace `src/render/farm3d/RobotModel.tsx` with:
```tsx
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { BASE_STEP_DELAY_MS } from '@/game/execution/types'
import { ERROR_SHAKE } from '@/motion/presets'
import { scaleSpring, SPRINGS } from '@/motion/springs'
import { PALETTE } from '@/render/palette'
import { shakeTrack } from '@/render/farm3d/robotMotion'
import { AnimatedRobot } from '@/render/robot/AnimatedRobot'
import { clipForStep } from '@/render/robot/clipForStep'
import { clipSecondsFor, type RobotClip, type RobotTool } from '@/render/robot/robotPoses'
import { cellToWorld, FACING_YAW } from '@/render/sceneLayout'
import type { GameEvent, Robot } from '@/game/world/types'

export function RobotShowcase({ clip, tool, reducedMotion = false }: { clip: RobotClip; tool?: RobotTool; reducedMotion?: boolean }) {
  return <AnimatedRobot clip={clip} reducedMotion={reducedMotion} tool={tool} />
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

interface RobotModelProps {
  robot: Robot
  events: GameEvent[]
  eventKey: number
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
  celebrating: boolean
  reducedMotion: boolean
}

export function RobotModel({ robot, events, eventKey, gridWidth, gridHeight, durationMs, failed, celebrating, reducedMotion }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const [moving, setMoving] = useState(false)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const [initial] = useState(() => ({ x: target.x, z: target.z, yaw: FACING_YAW[robot.facing] }))
  const speed = durationMs > 0 ? BASE_STEP_DELAY_MS / durationMs : 1
  const clip = clipForStep({ events, failed, celebrating, moving })

  useEffect(() => {
    const group = ref.current
    if (!group) return
    const yaw = FACING_YAW[robot.facing]
    if (reducedMotion || durationMs <= 0) {
      group.position.set(target.x, 0.18, target.z)
      group.rotation.y = yaw
      setMoving(false)
      return
    }
    setMoving(true)
    const move = animate(group.position, { x: target.x, z: target.z }, scaleSpring(SPRINGS.smooth, speed))
    const turn = animate(group.rotation, { y: shortestAngle(group.rotation.y, yaw) }, scaleSpring(SPRINGS.snap, speed))
    Promise.all([move, turn]).then(() => setMoving(false))
    return () => {
      move.stop()
      turn.stop()
      setMoving(false)
    }
  }, [target.x, target.z, robot.facing, reducedMotion, durationMs, speed])

  useEffect(() => {
    const group = ref.current
    if (!group || !failed || reducedMotion) return
    group.position.z = target.z
    const shake = animate(group.position, { x: shakeTrack(target.x) }, ERROR_SHAKE.options)
    return () => shake.stop()
  }, [failed, reducedMotion, target.x, target.z])

  return (
    <group ref={ref} position={[initial.x, 0.18, initial.z]} rotation={[0, initial.yaw, 0]}>
      <AnimatedRobot clip={clip} playKey={eventKey} clipSeconds={clipSecondsFor(clip, durationMs)} reducedMotion={reducedMotion} failed={failed} />
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
```

- `src/render/farm3d/FarmScene.tsx`: add `events={lastEvents}` and `eventKey={eventKey}` to `<RobotModel … />`.
- `src/features/home/HomeLandscape.tsx`: change `<RobotShowcase clip="idle" />` to `<RobotShowcase clip="idle" reducedMotion={!ambient} />`.
- `src/features/results/CelebrationScene.tsx`: change `<RobotShowcase clip="success" />` to `<RobotShowcase clip="success" tool="crate" reducedMotion={reducedMotion} />` (the whole scene is rebuilt in Task 6.2).

Run: `grep -rn "modelChoice\|RobotBody\|robotClipFor\|modelEntry('robot')" src`
Expected: no lines.

- [ ] **Step 7: Typecheck and full unit suite**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 8: Visual check of every clip**

Dev server on 5179; open `#/jogar/m2-row-planting` (3D, full motion), build a program with *preparar solo*, *plantar semente*, *mover para frente*, *virar à direita* and run at 1x and 4x; open `#/jogar/m3-smart-irrigation` for *regar canteiro*, `#/jogar/m4-auto-harvest` for *colher planta*, `#/jogar/m5-limited-resources` for *coletar recursos*; force an error by moving into a rock. Each action shows its tool and returns to rest; at 4x arms do not freeze mid-swing; error shows red X eyes and red antenna while the error persists. Home (`#/`) robot idles. Close the browser.

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat(robot): procedural reference robot with arm tools, expressive eyes and per-action clips

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3.3: Soil burst effect and effect mapping

**Files:**
- Create: `src/render/farm3d/effectKind.ts`, `src/render/farm3d/effectKind.test.ts`
- Modify: `src/render/farm3d/Effects.tsx`

**Interfaces:**
- Produces: `type EffectKind = 'soil' | 'seed' | 'water' | 'harvest'`; `effectKind(event: GameEvent): EffectKind | null`.

- [ ] **Step 1: Write the failing test**

`src/render/farm3d/effectKind.test.ts`:
```ts
import { effectKind } from '@/render/farm3d/effectKind'

describe('effectKind', () => {
  it('maps farm events to particle effects', () => {
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'untilled', to: 'tilled' })).toBe('soil')
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'tilled', to: 'seeded' })).toBe('seed')
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'mature', to: 'harvested' })).toBe('harvest')
    expect(effectKind({ type: 'moistureChanged', x: 0, y: 0, moisture: 'wet' })).toBe('water')
  })

  it('shows nothing for growth, drying or movement', () => {
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' })).toBeNull()
    expect(effectKind({ type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' })).toBeNull()
    expect(effectKind({ type: 'robotTurned', facing: 'N' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/render/farm3d/effectKind.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/render/farm3d/effectKind.ts`:
```ts
import type { GameEvent } from '@/game/world/types'

export type EffectKind = 'soil' | 'seed' | 'water' | 'harvest'

export function effectKind(event: GameEvent): EffectKind | null {
  if (event.type === 'plotChanged' && event.to === 'tilled') return 'soil'
  if (event.type === 'plotChanged' && event.to === 'seeded') return 'seed'
  if (event.type === 'plotChanged' && event.to === 'harvested') return 'harvest'
  if (event.type === 'moistureChanged' && event.moisture === 'wet') return 'water'
  return null
}
```

In `src/render/farm3d/Effects.tsx`:
- Add `import { effectKind } from '@/render/farm3d/effectKind'`.
- Add the component after `SeedDrop`:
```tsx
function SoilBurst({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = group.children.map((child, index) => {
      const angle = (index / group.children.length) * Math.PI * 2
      return animate(child.position, { x: [0, Math.cos(angle) * 0.35], y: [0.2, 0.5, 0.18], z: [0, Math.sin(angle) * 0.35] }, { duration: seconds, ease: EASINGS.easeOutCubic })
    })
    Promise.all(controls).then(finish)
    return () => controls.forEach((control) => control.stop())
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 0, z]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[0, 0.2, 0]}>
          <dodecahedronGeometry args={[0.045, 0]} />
          <meshBasicMaterial color={PALETTE.soilTilled} />
        </mesh>
      ))}
    </group>
  )
}
```
- Replace the body of the `events.map` callback in `EffectsLayer` with:
```tsx
        const kind = effectKind(event)
        if (!kind || !('x' in event)) return null
        const key = `${eventKey}-${index}`
        const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
        if (kind === 'water') return <WaterSplash key={key} x={point.x} z={point.z} seconds={seconds} />
        if (kind === 'harvest') return <HarvestPop key={key} x={point.x} z={point.z} seconds={seconds} />
        if (kind === 'seed') return <SeedDrop key={key} x={point.x} z={point.z} seconds={seconds} />
        return <SoilBurst key={key} x={point.x} z={point.z} seconds={seconds} />
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/farm3d
git commit -m "feat(effects): soil burst when preparing soil and a single event-to-effect mapping

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
