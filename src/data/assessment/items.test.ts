import { ASSESSMENT_ITEMS, itemsFor } from '@/data/assessment/items'
import { ITEMS_PER_FORM } from '@/game/assessment/types'
import { WORLD_IDS, type WorldId } from '@/game/worlds/worldTypes'

const READY_WORLDS: WorldId[] = ['garden', 'cornfield', 'orchard', 'greenhouse', 'barnyard', 'homestead']

describe('assessment items', () => {
  it.each(READY_WORLDS.length > 0 ? READY_WORLDS : (['none'] as const))('%s has five paired items per form, 2 build, 2 predict, 1 debug', (world) => {
    if (world === 'none') return
    for (const form of ['pre', 'post'] as const) {
      const items = itemsFor(world, form)
      expect(items).toHaveLength(ITEMS_PER_FORM)
      expect(items.filter((item) => item.skill === 'build')).toHaveLength(2)
      expect(items.filter((item) => item.skill === 'predict')).toHaveLength(2)
      expect(items.filter((item) => item.skill === 'debug')).toHaveLength(1)
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

  it('asks about programming, not about the game', () => {
    const gameWords = /robô|canteiro|semente|colher|regar|fazenda|reservatório|horta/i
    for (const item of ASSESSMENT_ITEMS) {
      expect(item.kind).not.toBe('predictPosition')
      for (const text of [item.prompt, item.code ?? '', ...item.options]) expect(text).not.toMatch(gameWords)
    }
  })
})
