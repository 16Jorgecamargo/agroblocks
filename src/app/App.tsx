import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
