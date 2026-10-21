import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { ARM_LENGTH, HIP, HIP_SPREAD, SHOULDER, SHOULDER_SPREAD } from '@/render/world/actors/actorGeometry'
import type { ActorPose } from '@/render/world/actors/actorMotion'
import type { ActorTask } from '@/render/world/worldTypes'

export interface Limbs {
  legs: [number, number]
  arms: [number, number]
  bob: number
  seated: boolean
}

export function limbs(task: ActorTask, pose: ActorPose): Limbs {
  const swing = Math.sin(pose.cycle)
  if (task === 'drive') return { legs: [-1.45, -1.45], arms: [-1.05 + swing * 0.03, -1.05 - swing * 0.03], bob: 0, seated: true }
  if (pose.moving) {
    const legs: [number, number] = [swing * 0.55, -swing * 0.55]
    const bob = Math.abs(swing) * 0.025
    if (task === 'carry') return { legs, arms: [-1.15, -1.15], bob, seated: false }
    return { legs, arms: [-swing * 0.45, swing * 0.45], bob, seated: false }
  }
  if (task === 'hoe' || task === 'tend') {
    const stroke = -0.55 - 0.75 * (0.5 + 0.5 * Math.sin(pose.cycle * 0.8))
    return { legs: [0.12, -0.12], arms: [stroke, stroke], bob: 0, seated: false }
  }
  if (task === 'water') return { legs: [0, 0], arms: [0.08, -1.0 + Math.sin(pose.cycle * 0.6) * 0.06], bob: 0, seated: false }
  if (task === 'pick') return { legs: [0, 0], arms: [-2.3 + 0.35 * Math.sin(pose.cycle + 2), -2.6 + 0.35 * Math.sin(pose.cycle)], bob: 0, seated: false }
  if (task === 'feed') return { legs: [0, 0], arms: [-0.55, -0.3 - 1.4 * Math.max(0, Math.sin(pose.cycle * 0.8))], bob: 0, seated: false }
  if (task === 'carry') return { legs: [0, 0], arms: [-1.15, -1.15], bob: 0, seated: false }
  return { legs: [0, 0], arms: [Math.sin(pose.cycle * 0.5) * 0.05, -Math.sin(pose.cycle * 0.5) * 0.05], bob: 0, seated: false }
}

const UP = new Vector3(0, 1, 0)

export function bodyMatrix(pose: ActorPose, bob: number, parent?: Matrix4): Matrix4 {
  const local = new Matrix4().compose(new Vector3(pose.x, bob, pose.z), new Quaternion().setFromAxisAngle(UP, pose.heading), new Vector3(1, 1, 1))
  return parent ? parent.clone().multiply(local) : local
}

export function jointMatrix(body: Matrix4, x: number, y: number, angle: number): Matrix4 {
  return body.clone().multiply(new Matrix4().compose(new Vector3(x, y, 0), new Quaternion().setFromEuler(new Euler(angle, 0, 0)), new Vector3(1, 1, 1)))
}

export function legMatrices(body: Matrix4, limbs: Limbs): [Matrix4, Matrix4] {
  return [jointMatrix(body, -HIP_SPREAD, HIP, limbs.legs[0]), jointMatrix(body, HIP_SPREAD, HIP, limbs.legs[1])]
}

export function armMatrices(body: Matrix4, limbs: Limbs): [Matrix4, Matrix4] {
  return [jointMatrix(body, -SHOULDER_SPREAD, SHOULDER, limbs.arms[0]), jointMatrix(body, SHOULDER_SPREAD, SHOULDER, limbs.arms[1])]
}

export function handMatrix(arm: Matrix4): Matrix4 {
  return arm.clone().multiply(new Matrix4().makeTranslation(0, -ARM_LENGTH, 0))
}
