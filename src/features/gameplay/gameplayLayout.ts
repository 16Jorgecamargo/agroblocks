const PROGRAM_SHARE = { idle: 1.15, running: 0.7 }
const FARM_SHARE = { idle: 1.25, running: 1.9 }

function share(range: { idle: number; running: number }, progress: number): number {
  return Number((range.idle + (range.running - range.idle) * progress).toFixed(4))
}

export function columnsAt(progress: number): string {
  return `minmax(0px, ${share(PROGRAM_SHARE, progress)}fr) minmax(0px, ${share(FARM_SHARE, progress)}fr) 320px`
}

export const IDLE_COLUMNS = columnsAt(0)

export const RUNNING_COLUMNS = columnsAt(1)
