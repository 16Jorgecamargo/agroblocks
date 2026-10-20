import { getMission } from '@/data/missions'
import { WORLDS } from '@/data/worlds'
import { missionLabel } from '@/game/worlds/missionLabel'
import { roleForSlot, WORLD_IDS } from '@/game/worlds/worldTypes'

describe('worlds', () => {
  it('lists the six worlds in order with their names and concepts', () => {
    expect(WORLDS.map((world) => [world.id, world.order, world.name])).toEqual([
      ['garden', 1, 'Horta'],
      ['cornfield', 2, 'Milharal'],
      ['orchard', 3, 'Pomar'],
      ['greenhouse', 4, 'Estufa'],
      ['barnyard', 5, 'Celeiro'],
      ['homestead', 6, 'Fazenda completa'],
    ])
    expect(WORLDS.map((world) => world.id)).toEqual(WORLD_IDS)
  })

  it('maps slots to roles', () => {
    expect([1, 3, 4, 6, 7, 8, 9, 10].map(roleForSlot)).toEqual(['learn', 'learn', 'practice', 'practice', 'challenge', 'challenge', 'debug', 'final'])
  })

  it('labels missions by world and slot', () => {
    const garden = getMission('garden-04')
    const training = getMission('m0-training')
    if (!garden || !training) throw new Error('missing mission')
    expect(missionLabel(garden)).toBe('Horta · Missão 4')
    expect(missionLabel(training)).toBe('Treinamento')
  })
})
