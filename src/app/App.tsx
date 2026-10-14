import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'
import { PreferenceSync } from '@/app/PreferenceSync'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <PreferenceSync />
      <AppRoutes />
    </HashRouter>
  )
}
