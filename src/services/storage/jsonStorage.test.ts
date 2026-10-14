import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

const schema = z.object({ count: z.number() })

describe('jsonStorage', () => {
  it('returns null without marking corruption when the key is missing', () => {
    expect(readJson(window.localStorage, 'missing', schema)).toEqual({ value: null, corrupt: false, raw: null })
  })

  it('reads valid data', () => {
    writeJson(window.localStorage, 'k', { count: 2 })
    expect(readJson(window.localStorage, 'k', schema).value).toEqual({ count: 2 })
  })

  it('marks invalid JSON and schema mismatches as corrupt', () => {
    window.localStorage.setItem('bad', '{oops')
    window.localStorage.setItem('wrong', JSON.stringify({ count: 'x' }))
    expect(readJson(window.localStorage, 'bad', schema)).toMatchObject({ value: null, corrupt: true, raw: '{oops' })
    expect(readJson(window.localStorage, 'wrong', schema).corrupt).toBe(true)
  })

  it('survives a storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(readJson(throwing, 'k', schema)).toEqual({ value: null, corrupt: false, raw: null })
    expect(writeJson(throwing, 'k', { count: 1 })).toBe(false)
    expect(readJson(null, 'k', schema).value).toBeNull()
  })
})
