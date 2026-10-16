export interface SignalBus<T> {
  emit: (value: T) => void
  subscribe: (listener: (value: T) => void) => () => void
}

export function createSignalBus<T>(): SignalBus<T> {
  const listeners = new Set<(value: T) => void>()
  return {
    emit: (value) => {
      for (const listener of [...listeners]) listener(value)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
