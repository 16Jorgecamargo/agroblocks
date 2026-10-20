import { MISSIONS } from '@/data/missions'
import { visibleResources } from '@/features/gameplay/hudLogic'

describe('visibleResources', () => {
  it('shows only the resources each mission really uses', () => {
    const table = Object.fromEntries(MISSIONS.map((mission) => [mission.id, visibleResources(mission)]))
    expect(table).toEqual({
      'm0-training': ['harvest'],
      'garden-04': ['harvest'],
      'cornfield-02': ['seeds'],
      'orchard-04': ['water'],
      'greenhouse-03': ['harvest'],
      'barnyard-05': ['seeds', 'water'],
      'homestead-10': ['seeds', 'water', 'energy'],
    })
  })
})
