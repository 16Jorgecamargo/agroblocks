import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { GameplayPage } from '@/features/gameplay/GameplayPage'
import { MissionSelectPage } from '@/features/mission-select/MissionSelectPage'

export const appRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/missoes', element: <MissionSelectPage /> },
  { path: '/jogar/:missionId', element: <GameplayPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]
