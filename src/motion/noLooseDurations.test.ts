import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return !path.includes(join('services', 'audio')) && /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const LOOSE = /\b(duration|repeatDelay):\s*[\d.]/

describe('animation timing', () => {
  it('names every duration in src/motion instead of scattering numbers', () => {
    const offenders = sourceFiles('src').flatMap((file) => {
      const lines = readFileSync(file, 'utf8').split('\n')
      const start = file.endsWith(join('motion', 'presets.ts')) ? lines.findIndex((line) => line.startsWith('export const fadeSlide')) : 0
      return lines.flatMap((line, index) => (index >= start && LOOSE.test(line) ? [`${file}:${index + 1}`] : []))
    })
    expect(offenders).toEqual([])
  })
})
