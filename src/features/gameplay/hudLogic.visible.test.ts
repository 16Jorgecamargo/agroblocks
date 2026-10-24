import { MISSIONS } from '@/data/missions'
import { visibleResources } from '@/features/gameplay/hudLogic'

describe('visibleResources', () => {
  it('shows only the resources each mission really uses', () => {
    const table = Object.fromEntries(MISSIONS.map((mission) => [mission.id, visibleResources(mission)]))
    expect(table).toMatchObject({
      'm0-training': ['harvest'],
      'garden-02': ['harvest'],
      'cornfield-02': ['seeds'],
      'orchard-02': ['water'],
      'greenhouse-02': ['harvest'],
      'barnyard-02': ['seeds', 'water'],
      'homestead-05': ['seeds', 'water', 'energy'],
      'garden-03': ['seeds'],
    })
  })
})
