export type RobotClip = 'idle' | 'move' | 'success' | 'error'

export function robotClipFor({ moving, failed, celebrating }: { moving: boolean; failed: boolean; celebrating: boolean }): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  if (moving) return 'move'
  return 'idle'
}
