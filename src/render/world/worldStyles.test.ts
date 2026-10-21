import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { buildWorld } from '@/render/world/buildWorld'
import { styleOf, TRAINING_STYLE, WORLD_STYLES } from '@/render/world/worldStyles'

describe('world styles', () => {
  it('gives every world its own sky, grass and relief with border', () => {
    expect(new Set(WORLD_IDS.map((id) => WORLD_STYLES[id].sky)).size).toBe(6)
    expect(new Set(WORLD_IDS.map((id) => WORLD_STYLES[id].palette.grass)).size).toBe(6)
    expect(new Set(WORLD_IDS.map((id) => `${WORLD_STYLES[id].relief}/${WORLD_STYLES[id].border}`)).size).toBe(6)
  })

  it('keeps the training look outside the worlds', () => {
    expect(styleOf(null)).toEqual(TRAINING_STYLE)
    expect(styleOf(undefined)).toEqual(TRAINING_STYLE)
    expect(styleOf('cornfield').sun.color).toBe('#ffcf86')
  })

  it('lights the cornfield with a warm late-afternoon sun', () => {
    const { sun, hemisphere, palette } = WORLD_STYLES.cornfield
    expect(sun).toEqual({ color: '#ffcf86', intensity: 1.6, position: [14, 10, 4] })
    expect(hemisphere).toEqual({ sky: '#f6d9a8', ground: palette.grassDeep, intensity: 0.9 })
  })

  it('travels with every built world', () => {
    expect(buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'orchard', density: 'light', theme: 'orchard' }).style).toEqual(WORLD_STYLES.orchard)
    expect(buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'x', density: 'light', theme: 'barnyard' }).style).toEqual(WORLD_STYLES.barnyard)
    expect(buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'x', density: 'light', theme: null }).style).toEqual(TRAINING_STYLE)
    expect(buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'x', density: 'light', theme: 'garden' }).palette).toEqual(WORLD_STYLES.garden.palette)
  })
})
