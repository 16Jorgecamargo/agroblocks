import { FEATURE_SHAPES, modelShape } from '@/render/world/navigation/shapes'
import { FEATURE_KINDS } from '@/render/world/worldTypes'

describe('object shapes', () => {
  it.each(FEATURE_KINDS)('%s has a shape', (kind) => expect(FEATURE_SHAPES[kind]).toBeDefined())

  it('feeds, crops and buildings block with the right occupant', () => {
    expect(FEATURE_SHAPES.trough).toMatchObject({ form: 'rect', occupant: 'feed' })
    expect(FEATURE_SHAPES.cabbageBed).toMatchObject({ form: 'rect', width: 1.4, depth: 0.8, occupant: 'crop' })
    expect(FEATURE_SHAPES.machineShed).toMatchObject({ occupant: 'structure' })
    expect(modelShape('barn')).toMatchObject({ occupant: 'structure' })
    expect(modelShape('grass-short')).toEqual({ form: 'none' })
  })
})
