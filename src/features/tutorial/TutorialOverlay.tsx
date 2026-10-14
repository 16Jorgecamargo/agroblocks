import type { ExecutionSnapshot } from '@/game/execution/types'

export function TutorialOverlay(props: { snapshot: ExecutionSnapshot; blockEvent: { kind: 'added' | 'removed'; id: number } | null }) {
  return <div data-status={props.snapshot.status} />
}
