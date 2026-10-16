import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export const MUSIC_TRACKS = ['seeds-and-sprockets.mp3', 'sunlight-on-painted-wood.mp3'].map((file) => `${import.meta.env.BASE_URL}audio/${file}`)

export function MusicPlayer() {
  const enabled = useSettingsStore((store) => store.settings.musicEnabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      audioRef.current?.pause()
      return
    }
    const audio = audioRef.current ?? new Audio()
    if (!audioRef.current) audio.src = MUSIC_TRACKS[trackRef.current]
    audio.volume = 0.3
    audioRef.current = audio
    const start = () => {
      audio.play().catch(() => undefined)
    }
    const next = () => {
      trackRef.current = (trackRef.current + 1) % MUSIC_TRACKS.length
      audio.src = MUSIC_TRACKS[trackRef.current]
      start()
    }
    start()
    audio.addEventListener('ended', next)
    window.addEventListener('pointerdown', start, { once: true })
    return () => {
      audio.removeEventListener('ended', next)
      window.removeEventListener('pointerdown', start)
    }
  }, [enabled])

  useEffect(() => () => audioRef.current?.pause(), [])

  return null
}
