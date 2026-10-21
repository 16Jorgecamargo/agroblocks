import { Vector3 } from 'three'
import { ARM_LENGTH, CAN_SPOUT } from '@/render/world/actors/actorGeometry'
import type { ActorPose } from '@/render/world/actors/actorMotion'
import { armMatrices, bodyMatrix, canMatrix, limbs, spoutMatrix } from '@/render/world/actors/workerPose'

const pose = (moving: boolean, cycle = 0): ActorPose => ({ x: 2, z: -1, heading: 0.7, moving, cycle, travelled: 0 })
const forward = new Vector3(Math.sin(0.7), 0, Math.cos(0.7))

function setup(moving: boolean, cycle = 0) {
  const motion = limbs('water', pose(moving, cycle))
  const body = bodyMatrix(pose(moving, cycle), motion.bob)
  return { motion, body, can: canMatrix(body, motion) }
}

describe('watering can', () => {
  it('hangs upright from the hand while walking, without pouring', () => {
    for (const cycle of [0, 1, 2.5, 4]) {
      const { motion, can } = setup(true, cycle)
      const up = new Vector3(0, 1, 0).transformDirection(can)
      expect(up.y).toBeGreaterThan(0.99)
      expect(motion.pour ?? 0).toBe(0)
    }
  })

  it('stays in the right hand', () => {
    for (const moving of [true, false]) {
      const { motion, body, can } = setup(moving)
      const hand = new Vector3(0, -ARM_LENGTH, 0).applyMatrix4(armMatrices(body, motion)[1])
      expect(new Vector3().setFromMatrixPosition(can).distanceTo(hand)).toBeLessThan(0.01)
    }
  })

  it('tips forward while watering so the spout points down at the plant in front', () => {
    for (const cycle of [0, 1.3, 3.7]) {
      const { motion, can } = setup(false, cycle)
      expect(motion.pour).toBeGreaterThan(0.5)
      const spout = CAN_SPOUT.direction.clone().transformDirection(can)
      expect(spout.y).toBeLessThan(-0.2)
      expect(spout.dot(forward)).toBeGreaterThan(0.5)
    }
  })

  it('pours from the spout tip straight down to the ground', () => {
    const { motion, can } = setup(false, 1)
    const stream = spoutMatrix(can, motion)!
    const tip = CAN_SPOUT.tip.clone().applyMatrix4(can)
    expect(new Vector3().setFromMatrixPosition(stream).distanceTo(tip)).toBeLessThan(0.001)
    expect(new Vector3(0, 1, 0).transformDirection(stream).y).toBeGreaterThan(0.99)
    expect(tip.y).toBeGreaterThan(0.2)
    expect(spoutMatrix(setup(true).can, setup(true).motion)).toBeNull()
  })
})
