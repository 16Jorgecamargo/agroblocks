import { lazy, useMemo } from 'react'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { SceneWithSplash } from '@/render/SceneWithSplash'
import { useSettingsStore } from '@/stores/settingsStore'

const HomeLandscape = lazy(() => import('@/features/home/HomeLandscape'))

export function HomeScene() {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const { ambient } = useMotionPrefs()
  const webgl = useMemo(() => hasWebGL(), [])
  if (renderMode === '2d' || !webgl) return <div className="home-scene home-scene--fallback" aria-hidden="true" />
  return (
    <div className="home-scene home-scene--sky" aria-hidden="true">
      <SceneWithSplash label="Preparando a fazenda…">
        {(onReady) => <HomeLandscape ambient={ambient} lowGraphics={lowGraphics} onReady={onReady} />}
      </SceneWithSplash>
    </div>
  )
}
