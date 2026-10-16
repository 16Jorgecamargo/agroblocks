import type { HowToId, SideTab } from '@/features/tutorial/tutorialTypes'

export type ReplicaPart = 'toolbox' | 'workspace' | 'trash' | 'key' | 'run' | 'side' | 'farm'

export type HandMode = 'idle' | 'press' | 'drag'

export interface Point {
  x: number
  y: number
}

export interface ReplicaState {
  toolboxOpen: boolean
  stack: string[]
  dragging: string | null
  trashOpen: boolean
  selected: number | null
  highlight: number | null
  keyDown: boolean
  run: 'idle' | 'running' | 'stepping'
  stepMode: boolean
  robotCell: number
  robotHit: boolean
  harvested: boolean
  tab: SideTab
  consoleLines: string[]
  hintsShown: number
}

export interface HowToBeat {
  at: number
  hand: Point & { mode: HandMode }
  set?: Partial<ReplicaState>
}

export interface HowToSegment {
  label: string
  caption: string
  lengthMs: number
  initial: Partial<ReplicaState>
  beats: HowToBeat[]
}

export interface HowToScript {
  id: HowToId
  title: string
  parts: ReplicaPart[]
  segments: HowToSegment[]
}
