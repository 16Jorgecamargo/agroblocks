import { createSignalBus } from '@/features/tutorial/signalBus'

describe('createSignalBus', () => {
  it('delivers values to current subscribers only', () => {
    const bus = createSignalBus<number>()
    const seen: number[] = []
    const stop = bus.subscribe((value) => seen.push(value))
    bus.emit(1)
    stop()
    bus.emit(2)
    expect(seen).toEqual([1])
  })
})
