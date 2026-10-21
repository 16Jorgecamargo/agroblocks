import { BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Euler, Float32BufferAttribute, IcosahedronGeometry, Matrix4, Quaternion, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { FeatureKind, WorldFeature } from '@/render/world/worldTypes'

type Triple = [number, number, number]

export function compose(position: Triple, rotation: Triple = [0, 0, 0], scale: Triple = [1, 1, 1]): Matrix4 {
  return new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale))
}

export function part(geometry: BufferGeometry, color: string, matrix: Matrix4): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone()
  flat.deleteAttribute('uv')
  flat.applyMatrix4(matrix)
  const tint = new Color(color)
  const colors = new Float32Array(flat.attributes.position.count * 3)
  for (let index = 0; index < colors.length; index += 3) colors.set([tint.r, tint.g, tint.b], index)
  flat.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return flat
}

export function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts)
  if (!merged) throw new Error('feature parts could not be merged')
  return merged
}

const CORN_LEAVES: Triple[] = [
  [0.35, 0, 1],
  [0.55, 2.3, 0.95],
  [0.78, 4.4, 0.9],
  [1.0, 1.2, 0.8],
  [1.2, 3.5, 0.7],
]

function cornStalk(): BufferGeometry[] {
  const lean = compose([0, 0, 0], [0.04, 0, 0.03])
  const parts: BufferGeometry[] = []
  for (const segment of [0, 1, 2]) {
    parts.push(part(new CylinderGeometry(0.032 - segment * 0.006, 0.042 - segment * 0.006, 0.5, 5), segment === 2 ? '#7aa63c' : '#5f9a32', lean.clone().multiply(compose([0, 0.25 + segment * 0.48, 0]))))
  }
  for (const [height, angle, length] of CORN_LEAVES) {
    const base = lean.clone().multiply(compose([0, height, 0], [0, angle, 0]))
    parts.push(part(new ConeGeometry(0.07, 0.62 * length, 3), '#6fae3b', base.multiply(compose([0.24 * length, -0.06, 0], [0, 0, -1.05], [1, 1, 0.22]))))
  }
  const ear = lean.clone().multiply(compose([0.07, 0.72, 0.03], [0, 0, -0.4]))
  parts.push(part(new CylinderGeometry(0.055, 0.06, 0.24, 6), '#f2c14e', ear))
  parts.push(part(new ConeGeometry(0.055, 0.1, 6), '#e8b33c', ear.clone().multiply(compose([0, 0.16, 0]))))
  parts.push(part(new ConeGeometry(0.07, 0.3, 4), '#86b94a', ear.clone().multiply(compose([0.02, -0.02, 0], [0, 0, 0], [1, 1, 0.6]))))
  for (const angle of [0, 1.6, 3.2, 4.7]) {
    parts.push(part(new ConeGeometry(0.02, 0.22, 3), '#d8b866', lean.clone().multiply(compose([Math.cos(angle) * 0.04, 1.5, Math.sin(angle) * 0.04], [Math.sin(angle) * 0.5, 0, Math.cos(angle) * -0.5]))))
  }
  return parts
}

function fruitTree(tint: string): BufferGeometry[] {
  const parts = [part(new CylinderGeometry(0.1, 0.14, 1, 6), '#7a5233', compose([0, 0.5, 0])), part(new IcosahedronGeometry(0.75, 0), '#3f8f3a', compose([0, 1.35, 0]))]
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2
    parts.push(part(new SphereGeometry(0.1, 6, 5), tint, compose([Math.cos(angle) * 0.62, 1.2 + (index % 2) * 0.3, Math.sin(angle) * 0.62])))
  }
  return parts
}

function greenhouse(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(3.2, 0.08, 2.2), '#b9a68a', compose([0, 0.04, 0]))]
  for (const x of [-1.5, 0, 1.5]) parts.push(part(new BoxGeometry(0.06, 1.9, 0.06), '#e8f2f0', compose([x, 0.95, 1.01])))
  for (const x of [-0.9, 0, 0.9]) parts.push(part(new BoxGeometry(0.7, 0.4, 1.4), '#6fae4a', compose([x, 0.3, 0])))
  return parts
}

function greenhouseGlass(): BufferGeometry[] {
  return [part(new BoxGeometry(3, 1.4, 2), '#cfeee8', compose([0, 0.75, 0])), part(new CylinderGeometry(0.6, 0.6, 3, 3, 1), '#cfeee8', compose([0, 1.75, 0], [0, 0, Math.PI / 2]))]
}

function vegetableBed(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.4, 0.24, 0.8), '#7a5233', compose([0, 0.12, 0]))]
  for (let index = 0; index < 6; index += 1) {
    parts.push(part(new IcosahedronGeometry(0.13, 0), index % 2 === 0 ? '#4f9a3a' : '#7fbf4d', compose([-0.45 + (index % 3) * 0.45, 0.32, index < 3 ? -0.18 : 0.18])))
  }
  return parts
}

function hayBale(): BufferGeometry[] {
  return [part(new CylinderGeometry(0.45, 0.45, 0.8, 10), '#e2c46a', compose([0, 0.45, 0], [0, 0, Math.PI / 2]))]
}

function trough(): BufferGeometry[] {
  return [part(new BoxGeometry(1.2, 0.44, 0.5), '#8a6a4a', compose([0, 0.22, 0])), part(new BoxGeometry(1.05, 0.04, 0.36), '#4c9be8', compose([0, 0.42, 0]))]
}

const DEFAULT_TINT = '#e0473c'

const BUILDERS: Record<FeatureKind, (tint: string) => BufferGeometry[]> = {
  cornStalk,
  fruitTree,
  greenhouse,
  vegetableBed,
  hayBale,
  trough,
}

const GLASS: Partial<Record<FeatureKind, () => BufferGeometry[]>> = {
  greenhouse: greenhouseGlass,
}

const cache = new Map<string, BufferGeometry>()

export function featureGeometry(kind: FeatureKind, tint?: string): BufferGeometry {
  const key = `${kind}|${tint ?? ''}`
  const cached = cache.get(key)
  if (cached) return cached
  const built = mergeParts(BUILDERS[kind](tint ?? DEFAULT_TINT))
  cache.set(key, built)
  return built
}

const glassCache = new Map<FeatureKind, BufferGeometry | null>()

export function featureGlass(kind: FeatureKind): BufferGeometry | null {
  if (!glassCache.has(kind)) {
    const builder = GLASS[kind]
    glassCache.set(kind, builder ? mergeParts(builder()) : null)
  }
  return glassCache.get(kind) ?? null
}

export function groupFeatures(features: WorldFeature[]): Map<string, WorldFeature[]> {
  const groups = new Map<string, WorldFeature[]>()
  for (const feature of features) {
    const key = `${feature.kind}|${feature.tint ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), feature])
  }
  return groups
}

export const SWAYING: ReadonlySet<FeatureKind> = new Set<FeatureKind>(['cornStalk', 'fruitTree'])
