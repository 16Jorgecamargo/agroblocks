import type { RunSnapshot } from './runSnapshot.js'

export const validSnapshot: RunSnapshot = {
  runId: '3f1c2a4e-1111-4222-8333-444455556666',
  student: { name: 'Ana Souza', school: 'Escola Azul' },
  studentKey: 'ana souza|escola azul',
  createdAt: '2026-10-16T10:00:00.000Z',
  updatedAt: '2026-10-16T10:05:00.000Z',
  tutorial: { status: 'completed', step: 15, at: '2026-10-16T10:04:00.000Z' },
  missions: {
    'm0-training': { status: 'completed', attempts: 1, bestResult: { actions: 3, blocks: 3, usage: { seeds: 0, water: 0, energy: 3 }, efficiencyStars: 3 }, hintsUsed: 0, errorCounts: {} },
  },
  attempts: [
    {
      id: 'a1',
      missionId: 'm0-training',
      attemptNumber: 1,
      timestamp: '2026-10-16T10:03:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 3,
      blocks: 3,
      usage: { seeds: 0, water: 0, energy: 3 },
      hintsUsed: 0,
      efficiencyStars: 3,
      pseudocode: 'quando executar:\n    mover para frente',
    },
  ],
  assessments: { pre: null, post: null },
}
