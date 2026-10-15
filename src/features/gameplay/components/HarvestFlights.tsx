import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { arcKeyframes } from '@/features/gameplay/hudLogic'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useFlightStore } from '@/stores/flightStore'

function Fruit() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <circle cx="12" cy="14" r="8" fill="#e2533b" />
      <path d="M12 6c-2-3-5-3-6-2 2 1 4 2 6 2zm0 0c2-3 5-3 6-2-2 1-4 2-6 2z" fill="#3fa34d" />
      <circle cx="9" cy="11" r="2" fill="#ffffff" opacity="0.5" />
    </svg>
  )
}

export function HarvestFlights() {
  const flights = useFlightStore((store) => store.flights)
  const land = useFlightStore((store) => store.land)
  return createPortal(
    <div className="harvest-flights" aria-hidden="true">
      {flights.map((flight) => {
        const arc = arcKeyframes(flight.from, flight.to)
        return (
          <motion.span
            key={flight.id}
            className="harvest-flight"
            style={{ left: flight.from.x, top: flight.from.y }}
            initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
            animate={{ x: arc.x, y: arc.y, scale: [0.6, 1.3, 0.8], opacity: [1, 1, 0.9] }}
            transition={{ duration: DURATIONS.harvestFlight, ease: EASINGS.easeInQuad, times: [0, 0.5, 1] }}
            onAnimationComplete={() => land(flight.id)}
          >
            <Fruit />
          </motion.span>
        )
      })}
    </div>,
    document.body,
  )
}
