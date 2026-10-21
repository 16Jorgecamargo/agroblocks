import { buildWorld } from '@/render/world/buildWorld'
import { distanceToPolyline } from '@/render/world/geometry'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { FeatureKind } from '@/render/world/worldTypes'

const BEDS: FeatureKind[] = ['vegetableBed', 'cabbageBed', 'carrotBed', 'tomatoBed', 'pepperBed', 'onionBed', 'herbBed', 'sproutBed', 'beanTrellis']

describe('garden landscape', () => {
  describeLandscape({ world: 'garden', landmark: ['toolShed', 'workbench', 'seedlingTable', 'compostBins', 'rainBarrel'], crops: BEDS, minBlocks: { map: 5, farm: 2 } })

  const map = () => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'garden', density: 'full', theme: 'garden' })
  const farm = () => buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'garden-01', density: 'full', theme: 'garden' })

  it('grows many recognisable vegetables in aligned beds, at different stages', () => {
    for (const world of [map(), farm()]) {
      const beds = world.features.filter((feature) => BEDS.includes(feature.kind))
      expect(beds.length).toBeGreaterThanOrEqual(world.trail.length > 0 ? 40 : 30)
      expect(new Set(beds.map((bed) => bed.kind)).size).toBeGreaterThanOrEqual(7)
      expect(new Set(beds.map((bed) => bed.rotation))).toEqual(new Set([0, Math.PI / 2]))
      expect(new Set(beds.map((bed) => Math.round(bed.scale * 20))).size).toBeGreaterThan(2)
    }
  })

  it('keeps tools next to the shed, water beside the beds and a quiet place to rest', () => {
    const world = map()
    const shed = world.features.find((feature) => feature.kind === 'toolShed')!
    for (const kind of ['workbench', 'sackPallet', 'potStack', 'basket'] as FeatureKind[]) {
      expect(world.features.some((feature) => feature.kind === kind && Math.hypot(feature.x - shed.x, feature.z - shed.z) < 4)).toBe(true)
    }
    expect(world.waters?.length).toBeGreaterThanOrEqual(3)
    expect(world.features.some((feature) => feature.kind === 'bench')).toBe(true)
    expect(world.features.some((feature) => feature.kind === 'pergola')).toBe(true)
    expect(world.stains?.length).toBeGreaterThanOrEqual(6)
  })

  it('organises with low hedges instead of boxing every bed in', () => {
    const world = map()
    const hedges = world.features.filter((feature) => feature.kind === 'hedge')
    expect(hedges.length).toBeGreaterThan(6)
    expect(hedges.length).toBeLessThan(40)
    for (const hedge of hedges) expect(distanceToPolyline(hedge, world.trail)).toBeGreaterThan(0.8)
    expect(world.features.some((feature) => feature.kind === 'chicken')).toBe(false)
  })
})
