import { itemsFor } from '@/data/assessment/items'
import { percent, scoreBySkill, scoreResponse } from '@/game/assessment/scoring'

describe('scoring', () => {
  it('counts the correct answers of one world test', () => {
    const items = itemsFor('cornfield', 'pre')
    const answers = Object.fromEntries(items.map((item, index) => [item.id, index === 0 ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
    expect(scoreResponse({ world: 'cornfield', form: 'pre', startedAt: '', completedAt: '', skipped: false, answers })).toEqual({ correct: 1, total: items.length })
  })

  it('splits the score by skill', () => {
    const items = itemsFor('cornfield', 'pre')
    const answers = Object.fromEntries(items.map((item) => [item.id, item.correctIndex]))
    const score = scoreBySkill({ world: 'cornfield', form: 'pre', startedAt: '', completedAt: '', skipped: false, answers })
    const total = (score?.build.total ?? 0) + (score?.predict.total ?? 0) + (score?.debug.total ?? 0)
    expect(total).toBe(items.length)
    expect(score?.build.correct).toBe(score?.build.total)
  })

  it('returns null when skipped', () => {
    expect(scoreResponse({ world: 'garden', form: 'pre', startedAt: '', completedAt: '', skipped: true, answers: {} })).toBeNull()
    expect(scoreBySkill({ world: 'garden', form: 'pre', startedAt: '', completedAt: '', skipped: true, answers: {} })).toBeNull()
  })

  it('turns scores into rounded percentages', () => {
    expect(percent({ correct: 1, total: 3 })).toBe(33)
    expect(percent({ correct: 0, total: 0 })).toBe(0)
  })
})
