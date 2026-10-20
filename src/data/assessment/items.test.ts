import { ASSESSMENT_ITEMS, itemsFor } from '@/data/assessment/items'
import { WORLD_IDS, type WorldId } from '@/game/worlds/worldTypes'
import { runProgram } from '@/blocks/interpreter/runProgram'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'

const READY_WORLDS: WorldId[] = ['garden']

describe('assessment items', () => {
  it.each(READY_WORLDS.length > 0 ? READY_WORLDS : (['none'] as const))('%s has ten paired items per form, 4 build, 3 predict, 3 debug', (world) => {
    if (world === 'none') return
    for (const form of ['pre', 'post'] as const) {
      const items = itemsFor(world, form)
      expect(items).toHaveLength(10)
      expect(items.filter((item) => item.skill === 'build')).toHaveLength(4)
      expect(items.filter((item) => item.skill === 'predict')).toHaveLength(3)
      expect(items.filter((item) => item.skill === 'debug')).toHaveLength(3)
    }
  })

  it('groups every item under a known world with ids made of world, pair and variant', () => {
    for (const item of ASSESSMENT_ITEMS) {
      expect(WORLD_IDS).toContain(item.world)
      expect(item.id).toBe(`${item.pairId}-${item.variant}`)
      expect(item.pairId.startsWith(`${item.world}-`)).toBe(true)
    }
  })

  it('pairs every A item with a B item of the same concept and kind', () => {
    const byPair = new Map<string, typeof ASSESSMENT_ITEMS>()
    for (const item of ASSESSMENT_ITEMS) byPair.set(item.pairId, [...(byPair.get(item.pairId) ?? []), item])
    for (const pair of byPair.values()) {
      expect(pair.map((item) => item.variant).sort()).toEqual(['A', 'B'])
      expect(pair[0].world).toBe(pair[1].world)
      expect(pair[0].skill).toBe(pair[1].skill)
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
    const itemA = ASSESSMENT_ITEMS.find((item) => item.id === 'garden-5-A')
    const itemB = ASSESSMENT_ITEMS.find((item) => item.id === 'garden-5-B')
    expect(itemA?.options[itemA.correctIndex]).toBe('Coluna 2, linha 2')
    expect(itemB?.options[itemB.correctIndex]).toBe('Coluna 3, linha 2')
  })
})
