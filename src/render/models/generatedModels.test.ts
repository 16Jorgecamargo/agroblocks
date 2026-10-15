import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { MODEL_BUDGET_BYTES, MODEL_MANIFEST, REQUIRED_MODEL_IDS, WORLD_MODEL_IDS } from '@/render/models/manifest'

const ANIMALS = ['cow', 'horse', 'pig', 'sheep', 'llama', 'pug']

describe('generated models', () => {
  it('has every required and world model in the manifest', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of [...REQUIRED_MODEL_IDS, ...WORLD_MODEL_IDS, 'barn', 'silo', 'windmill', 'reservoir']) expect(ids).toContain(id)
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

  it('gives every animal an idle and a move clip', () => {
    for (const id of ANIMALS) {
      const animal = MODEL_MANIFEST.find((entry) => entry.id === id)
      expect(animal?.clips?.idle).toBeTruthy()
      expect(animal?.clips?.move).toBeTruthy()
    }
  })

  it('measures a cow and the big barn', () => {
    const height = (id: string) => {
      const entry = MODEL_MANIFEST.find((item) => item.id === id)
      return entry ? entry.scale : 0
    }
    expect(height('cow')).toBeGreaterThan(0)
    expect(height('barn')).toBeGreaterThan(0)
  })

  it('no longer ships models that are now drawn in code', () => {
    const ids = MODEL_MANIFEST.map((entry) => entry.id)
    for (const id of ['robot', 'crop-1', 'crop-2', 'crop-3', 'crop-4', 'crop-5', 'straw', 'fence', 'fence-gate']) expect(ids).not.toContain(id)
  })
})
