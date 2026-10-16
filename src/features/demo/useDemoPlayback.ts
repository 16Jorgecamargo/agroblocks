import { useEffect, useState } from 'react'
import { demoDelayMs, nextDemoFrame, type DemoCursor } from '@/features/demo/demoFrames'

const START: DemoCursor = { index: 0, cycle: 0 }

export function useDemoPlayback(count: number, active: boolean): DemoCursor {
  const [cursor, setCursor] = useState<DemoCursor>(START)

  useEffect(() => {
    if (active) return
    setCursor(START)
  }, [active])

  useEffect(() => {
    if (!active || count < 2) return
    const timer = window.setTimeout(() => setCursor((current) => nextDemoFrame(current, count)), demoDelayMs(cursor.index, count))
    return () => window.clearTimeout(timer)
  }, [active, count, cursor])

  return cursor
}
