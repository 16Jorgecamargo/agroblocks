import { MISSIONS } from '@/data/missions'
import { visibleResources } from '@/features/gameplay/hudLogic'

describe('visibleResources', () => {
  it('shows only the resources each mission really uses', () => {
    const table = Object.fromEntries(MISSIONS.map((mission) => [mission.id, visibleResources(mission)]))
    expect(table).toEqual({
      'm0-training': ['harvest'],
      'm1-first-harvest': ['harvest'],
      'm2-row-planting': ['seeds'],
      'm3-smart-irrigation': ['water'],
      'm4-auto-harvest': ['harvest'],
      'm5-limited-resources': ['seeds', 'water'],
      'm6-efficient-farm': ['seeds', 'water', 'energy'],
    })
  })
})
