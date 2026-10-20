import { useState } from 'react'

export type DashboardTheme = 'light' | 'dark'

const KEY = 'agroblocks:dashboard-theme:v1'

function systemTheme(): DashboardTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): DashboardTheme | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function useDashboardTheme(): [DashboardTheme, () => void] {
  const [theme, setTheme] = useState<DashboardTheme>(() => storedTheme() ?? systemTheme())
  const toggle = () =>
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      try {
        window.localStorage.setItem(KEY, next)
      } catch {
        return next
      }
      return next
    })
  return [theme, toggle]
}
