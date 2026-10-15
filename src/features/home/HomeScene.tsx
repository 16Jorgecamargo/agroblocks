import { lazy, Suspense, useMemo } from 'react'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { useSettingsStore } from '@/stores/settingsStore'

const HomeLandscape = lazy(() => import('@/features/home/HomeLandscape'))

export function HomeScene() {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const { ambient } = useMotionPrefs()
  const webgl = useMemo(() => hasWebGL(), [])
  if (renderMode === '2d' || !webgl) return <div className="home-scene home-scene--fallback" aria-hidden="true" />
  return (
    <div className="home-scene home-scene--sky" aria-hidden="true">
      <Suspense fallback={<div className="home-scene--fallback" />}>
        <HomeLandscape ambient={ambient} lowGraphics={lowGraphics} />
      </Suspense>
    </div>
  )
}
