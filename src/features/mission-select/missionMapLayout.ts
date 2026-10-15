function screenToWorld(horizontal: number, depth: number): [number, number] {
  return [(horizontal + depth) / 2, (depth - horizontal) / 2]
}

export const NODE_POSITIONS: [number, number][] = [0, 1, 2, 3, 4, 5, 6].map((index) =>
  screenToWorld(-12 + index * 4, index % 2 === 0 ? -2.5 : 2.5),
)

export function lockReason(order: number): string {
  return `Conclua a fase ${order - 1} para desbloquear.`
}
