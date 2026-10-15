import { LEGEND_PAGES, legendCell } from '@/features/legend/legendPages'

describe('LEGEND_PAGES', () => {
  it('lists the soil states first and the farm elements after', () => {
    expect(LEGEND_PAGES.map((page) => page.id)).toEqual(['empty', 'prepared', 'wet', 'planted', 'growing', 'ready', 'obstacle', 'reservoir', 'depot', 'goal'])
    expect(LEGEND_PAGES.filter((page) => page.group === 'Solo')).toHaveLength(6)
    expect(new Set(LEGEND_PAGES.map((page) => page.id)).size).toBe(LEGEND_PAGES.length)
  })

  it('uses the names the student sees in the game', () => {
    expect(LEGEND_PAGES.slice(0, 6).map((page) => page.title)).toEqual(['Vazio', 'Preparado', 'Molhado', 'Plantado', 'Crescendo', 'Pronto para colher'])
  })

  it('tells how to reach every soil state and what to do next', () => {
    const soil = LEGEND_PAGES.filter((page) => page.group === 'Solo')
    for (const page of soil) {
      expect(page.next).toBeTruthy()
      if (page.id === 'empty') expect(page.reachedBy).toBeNull()
      else expect(page.reachedBy).toBeTruthy()
    }
    expect(LEGEND_PAGES.find((page) => page.id === 'ready')?.next).toBe('colher planta')
    expect(LEGEND_PAGES.find((page) => page.id === 'prepared')?.reachedBy).toBe('preparar solo')
  })

  it('previews each page with the matching cell', () => {
    const preview = (id: string) => LEGEND_PAGES.find((page) => page.id === id)?.preview
    expect(preview('ready')).toMatchObject({ terrain: 'soil', plot: 'mature' })
    expect(preview('wet')).toMatchObject({ terrain: 'soil', plot: 'tilled', moisture: 'wet' })
    expect(preview('planted')).toMatchObject({ plot: 'seeded' })
    expect(preview('obstacle')).toMatchObject({ terrain: 'obstacle' })
    expect(preview('goal')).toMatchObject({ terrain: 'soil', goal: true })
  })

  it('builds a game cell from a preview', () => {
    expect(legendCell({ terrain: 'soil', plot: 'growing', moisture: 'dry', goal: false })).toEqual({ terrain: 'soil', plot: 'growing', moisture: 'dry', growth: 0 })
  })
})
