import { ASSESSMENT_ITEMS, itemsForForm } from '@/data/assessment/items'
import { ASSESSMENT_CONCEPTS } from '@/game/assessment/types'
import { runProgram } from '@/blocks/interpreter/runProgram'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

describe('assessment items', () => {
  it('has ten items per form, two per concept', () => {
    for (const form of ['pre', 'post'] as const) {
      const items = itemsForForm(form)
      expect(items).toHaveLength(10)
      for (const concept of ASSESSMENT_CONCEPTS) expect(items.filter((item) => item.concept === concept)).toHaveLength(2)
    }
  })

  it('pairs every A item with a B item of the same concept and kind', () => {
    const byPair = new Map<string, typeof ASSESSMENT_ITEMS>()
    for (const item of ASSESSMENT_ITEMS) byPair.set(item.pairId, [...(byPair.get(item.pairId) ?? []), item])
    expect(byPair.size).toBe(10)
    for (const pair of byPair.values()) {
      expect(pair.map((item) => item.variant).sort()).toEqual(['A', 'B'])
      expect(pair[0].concept).toBe(pair[1].concept)
      expect(pair[0].kind).toBe(pair[1].kind)
      expect(pair[0].prompt).not.toBe(pair[1].prompt)
    }
  })

  it('has unique ids and valid answers', () => {
    expect(new Set(ASSESSMENT_ITEMS.map((item) => item.id)).size).toBe(ASSESSMENT_ITEMS.length)
    for (const item of ASSESSMENT_ITEMS) {
      expect(item.options.length).toBeGreaterThanOrEqual(3)
      expect(item.correctIndex).toBeGreaterThanOrEqual(0)
      expect(item.correctIndex).toBeLessThan(item.options.length)
      expect(new Set(item.options).size).toBe(item.options.length)
    }
  })

  it('has correct answers for the position prediction items, checked with the real engine', () => {
    const a = runProgram(
      program([act('moveForward'), act('moveForward'), act('turnRight'), act('moveForward')]),
      makeState(['. . . .', '. . . .', '. . . .', '. . . .'], { x: 0, y: 3, facing: 'N' }),
      { growTicks: 1, forbidWaterWet: false },
    )
    expect(a.state.robot).toMatchObject({ x: 1, y: 1 })
    const b = runProgram(
      program([act('turnLeft'), act('moveForward'), act('moveForward'), act('turnLeft'), act('moveForward')]),
      makeState(['. . . .', '. . . .', '. . . .', '. . . .'], { x: 0, y: 2, facing: 'S' }),
      { growTicks: 1, forbidWaterWet: false },
    )
    expect(b.state.robot).toMatchObject({ x: 2, y: 1 })
    const itemA = ASSESSMENT_ITEMS.find((item) => item.id === 'int-1-A')
    const itemB = ASSESSMENT_ITEMS.find((item) => item.id === 'int-1-B')
    expect(itemA?.options[itemA.correctIndex]).toBe('Coluna 2, linha 2')
    expect(itemB?.options[itemB.correctIndex]).toBe('Coluna 3, linha 2')
  })
})
