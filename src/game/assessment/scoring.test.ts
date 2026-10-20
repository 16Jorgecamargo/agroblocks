import { percent, scoreResponse } from '@/game/assessment/scoring'
import { itemsForForm } from '@/data/assessment/items'

describe('scoring', () => {
  it('scores answers per concept', () => {
    const items = itemsForForm('pre')
    const answers = Object.fromEntries(items.map((item, index) => [item.id, index < 4 ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
    const score = scoreResponse({ world: 'garden', form: 'pre', startedAt: '', completedAt: '', skipped: false, answers })
    expect(score?.sequencing).toEqual({ correct: 2, total: 2 })
    expect(score?.repetition).toEqual({ correct: 2, total: 2 })
    expect(score?.conditionals).toEqual({ correct: 0, total: 2 })
  })

  it('counts unanswered items as wrong and returns null when skipped', () => {
    expect(scoreResponse({ world: 'garden', form: 'post', startedAt: '', completedAt: '', skipped: false, answers: {} })?.debugging).toEqual({ correct: 0, total: 2 })
    expect(scoreResponse({ world: 'garden', form: 'pre', startedAt: '', completedAt: '', skipped: true, answers: {} })).toBeNull()
  })

  it('converts to rounded percentages', () => {
    expect(percent({ correct: 1, total: 3 })).toBe(33)
    expect(percent({ correct: 0, total: 0 })).toBe(0)
  })
})
