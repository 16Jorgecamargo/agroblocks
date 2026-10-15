import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { MODEL_BUDGET_BYTES, MODEL_MANIFEST, REQUIRED_MODEL_IDS } from '@/render/models/manifest'

describe('generated models', () => {
  it('has every required model in the manifest', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of REQUIRED_MODEL_IDS) expect(ids).toContain(id)
  })

  it('ships every GLB and stays within the budget', () => {
    let total = 0
    for (const entry of MODEL_MANIFEST) {
      const file = path.join(process.cwd(), 'public', entry.file)
      expect(existsSync(file)).toBe(true)
      total += statSync(file).size
    }
    expect(total).toBeLessThanOrEqual(MODEL_BUDGET_BYTES)
  })

  it('maps the four robot clips', () => {
    const robot = MODEL_MANIFEST.find((entry) => entry.id === 'robot')
    expect(Object.keys(robot?.clips ?? {}).sort()).toEqual(['error', 'idle', 'move', 'success'])
  })
})
