import { MAX_ATTEMPTS, MAX_PSEUDOCODE, runSnapshotSchema } from './runSnapshot.js'
import { validSnapshot } from './snapshotFixture.js'

describe('runSnapshotSchema', () => {
  it('accepts a valid snapshot', () => {
    expect(runSnapshotSchema.safeParse(validSnapshot).success).toBe(true)
  })

  it('rejects too many attempts and long pseudocode', () => {
    const many = { ...validSnapshot, attempts: Array.from({ length: MAX_ATTEMPTS + 1 }, () => validSnapshot.attempts[0]) }
    expect(runSnapshotSchema.safeParse(many).success).toBe(false)
    const long = { ...validSnapshot, attempts: [{ ...validSnapshot.attempts[0], pseudocode: 'x'.repeat(MAX_PSEUDOCODE + 1) }] }
    expect(runSnapshotSchema.safeParse(long).success).toBe(false)
  })

  it('rejects an invalid student', () => {
    expect(runSnapshotSchema.safeParse({ ...validSnapshot, student: { name: 'Ana', school: 'Escola Azul' } }).success).toBe(false)
  })
})
