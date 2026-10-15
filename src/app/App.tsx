import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'
import { PreferenceSync } from '@/app/PreferenceSync'
import { MusicPlayer } from '@/app/MusicPlayer'
import { MotionProvider } from '@/motion/MotionProvider'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <MotionProvider>
        <PreferenceSync />
        <MusicPlayer />
        <AppRoutes />
      </MotionProvider>
    </HashRouter>
  )
}
