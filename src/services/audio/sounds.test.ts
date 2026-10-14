import { soundsForEvents } from '@/services/audio/sounds'

describe('soundsForEvents', () => {
  it('maps engine events to sounds without duplicates', () => {
    expect(
      soundsForEvents([
        { type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { type: 'resourceChanged', resource: 'energy', value: 3 },
        { type: 'plotChanged', x: 1, y: 0, from: 'tilled', to: 'seeded' },
        { type: 'plotChanged', x: 2, y: 0, from: 'seeded', to: 'growing' },
        { type: 'moistureChanged', x: 1, y: 0, moisture: 'wet' },
        { type: 'moistureChanged', x: 2, y: 0, moisture: 'dry' },
      ]),
    ).toEqual(['move', 'plant', 'water'])
  })

  it('maps turns, harvests and refills', () => {
    expect(
      soundsForEvents([
        { type: 'robotTurned', facing: 'N' },
        { type: 'plotChanged', x: 0, y: 0, from: 'mature', to: 'harvested' },
        { type: 'resourcesCollected', resource: 'water', amount: 3 },
      ]),
    ).toEqual(['turn', 'harvest', 'collect'])
  })
})
