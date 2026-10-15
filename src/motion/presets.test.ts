import { EASINGS } from '@/motion/easings'
import { SPRINGS, scaleSpring } from '@/motion/springs'
import {
  BADGE_POP,
  DURATIONS,
  ERROR_SHAKE,
  dialogSheet,
  fadeSlide,
  pageVariants,
  staggerContainer,
} from '@/motion/presets'

describe('motion presets', () => {
  it('uses the reference spring values', () => {
    expect(SPRINGS.sheet).toEqual({ type: 'spring', stiffness: 260, damping: 20, mass: 1 })
    expect(SPRINGS.snap).toEqual({ type: 'spring', stiffness: 180, damping: 13, mass: 0.6 })
    expect(SPRINGS.star).toEqual({ type: 'spring', stiffness: 400, damping: 14, mass: 1 })
    expect(SPRINGS.jelly.damping).toBe(6.8)
  })

  it('uses the reference durations in seconds', () => {
    expect(DURATIONS).toMatchObject({
      fadeSlide: 0.6,
      softRise: 0.9,
      snapIn: 0.38,
      shrinkFadeExit: 0.52,
      staggerList: 0.76,
      gridWave: 0.9,
      errorShake: 0.54,
      nudge: 0.52,
      blurCrossfade: 0.6,
      iris: 0.6,
      push: 0.4,
      odometer: 0.75,
      countUp: 2,
      rowExpand: 0.72,
    })
  })

  it('builds fade + slide with easeOutCubic', () => {
    expect(fadeSlide.visible).toMatchObject({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASINGS.easeOutCubic } })
  })

  it('animates dialogs with the sheet spring and exits with shrink fade', () => {
    expect(dialogSheet.visible).toMatchObject({ opacity: 1, y: 0, scale: 1, transition: SPRINGS.sheet })
    expect(dialogSheet.exit).toMatchObject({ opacity: 0, scale: 0.9, transition: { duration: 0.52 } })
  })

  it('provides one page variant per transition kind', () => {
    expect(Object.keys(pageVariants).sort()).toEqual(['blurCrossfade', 'iris', 'push'])
    expect(pageVariants.iris.animate).toMatchObject({ clipPath: 'circle(150% at 50% 50%)' })
  })

  it('staggers children', () => {
    expect(staggerContainer(0.08, 0.2).visible).toEqual({ transition: { staggerChildren: 0.08, delayChildren: 0.2 } })
  })

  it('defines shake and pop keyframes', () => {
    expect(ERROR_SHAKE.keyframes.x.at(-1)).toBe(0)
    expect(ERROR_SHAKE.options.duration).toBe(0.54)
    expect(BADGE_POP.keyframes.scale).toEqual([1, 1.35, 0.95, 1])
  })

  it('scales springs with the execution speed', () => {
    expect(scaleSpring(SPRINGS.smooth, 2)).toEqual({ type: 'spring', stiffness: 480, damping: 52, mass: 1 })
    expect(scaleSpring(SPRINGS.smooth, 1)).toEqual(SPRINGS.smooth)
  })
})

describe('page transitions', () => {
  it('leave no filter behind so fixed children stay attached to the viewport', () => {
    const animateTarget = pageVariants.blurCrossfade.animate as { transitionEnd?: { filter?: string } }
    expect(animateTarget.transitionEnd?.filter).toBe('none')
  })
})
