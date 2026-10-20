import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { runSnapshotSchema } from '@/shared/runSnapshot'

describe('demo runs', () => {
  it('are valid snapshots of seven students in three schools', () => {
    const runs = createDemoRuns(MISSIONS)
    expect(runs).toHaveLength(8)
    for (const run of runs) expect(runSnapshotSchema.safeParse(run).success).toBe(true)
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.summary.students).toBe(7)
    expect(model.schools).toHaveLength(3)
    expect(model.summary.tutorial.completed).toBeGreaterThan(0)
    expect(model.summary.tutorial.skipped).toBeGreaterThan(0)
    expect(model.summary.avgGain).not.toBeNull()
    expect(model.worldRows.every((row) => row.finished > 0 || row.world === 'homestead')).toBe(true)
    expect(model.worldRows.find((row) => row.world === 'homestead')?.finished).toBe(1)
  })
})
