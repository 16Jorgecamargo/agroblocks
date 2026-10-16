export type TutorialTarget = 'hud-goal' | 'hud-harvest' | 'hud-actions' | 'farm' | 'editor' | 'execution' | 'side'

export type SideTab = 'console' | 'hints' | 'pseudocode'

export type HowToId =
  | 'add-block'
  | 'snap-blocks'
  | 'delete-block'
  | 'open-pseudocode'
  | 'run-stop'
  | 'step-mode'
  | 'hints'
  | 'error-experiment'
  | 'fix'

export type CalloutSide = 'right' | 'left' | 'bottom' | 'top'

type SimpleSignalType = 'blockAdded' | 'blockRemoved' | 'hintRevealed' | 'stepModeOn' | 'stepped' | 'run' | 'stop' | 'error' | 'incomplete' | 'success'

export type TutorialSignal =
  | { type: SimpleSignalType }
  | { type: 'stackSize'; size: number }
  | { type: 'tabOpened'; tab: SideTab }

export type TutorialCondition =
  | { type: SimpleSignalType }
  | { type: 'stackSize'; atLeast: number }
  | { type: 'tabOpened'; tab: SideTab }

interface BaseStep {
  id: string
  title: string
  text: string
  onEnterTab?: SideTab
}

export type TutorialStep =
  | (BaseStep & { kind: 'intro' | 'outro' })
  | (BaseStep & { kind: 'tour'; targets: TutorialTarget[]; prefer?: CalloutSide })
  | (BaseStep & {
      kind: 'practice'
      targets: TutorialTarget[]
      prefer?: CalloutSide
      howTo: HowToId
      done: TutorialCondition[]
      followUps?: string[]
      notices?: Partial<Record<TutorialSignal['type'], string>>
    })
