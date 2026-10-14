export interface Scheduler {
  schedule(callback: () => void, delayMs: number): () => void
}

export const browserScheduler: Scheduler = {
  schedule(callback, delayMs) {
    const handle = window.setTimeout(callback, delayMs)
    return () => window.clearTimeout(handle)
  },
}
