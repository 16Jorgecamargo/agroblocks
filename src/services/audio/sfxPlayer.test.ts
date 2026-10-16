import { createSfxPlayer, SFX_VOLUME } from '@/services/audio/sfxPlayer'

class FakeParam {
  values: number[] = []
  setValueAtTime(value: number) {
    this.values.push(value)
  }
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

const gains: FakeParam[] = []

class FakeContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createOscillator() {
    return { type: 'sine', frequency: new FakeParam(), connect: (node: unknown) => node, start() {}, stop() {} }
  }
  createGain() {
    const gain = new FakeParam()
    gains.push(gain)
    return { gain, connect: (node: unknown) => node }
  }
}

describe('createSfxPlayer', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('plays effects loud enough to be heard over the music', () => {
    vi.stubGlobal('AudioContext', FakeContext)
    expect(SFX_VOLUME).toBeGreaterThanOrEqual(2)
    createSfxPlayer().play('error')
    expect(gains[0].values[0]).toBeCloseTo(0.06 * SFX_VOLUME)
  })
})
