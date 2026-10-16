import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '@react-three/drei'
import { animate } from 'motion'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/brand/Logo'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { sharedSfx } from '@/services/audio/sfxPlayer'
import { useSettingsStore } from '@/stores/settingsStore'
import './SceneSplash.css'

export function SceneSplash({ progress, label }: { progress: number; label: string }) {
  const value = Math.round(progress)
  return (
    <motion.div className="scene-splash" role="status" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DURATIONS.fadeExit, ease: EASINGS.easeOutCubic } }}>
      <Logo size="lg" />
      <span className="scene-splash__label">{label}</span>
      <div className="scene-splash__track" role="progressbar" aria-label="Progresso do carregamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <motion.div className="scene-splash__bar" initial={false} animate={{ width: `${Math.max(6, value)}%` }} transition={{ duration: DURATIONS.quickExit, ease: EASINGS.easeOutCubic }} />
      </div>
      <span className="scene-splash__dots" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span key={index} animate={{ y: [0, -8, 0] }} transition={{ duration: DURATIONS.dotBounce, repeat: Infinity, delay: index * 0.12, ease: EASINGS.easeOutQuart }} />
        ))}
      </span>
    </motion.div>
  )
}

export function SceneWithSplash({ children, label = 'Carregando fazenda…' }: { children: (onReady: () => void) => ReactNode; label?: string }) {
  const { active, progress } = useProgress()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(false)
  const soundEnabled = useSettingsStore((store) => store.settings.soundEnabled)
  const revealed = useRef(false)

  useEffect(() => {
    if (!hidden || revealed.current) return
    revealed.current = true
    if (soundEnabled) sharedSfx.play('reveal')
  }, [hidden, soundEnabled])

  useEffect(() => {
    const ceiling = window.setTimeout(() => setHidden(true), DURATIONS.splashMax * 1000)
    return () => window.clearTimeout(ceiling)
  }, [])

  useEffect(() => {
    if (!ready || active || hidden) return
    const hold = animate(0, 1, { duration: DURATIONS.splashHold })
    hold.then(() => setHidden(true))
    return () => hold.stop()
  }, [ready, active, hidden])

  return (
    <div className="scene-stage">
      <Suspense fallback={null}>{children(() => setReady(true))}</Suspense>
      <AnimatePresence>{!hidden && <SceneSplash key="splash" progress={progress} label={label} />}</AnimatePresence>
    </div>
  )
}
