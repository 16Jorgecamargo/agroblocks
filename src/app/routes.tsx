import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { GameplayPage } from '@/features/gameplay/GameplayPage'

export const appRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/jogar/:missionId', element: <GameplayPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]
