import { Matrix4, Quaternion, Vector3 } from 'three'
import type { ModelId } from '@/render/models/manifest'
import type { PropItem } from '@/render/world/worldTypes'

const UP = new Vector3(0, 1, 0)

export function propMatrix(prop: PropItem, entry: { scale: number; yOffset: number; rotationY: number; stretchY?: number }): Matrix4 {
  const size = entry.scale * prop.scale
  const stretch = entry.stretchY ?? 1
  return new Matrix4().compose(
    new Vector3(prop.x, (prop.y ?? 0) + entry.yOffset * prop.scale * stretch, prop.z),
    new Quaternion().setFromAxisAngle(UP, prop.rotation + entry.rotationY),
    new Vector3(size, size * stretch, size),
  )
}

export function groupProps(props: PropItem[]): Map<ModelId, PropItem[]> {
  const groups = new Map<ModelId, PropItem[]>()
  for (const prop of props) {
    const list = groups.get(prop.model)
    if (list) list.push(prop)
    else groups.set(prop.model, [prop])
  }
  return groups
}
