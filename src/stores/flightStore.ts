import { create } from 'zustand'
import type { Point } from '@/features/gameplay/hudLogic'

export interface Flight {
  id: number
  from: Point
  to: Point
}

interface FlightState {
  flights: Flight[]
  arrivals: number
  launch: (from: Point, to: Point) => void
  land: (id: number) => void
}

let nextFlightId = 1

export const useFlightStore = create<FlightState>((set) => ({
  flights: [],
  arrivals: 0,
  launch: (from, to) => {
    const id = nextFlightId
    nextFlightId += 1
    set((state) => ({ flights: [...state.flights, { id, from, to }] }))
  },
  land: (id) => set((state) => ({ flights: state.flights.filter((flight) => flight.id !== id), arrivals: state.arrivals + 1 })),
}))
