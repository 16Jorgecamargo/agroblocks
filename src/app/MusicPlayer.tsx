import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const TRACK = `${import.meta.env.BASE_URL}audio/theme.ogg`

export function MusicPlayer() {
  const enabled = useSettingsStore((store) => store.settings.musicEnabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!enabled) {
      audioRef.current?.pause()
      return
    }
    const audio = audioRef.current ?? new Audio(TRACK)
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio
    const start = () => {
      audio.play().catch(() => undefined)
    }
    start()
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [enabled])

  useEffect(() => () => audioRef.current?.pause(), [])

  return null
}
