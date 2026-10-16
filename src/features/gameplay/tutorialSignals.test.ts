import { tabSignals } from '@/features/gameplay/tutorialSignals'

describe('tabSignals', () => {
  it('reports the opened tab', () => {
    expect(tabSignals('pseudocode', true)).toEqual([{ type: 'tabOpened', tab: 'pseudocode' }])
    expect(tabSignals('hints', true)).toEqual([{ type: 'tabOpened', tab: 'hints' }])
  })

  it('counts opening Dicas as a reveal when no more hints can be revealed', () => {
    expect(tabSignals('hints', false)).toEqual([{ type: 'tabOpened', tab: 'hints' }, { type: 'hintRevealed' }])
  })
})
