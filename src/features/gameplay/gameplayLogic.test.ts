import {
  buildAttemptInput,
  canRevealHint,
  formatResource,
  loadInitialWorkspace,
  objectiveCells,
  shortcutFor,
} from '@/features/gameplay/gameplayLogic'
import { getMission } from '@/data/missions'
import { ExecutionController } from '@/game/execution/controller'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import { toControllerMission } from '@/game/missions/toControllerMission'
import type { MissionDefinition } from '@/game/missions/missionTypes'

function mission(id: string): MissionDefinition {
  const found = getMission(id)
  if (!found) throw new Error(id)
  return found
}

function finishedSnapshot(item: MissionDefinition, useReference: boolean) {
  const scheduler = new ManualScheduler()
  const controller = new ExecutionController(toControllerMission(item), scheduler)
  controller.run(useReference ? item.referenceSolution : { main: [], procedures: {} })
  scheduler.runAll()
  return controller.getSnapshot()
}

describe('gameplayLogic', () => {
  it('builds a successful attempt with efficiency stars', () => {
    const item = mission('garden-04')
    const input = buildAttemptInput(finishedSnapshot(item, true), item, 8, 'quando executar:', '2026-10-14T12:00:00.000Z')
    expect(input).toMatchObject({ missionId: 'garden-04', outcome: 'success', errorCode: null, actions: 8, blocks: 8, efficiencyStars: 3 })
    expect(input.usage).toEqual({ seeds: 0, water: 0, energy: 7 })
  })

  it('builds an objective failure without stars', () => {
    const item = mission('garden-04')
    const input = buildAttemptInput(finishedSnapshot(item, false), item, 0, '', 'now')
    expect(input).toMatchObject({ outcome: 'objectiveFailed', efficiencyStars: null })
  })

  it('loads a saved workspace, falls back to the mission initial program, else null', () => {
    const saved = JSON.stringify({ blocks: { languageVersion: 0, blocks: [] } })
    expect(loadInitialWorkspace(saved, mission('garden-04'))).toEqual({ blocks: { languageVersion: 0, blocks: [] } })
    expect(loadInitialWorkspace('{broken', mission('garden-04'))).toBeNull()
    expect(loadInitialWorkspace(null, mission('homestead-10'))?.blocks?.blocks.length).toBeGreaterThan(1)
  })

  it('collects objective cells from cell based objectives', () => {
    expect(objectiveCells(mission('cornfield-02'))).toHaveLength(6)
    expect(objectiveCells(mission('garden-04'))).toEqual([])
  })

  it('locks the fourth hint until two failed attempts', () => {
    expect(canRevealHint(0, 0)).toBe(true)
    expect(canRevealHint(2, 0)).toBe(true)
    expect(canRevealHint(3, 1)).toBe(false)
    expect(canRevealHint(3, 2)).toBe(true)
    expect(canRevealHint(4, 9)).toBe(false)
  })

  it('maps keyboard shortcuts and ignores typing contexts', () => {
    const base = { ctrlKey: false, metaKey: false, targetTag: 'DIV', inEditor: false }
    expect(shortcutFor({ ...base, key: 'Enter', ctrlKey: true })).toBe('run')
    expect(shortcutFor({ ...base, key: 'Enter', metaKey: true, inEditor: true })).toBe('run')
    expect(shortcutFor({ ...base, key: ' ' })).toBe('toggle')
    expect(shortcutFor({ ...base, key: '.' })).toBe('step')
    expect(shortcutFor({ ...base, key: 'Escape' })).toBe('stop')
    expect(shortcutFor({ ...base, key: ' ', targetTag: 'BUTTON' })).toBeNull()
    expect(shortcutFor({ ...base, key: '.', targetTag: 'INPUT' })).toBeNull()
    expect(shortcutFor({ ...base, key: ' ', inEditor: true })).toBeNull()
  })

  it('formats unlimited resources', () => {
    expect(formatResource(null)).toBe('∞')
    expect(formatResource(3)).toBe('3')
  })
})
