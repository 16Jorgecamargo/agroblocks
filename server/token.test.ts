import { createToken, TOKEN_TTL_MS, verifyToken } from './token.js'

describe('teacher token', () => {
  it('verifies until it expires', () => {
    const { token, expiresAt } = createToken('secret', 1000)
    expect(expiresAt).toBe(1000 + TOKEN_TTL_MS)
    expect(verifyToken('secret', token, 2000)).toBe(true)
    expect(verifyToken('secret', token, expiresAt + 1)).toBe(false)
  })

  it('rejects other secrets, tampered expiry and garbage', () => {
    const { token } = createToken('secret', 1000)
    expect(verifyToken('other', token, 2000)).toBe(false)
    const [, signature] = token.split('.')
    const forged = `${Buffer.from(String(9e15)).toString('base64url')}.${signature}`
    expect(verifyToken('secret', forged, 2000)).toBe(false)
    expect(verifyToken('secret', 'nope', 2000)).toBe(false)
    expect(verifyToken('secret', '', 2000)).toBe(false)
  })
})
