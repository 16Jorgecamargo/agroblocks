import { z } from 'zod'
import { cleanText } from '@/shared/student'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const SCHOOLS_KEY = 'agroblocks:schools:v1'

export function recentSchools(storage: Storage | null): string[] {
  return readJson(storage, SCHOOLS_KEY, z.array(z.string())).value ?? []
}

export function rememberSchool(storage: Storage | null, school: string): void {
  const clean = cleanText(school)
  if (!clean) return
  writeJson(storage, SCHOOLS_KEY, [clean, ...recentSchools(storage).filter((item) => item !== clean)].slice(0, 10))
}
