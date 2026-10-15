import { clipForStep } from '@/render/robot/clipForStep'
import type { GameEvent } from '@/game/world/types'

const still = { failed: false, celebrating: false, moving: false }

function plot(to: 'tilled' | 'seeded' | 'growing' | 'mature' | 'harvested'): GameEvent {
  return { type: 'plotChanged', x: 0, y: 0, from: 'untilled', to }
}

describe('clipForStep', () => {
  it('puts failure first and celebration second', () => {
    expect(clipForStep({ events: [plot('tilled')], failed: true, celebrating: true, moving: true })).toBe('error')
    expect(clipForStep({ events: [plot('tilled')], failed: false, celebrating: true, moving: true })).toBe('success')
  })

  it('maps each farm action to its clip', () => {
    expect(clipForStep({ ...still, events: [plot('tilled')] })).toBe('till')
    expect(clipForStep({ ...still, events: [plot('seeded')] })).toBe('plant')
    expect(clipForStep({ ...still, events: [{ type: 'moistureChanged', x: 0, y: 0, moisture: 'wet' }] })).toBe('water')
    expect(clipForStep({ ...still, events: [plot('harvested')] })).toBe('harvest')
    expect(clipForStep({ ...still, events: [{ type: 'resourcesCollected', resource: 'water', amount: 3 }] })).toBe('collect')
    expect(clipForStep({ ...still, events: [{ type: 'robotTurned', facing: 'N' }] })).toBe('turn')
  })

  it('ignores growth and drying that happen during a move', () => {
    const events: GameEvent[] = [
      { type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
      plot('growing'),
      plot('mature'),
      { type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' },
    ]
    expect(clipForStep({ ...still, events })).toBe('idle')
    expect(clipForStep({ ...still, events, moving: true })).toBe('move')
  })

  it('stops driving once the move has finished even if the event is still there', () => {
    expect(clipForStep({ ...still, events: [{ type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }] })).toBe('idle')
  })
})
