import { useFlightStore } from '@/stores/flightStore'

describe('flightStore', () => {
  it('launches and lands flights, counting arrivals', () => {
    useFlightStore.getState().launch({ x: 0, y: 0 }, { x: 10, y: 10 })
    const [flight] = useFlightStore.getState().flights
    expect(flight.to).toEqual({ x: 10, y: 10 })
    useFlightStore.getState().land(flight.id)
    expect(useFlightStore.getState().flights).toEqual([])
    expect(useFlightStore.getState().arrivals).toBe(1)
  })
})
