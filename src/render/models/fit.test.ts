import { fitToTarget, fitWithScale } from '@/render/models/fit'

describe('model fitting', () => {
  it('scales a model to its target height and rests it on the ground', () => {
    expect(fitToTarget({ min: [-1, -2, -1], max: [1, 2, 1] }, { targetHeight: 2 })).toEqual({ scale: 0.5, yOffset: 1 })
  })

  it('scales flat models by their largest horizontal side', () => {
    expect(fitToTarget({ min: [0, 0, 0], max: [4, 0.2, 2] }, { targetWidth: 2 })).toEqual({ scale: 0.5, yOffset: 0 })
  })

  it('keeps degenerate models unscaled', () => {
    expect(fitToTarget({ min: [0, 0, 0], max: [0, 0, 0] }, { targetHeight: 1 })).toEqual({ scale: 1, yOffset: 0 })
  })

  it('reuses a given scale while still grounding the model', () => {
    expect(fitWithScale({ min: [0, -0.5, 0], max: [1, 1, 1] }, 0.4)).toEqual({ scale: 0.4, yOffset: 0.2 })
  })
})
