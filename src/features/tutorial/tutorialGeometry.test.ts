import { ARROW_INSET, CALLOUT_GAP, padRect, placeCallout, spotlightPath, VIEWPORT_MARGIN } from '@/features/tutorial/tutorialGeometry'

const viewport = { width: 1440, height: 900 }
const callout = { width: 320, height: 160 }

describe('placeCallout', () => {
  it('puts the callout to the right of the target when it fits, centred on it', () => {
    const placement = placeCallout({ x: 8, y: 80, width: 520, height: 800 }, callout, viewport)
    expect(placement.side).toBe('right')
    expect(placement.x).toBe(8 + 520 + CALLOUT_GAP)
    expect(placement.y).toBe(80 + 400 - 80)
    expect(placement.arrow).toBe(80)
  })

  it('falls back to the left when the right side has no room', () => {
    const placement = placeCallout({ x: 1112, y: 80, width: 320, height: 800 }, callout, viewport)
    expect(placement.side).toBe('left')
    expect(placement.x).toBe(1112 - CALLOUT_GAP - 320)
  })

  it('honours a preferred side and keeps the callout inside the viewport margin', () => {
    const placement = placeCallout({ x: 190, y: 0, width: 500, height: 70 }, callout, viewport, 'bottom')
    expect(placement.side).toBe('bottom')
    expect(placement.y).toBe(70 + CALLOUT_GAP)
    expect(placement.x).toBeGreaterThanOrEqual(VIEWPORT_MARGIN)
    const edge = placeCallout({ x: 1300, y: 0, width: 140, height: 70 }, callout, viewport, 'bottom')
    expect(edge.x).toBe(viewport.width - VIEWPORT_MARGIN - 320)
    expect(edge.arrow).toBe(1370 - edge.x)
  })

  it('clamps the arrow away from the corners', () => {
    const placement = placeCallout({ x: 8, y: 840, width: 300, height: 40 }, callout, viewport)
    expect(placement.side).toBe('right')
    expect(placement.arrow).toBeLessThanOrEqual(160 - ARROW_INSET)
  })

  it('picks the roomiest side when nothing fits', () => {
    const placement = placeCallout({ x: 100, y: 100, width: 1240, height: 700 }, callout, viewport)
    expect(['right', 'left', 'bottom', 'top']).toContain(placement.side)
  })
})

describe('spotlightPath', () => {
  it('draws the viewport and one rounded hole per target', () => {
    const path = spotlightPath([padRect({ x: 10, y: 20, width: 100, height: 50 }, 6), { x: 300, y: 300, width: 40, height: 40 }], viewport, 14)
    expect(path.startsWith('M0 0H1440V900H0Z')).toBe(true)
    expect(path.match(/M/g)).toHaveLength(3)
    expect(path).toContain('M18 14')
    expect(path.match(/A14 14/g)).toHaveLength(8)
  })

  it('limits the radius to half of a small hole', () => {
    expect(spotlightPath([{ x: 0, y: 0, width: 10, height: 10 }], viewport, 14)).toContain('A5 5')
  })
})
