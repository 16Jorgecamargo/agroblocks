export interface EfficiencyReference {
  referenceActions: number
  referenceBlocks: number
}

export type EfficiencyStars = 1 | 2 | 3

export function computeEfficiencyStars(
  actual: { actions: number; blocks: number },
  reference: EfficiencyReference,
): EfficiencyStars {
  const ratio = Math.max(actual.actions / reference.referenceActions, actual.blocks / reference.referenceBlocks)
  if (ratio <= 1.1) return 3
  if (ratio <= 1.5) return 2
  return 1
}
