import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'

export function tabSignals(tab: SideTab, canRevealHint: boolean): TutorialSignal[] {
  const signals: TutorialSignal[] = [{ type: 'tabOpened', tab }]
  if (tab === 'hints' && !canRevealHint) signals.push({ type: 'hintRevealed' })
  return signals
}
