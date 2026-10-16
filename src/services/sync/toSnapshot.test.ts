import { assignStudent, createInitialSave, storeProgram } from '@/game/progress/progression'
import { toSnapshot } from '@/services/sync/toSnapshot'

const refs = [{ id: 'm0-training', order: 0 }]

describe('toSnapshot', () => {
  it('needs a run and a student', () => {
    expect(toSnapshot(createInitialSave(refs, 'c'), 'u')).toBeNull()
  })

  it('copies the run, computes the key and drops the program in edition', () => {
    let save = assignStudent(createInitialSave(refs, '2026-10-16T10:00:00.000Z'), { name: 'José da Silva', school: 'Escola Azul' }, 'run-0001')
    save = storeProgram(save, 'm0-training', '{"blocks":{}}')
    const snapshot = toSnapshot(save, '2026-10-16T10:05:00.000Z')
    expect(snapshot).toMatchObject({
      runId: 'run-0001',
      studentKey: 'jose da silva|escola azul',
      createdAt: '2026-10-16T10:00:00.000Z',
      updatedAt: '2026-10-16T10:05:00.000Z',
      tutorial: null,
    })
    expect(snapshot?.missions['m0-training']).not.toHaveProperty('savedProgram')
  })
})
