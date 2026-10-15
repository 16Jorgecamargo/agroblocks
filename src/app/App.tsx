import { HashRouter } from 'react-router'
import { AnimatedRoutes } from '@/app/AnimatedRoutes'
import { PreferenceSync } from '@/app/PreferenceSync'
import { MusicPlayer } from '@/app/MusicPlayer'
import { MotionProvider } from '@/motion/MotionProvider'

export function App() {
  return (
    <HashRouter>
      <MotionProvider>
        <PreferenceSync />
        <MusicPlayer />
        <AnimatedRoutes />
      </MotionProvider>
    </HashRouter>
  )
}
