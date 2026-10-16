import { useEffect } from 'react'
import { safeStorage } from '@/services/storage/jsonStorage'
import { createRunSync, sendRun } from '@/services/sync/runSync'
import { useProgressStore } from '@/stores/progressStore'

export function RunSync() {
  useEffect(() => {
    const sync = createRunSync({ send: sendRun, storage: safeStorage() })
    sync.resumePending(useProgressStore.getState().save)
    const unsubscribe = useProgressStore.subscribe((state, previous) => {
      if (state.save !== previous.save) sync.schedule(state.save)
    })
    const online = () => sync.resumePending(useProgressStore.getState().save)
    window.addEventListener('online', online)
    return () => {
      unsubscribe()
      window.removeEventListener('online', online)
      sync.dispose()
    }
  }, [])
  return null
}
