import { ERROR_CODES } from '@/game/world/types'
import { ERROR_TEXT, createGameError } from '@/game/rules/errors'

describe('game errors', () => {
  it('has a Portuguese message and hint for every error code', () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_TEXT[code].message.length).toBeGreaterThan(10)
      expect(ERROR_TEXT[code].hint.length).toBeGreaterThan(10)
    }
  })

  it('uses the default hint when no override exists', () => {
    const error = createGameError('NO_WATER')
    expect(error).toEqual({ code: 'NO_WATER', ...ERROR_TEXT.NO_WATER })
  })

  it('replaces only the hint when an override exists', () => {
    const error = createGameError('HIT_OBSTACLE', { HIT_OBSTACLE: 'Vire antes da pedra.' })
    expect(error.message).toBe(ERROR_TEXT.HIT_OBSTACLE.message)
    expect(error.hint).toBe('Vire antes da pedra.')
  })
})
