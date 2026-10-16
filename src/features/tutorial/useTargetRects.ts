import { useEffect, useState } from 'react'
import type { Rect } from '@/features/tutorial/tutorialGeometry'
import type { TutorialTarget } from '@/features/tutorial/tutorialTypes'

export function targetSelector(target: TutorialTarget): string {
  return `[data-tutorial="${target}"]`
}

function measure(targets: TutorialTarget[]): Rect[] {
  const rects: Rect[] = []
  for (const target of targets) {
    const element = document.querySelector(targetSelector(target))
    if (!element) continue
    const box = element.getBoundingClientRect()
    rects.push({ x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) })
  }
  return rects
}

function same(a: Rect[], b: Rect[]): boolean {
  return a.length === b.length && a.every((rect, index) => rect.x === b[index].x && rect.y === b[index].y && rect.width === b[index].width && rect.height === b[index].height)
}

export function useTargetRects(targets: TutorialTarget[]): Rect[] {
  const key = targets.join(' ')
  const [rects, setRects] = useState<Rect[]>(() => measure(targets))

  useEffect(() => {
    const list = key ? (key.split(' ') as TutorialTarget[]) : []
    let frame = 0
    const tick = () => {
      const next = measure(list)
      setRects((current) => (same(current, next) ? current : next))
      frame = window.requestAnimationFrame(tick)
    }
    tick()
    return () => window.cancelAnimationFrame(frame)
  }, [key])

  return rects
}
