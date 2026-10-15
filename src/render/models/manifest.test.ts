import { MODEL_BUDGET_BYTES, parseManifest, REQUIRED_MODEL_IDS } from '@/render/models/manifest'

const entry = {
  id: 'robot',
  file: 'models/robot.glb',
  usage: 'robô',
  author: 'Quaternius',
  license: 'CC0-1.0',
  page: 'https://quaternius.itch.io/lowpoly-robot',
  scale: 0.4,
  yOffset: 0,
  rotationY: 0,
  bytes: 1200,
  clips: { idle: 'Idle', move: 'Walk' },
  recolor: { Main: '#f4f6f5' },
}

describe('model manifest', () => {
  it('lists the models the scene needs', () => {
    expect(REQUIRED_MODEL_IDS).toContain('robot')
    expect(REQUIRED_MODEL_IDS.filter((id) => id.startsWith('crop-'))).toHaveLength(5)
  })

  it('accepts a valid CC0 entry', () => {
    expect(parseManifest({ models: [entry] })).toEqual([entry])
  })

  it('rejects non CC0 licenses and malformed data', () => {
    expect(parseManifest({ models: [{ ...entry, license: 'CC-BY-4.0' }] })).toEqual([])
    expect(parseManifest('nope')).toEqual([])
  })

  it('keeps a 5 MB budget', () => {
    expect(MODEL_BUDGET_BYTES).toBe(5242880)
  })
})
