import { useEffect, useMemo, useRef } from 'react'
import type { ExecutionSnapshot } from '@/game/execution/types'
import { createSfxPlayer } from '@/services/audio/sfxPlayer'
import { soundsForEvents } from '@/services/audio/sounds'
import { useSettingsStore } from '@/stores/settingsStore'

export function useGameAudio(snapshot: ExecutionSnapshot): void {
  const enabled = useSettingsStore((store) => store.settings.soundEnabled)
  const player = useMemo(() => createSfxPlayer(), [])
  const lastStep = useRef(snapshot.stepCount)
  const lastStatus = useRef(snapshot.status)

  useEffect(() => {
    if (!enabled) {
      lastStep.current = snapshot.stepCount
      lastStatus.current = snapshot.status
      return
    }
    if (snapshot.stepCount !== lastStep.current) {
      lastStep.current = snapshot.stepCount
      for (const sound of soundsForEvents(snapshot.lastEvents)) player.play(sound)
    }
    if (snapshot.status !== lastStatus.current) {
      lastStatus.current = snapshot.status
      if (snapshot.status === 'failed') player.play('error')
      if (snapshot.status === 'finished' && snapshot.validation?.success) player.play('success')
    }
  }, [snapshot, enabled, player])
}
