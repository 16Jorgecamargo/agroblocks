import { Quaternion, Vector3 } from 'three'
import { groupProps, propMatrix } from '@/render/world/instancing'

describe('instancing helpers', () => {
  it('places, rotates and scales a prop using its manifest fit', () => {
    const matrix = propMatrix({ model: 'tree-a', x: 3, z: -2, rotation: Math.PI / 2, scale: 2 }, { scale: 0.5, yOffset: 0.1, rotationY: 0 })
    const position = new Vector3()
    const rotation = new Quaternion()
    const scale = new Vector3()
    matrix.decompose(position, rotation, scale)
    expect(position.x).toBeCloseTo(3)
    expect(position.y).toBeCloseTo(0.2)
    expect(position.z).toBeCloseTo(-2)
    expect(scale.x).toBeCloseTo(1)
    expect(new Vector3(1, 0, 0).applyQuaternion(rotation).z).toBeCloseTo(-1)
  })

  it('groups props by model', () => {
    const groups = groupProps([
      { model: 'tree-a', x: 0, z: 0, rotation: 0, scale: 1 },
      { model: 'cow', x: 1, z: 1, rotation: 0, scale: 1 },
      { model: 'tree-a', x: 2, z: 2, rotation: 0, scale: 1 },
    ])
    expect(groups.get('tree-a')).toHaveLength(2)
    expect(groups.get('cow')).toHaveLength(1)
  })

  it('stretches a prop vertically when its manifest asks for it', () => {
    const matrix = propMatrix({ model: 'fence', x: 0, z: 0, rotation: 0, scale: 1 }, { scale: 0.5, yOffset: 0, rotationY: 0, stretchY: 2 })
    const position = new Vector3()
    const rotation = new Quaternion()
    const scale = new Vector3()
    matrix.decompose(position, rotation, scale)
    expect(scale.x).toBeCloseTo(0.5)
    expect(scale.y).toBeCloseTo(1)
  })
})
