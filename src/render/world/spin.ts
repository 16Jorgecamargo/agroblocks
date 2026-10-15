export type Axis = 'x' | 'y' | 'z'

export function spinAxis(size: [number, number, number]): Axis {
  const [x, y, z] = size
  if (x <= y && x <= z) return 'x'
  if (y <= z) return 'y'
  return 'z'
}
