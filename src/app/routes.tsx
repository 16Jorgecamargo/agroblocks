import type { RouteObject } from 'react-router'
import { HomePage } from '@/features/home/HomePage'

export const appRoutes: RouteObject[] = [{ path: '/', element: <HomePage /> }]
