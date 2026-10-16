import type { SoundName } from '@/services/audio/sounds'

interface Tone {
  frequency: number
  slideTo: number
  duration: number
  type: OscillatorType
  gain: number
}

export const SFX_VOLUME = 2.5

const TONES: Record<SoundName, Tone[]> = {
  move: [{ frequency: 220, slideTo: 260, duration: 0.08, type: 'triangle', gain: 0.08 }],
  turn: [{ frequency: 330, slideTo: 300, duration: 0.06, type: 'triangle', gain: 0.06 }],
  plant: [{ frequency: 180, slideTo: 120, duration: 0.12, type: 'sine', gain: 0.12 }],
  water: [{ frequency: 900, slideTo: 500, duration: 0.18, type: 'sine', gain: 0.07 }],
  harvest: [
    { frequency: 520, slideTo: 520, duration: 0.08, type: 'square', gain: 0.05 },
    { frequency: 780, slideTo: 780, duration: 0.12, type: 'square', gain: 0.05 },
  ],
  collect: [{ frequency: 440, slideTo: 880, duration: 0.2, type: 'sine', gain: 0.07 }],
  error: [{ frequency: 200, slideTo: 90, duration: 0.35, type: 'sawtooth', gain: 0.06 }],
  success: [
    { frequency: 523, slideTo: 523, duration: 0.12, type: 'triangle', gain: 0.08 },
    { frequency: 659, slideTo: 659, duration: 0.12, type: 'triangle', gain: 0.08 },
    { frequency: 784, slideTo: 784, duration: 0.25, type: 'triangle', gain: 0.08 },
  ],
  reveal: [
    { frequency: 392, slideTo: 392, duration: 0.07, type: 'triangle', gain: 0.06 },
    { frequency: 523, slideTo: 523, duration: 0.07, type: 'triangle', gain: 0.06 },
    { frequency: 659, slideTo: 659, duration: 0.07, type: 'triangle', gain: 0.06 },
    { frequency: 784, slideTo: 784, duration: 0.09, type: 'triangle', gain: 0.07 },
    { frequency: 1047, slideTo: 1047, duration: 0.32, type: 'sine', gain: 0.07 },
    { frequency: 1568, slideTo: 2093, duration: 0.18, type: 'sine', gain: 0.03 },
  ],
}

export function createSfxPlayer(): { play(name: SoundName): void } {
  let context: AudioContext | null = null
  return {
    play(name) {
      try {
        context ??= new AudioContext()
        if (context.state === 'suspended') void context.resume().catch(() => undefined)
        let start = context.currentTime
        for (const tone of TONES[name]) {
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = tone.type
          oscillator.frequency.setValueAtTime(tone.frequency, start)
          oscillator.frequency.linearRampToValueAtTime(tone.slideTo, start + tone.duration)
          gain.gain.setValueAtTime(Math.min(1, tone.gain * SFX_VOLUME), start)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
          oscillator.connect(gain).connect(context.destination)
          oscillator.start(start)
          oscillator.stop(start + tone.duration)
          start += tone.duration
        }
      } catch {
        context = null
      }
    },
  }
}

export const sharedSfx = createSfxPlayer()
