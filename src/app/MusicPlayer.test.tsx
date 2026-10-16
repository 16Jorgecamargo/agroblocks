import { act, render } from '@testing-library/react'
import { MusicPlayer, MUSIC_TRACKS } from '@/app/MusicPlayer'
import { useSettingsStore } from '@/stores/settingsStore'

class FakeAudio extends EventTarget {
  static created: FakeAudio[] = []
  src = ''
  loop = false
  volume = 1
  paused = true
  constructor() {
    super()
    FakeAudio.created.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
}

describe('MusicPlayer', () => {
  beforeEach(() => {
    FakeAudio.created = []
    vi.stubGlobal('Audio', FakeAudio)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useSettingsStore.getState().update({ musicEnabled: false })
  })

  it('ships the two farm tracks', () => {
    expect(MUSIC_TRACKS.map((track) => track.split('/').at(-1))).toEqual(['seeds-and-sprockets.mp3', 'sunlight-on-painted-wood.mp3'])
  })

  it('plays the tracks one after the other and starts over after the last', () => {
    useSettingsStore.getState().update({ musicEnabled: true })
    render(<MusicPlayer />)
    const audio = FakeAudio.created[0]
    expect(audio.src).toBe(MUSIC_TRACKS[0])
    expect(audio.paused).toBe(false)
    expect(audio.volume).toBeCloseTo(0.18)
    act(() => {
      audio.dispatchEvent(new Event('ended'))
    })
    expect(audio.src).toBe(MUSIC_TRACKS[1])
    act(() => {
      audio.dispatchEvent(new Event('ended'))
    })
    expect(audio.src).toBe(MUSIC_TRACKS[0])
  })

  it('stays silent while music is off', () => {
    render(<MusicPlayer />)
    expect(FakeAudio.created.every((audio) => audio.paused)).toBe(true)
  })
})
