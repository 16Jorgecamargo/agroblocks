# Phase 2 — Spotlight and callout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Read `plan_index.md` first (Global Constraints).

**Spec:** section 5.

### Task 2.1: Geometry — `placeCallout` and `spotlightPath`

**Files:**
- Create: `src/features/tutorial/tutorialGeometry.ts`, `src/features/tutorial/tutorialGeometry.test.ts`

**Interfaces:**
- Consumes: `CalloutSide` (Task 1.1).
- Produces:
  - `interface Rect { x: number; y: number; width: number; height: number }`, `interface Size { width: number; height: number }`
  - `interface CalloutPlacement { side: CalloutSide; x: number; y: number; arrow: number }`
  - `CALLOUT_GAP = 14`, `VIEWPORT_MARGIN = 16`, `ARROW_INSET = 18`, `HOLE_PADDING = 6`, `HOLE_RADIUS = 14`
  - `placeCallout(target: Rect, callout: Size, viewport: Size, prefer?: CalloutSide): CalloutPlacement`
  - `padRect(rect: Rect, padding: number): Rect`
  - `spotlightPath(holes: Rect[], viewport: Size, radius?: number): string`

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/tutorialGeometry.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/tutorialGeometry.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`src/features/tutorial/tutorialGeometry.ts`:
```ts
import type { CalloutSide } from '@/features/tutorial/tutorialTypes'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface CalloutPlacement {
  side: CalloutSide
  x: number
  y: number
  arrow: number
}

export const CALLOUT_GAP = 14
export const VIEWPORT_MARGIN = 16
export const ARROW_INSET = 18
export const HOLE_PADDING = 6
export const HOLE_RADIUS = 14

const SIDE_ORDER: CalloutSide[] = ['right', 'left', 'bottom', 'top']

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function freeSpace(target: Rect, callout: Size, viewport: Size): Record<CalloutSide, number> {
  return {
    right: viewport.width - (target.x + target.width) - CALLOUT_GAP - VIEWPORT_MARGIN - callout.width,
    left: target.x - CALLOUT_GAP - VIEWPORT_MARGIN - callout.width,
    bottom: viewport.height - (target.y + target.height) - CALLOUT_GAP - VIEWPORT_MARGIN - callout.height,
    top: target.y - CALLOUT_GAP - VIEWPORT_MARGIN - callout.height,
  }
}

export function placeCallout(target: Rect, callout: Size, viewport: Size, prefer?: CalloutSide): CalloutPlacement {
  const space = freeSpace(target, callout, viewport)
  const order = prefer ? [prefer, ...SIDE_ORDER.filter((side) => side !== prefer)] : SIDE_ORDER
  const side = order.find((candidate) => space[candidate] >= 0) ?? order.reduce((best, candidate) => (space[candidate] > space[best] ? candidate : best))
  const centerX = target.x + target.width / 2
  const centerY = target.y + target.height / 2
  if (side === 'right' || side === 'left') {
    const x = side === 'right' ? target.x + target.width + CALLOUT_GAP : target.x - CALLOUT_GAP - callout.width
    const y = clamp(centerY - callout.height / 2, VIEWPORT_MARGIN, viewport.height - VIEWPORT_MARGIN - callout.height)
    return { side, x, y, arrow: clamp(centerY - y, ARROW_INSET, callout.height - ARROW_INSET) }
  }
  const y = side === 'bottom' ? target.y + target.height + CALLOUT_GAP : target.y - CALLOUT_GAP - callout.height
  const x = clamp(centerX - callout.width / 2, VIEWPORT_MARGIN, viewport.width - VIEWPORT_MARGIN - callout.width)
  return { side, x, y, arrow: clamp(centerX - x, ARROW_INSET, callout.width - ARROW_INSET) }
}

export function padRect(rect: Rect, padding: number): Rect {
  return { x: rect.x - padding, y: rect.y - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 }
}

function roundedRect({ x, y, width, height }: Rect, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2)
  const right = x + width
  const bottom = y + height
  return [
    `M${x + r} ${y}`,
    `H${right - r}`,
    `A${r} ${r} 0 0 1 ${right} ${y + r}`,
    `V${bottom - r}`,
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${bottom - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join('')
}

export function spotlightPath(holes: Rect[], viewport: Size, radius = HOLE_RADIUS): string {
  return `M0 0H${viewport.width}V${viewport.height}H0Z${holes.map((hole) => roundedRect(hole, radius)).join('')}`
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/tutorial/tutorialGeometry.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial/tutorialGeometry.ts src/features/tutorial/tutorialGeometry.test.ts
git commit -m "feat(tutorial): callout placement and spotlight hole path

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2.2: `useTargetRects`, `TutorialSpotlight`, `TutorialCallout`

**Files:**
- Create: `src/features/tutorial/useTargetRects.ts`, `src/features/tutorial/TutorialSpotlight.tsx`, `src/features/tutorial/TutorialCallout.tsx`, `src/features/tutorial/TutorialSpotlight.test.tsx`
- Modify: `src/motion/presets.ts` (add `spotlightPulse: 1.6`, `calloutSwap: 0.2`, `howtoLoopPause: 1.2` to `DURATIONS`)

**Interfaces:**
- Consumes: `Rect`, `Size`, `placeCallout`, `padRect`, `spotlightPath`, `HOLE_PADDING` (Task 2.1); `TutorialTarget`, `CalloutSide` (Task 1.1).
- Produces:
  - `targetSelector(target: TutorialTarget): string` → `[data-tutorial="<target>"]`
  - `useTargetRects(targets: TutorialTarget[]): Rect[]` — rects of the elements found, re-measured every animation frame, state updated only when a value changes
  - `TutorialSpotlight({ rects }: { rects: Rect[] })` — fixed full-screen dim with holes, `data-testid="tutorial-spotlight"`, one `.tutorial-spotlight__ring` per rect
  - `TutorialCallout(props: { target: Rect | null; prefer?: CalloutSide; title: string; text: string; notice: string | null; practice: boolean; onShowHowTo: () => void })` — `role="dialog"` `aria-modal="false"` `aria-label={title}`, class `tutorial-callout tutorial-callout--<side>`, `data-side`

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/TutorialSpotlight.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { TutorialCallout } from '@/features/tutorial/TutorialCallout'
import { TutorialSpotlight } from '@/features/tutorial/TutorialSpotlight'
import { targetSelector } from '@/features/tutorial/useTargetRects'

describe('TutorialSpotlight', () => {
  it('cuts one hole and one ring per target rect', () => {
    render(
      <TutorialSpotlight
        rects={[
          { x: 10, y: 10, width: 100, height: 100 },
          { x: 300, y: 10, width: 100, height: 100 },
        ]}
      />,
    )
    const dim = screen.getByTestId('tutorial-spotlight')
    expect(dim.style.clipPath).toContain('evenodd')
    expect(document.querySelectorAll('.tutorial-spotlight__ring')).toHaveLength(2)
  })

  it('builds the target selector from the data attribute', () => {
    expect(targetSelector('editor')).toBe('[data-tutorial="editor"]')
  })
})

describe('TutorialCallout', () => {
  it('shows the step text, a notice and the replay button on practice steps', () => {
    const onShowHowTo = vi.fn()
    render(<TutorialCallout target={{ x: 8, y: 80, width: 500, height: 700 }} title="Adicionar um bloco" text="Arraste o bloco." notice="Tente de novo." practice onShowHowTo={onShowHowTo} />)
    const callout = screen.getByRole('dialog', { name: 'Adicionar um bloco' })
    expect(callout).toHaveTextContent('Arraste o bloco.')
    expect(callout).toHaveTextContent('Tente de novo.')
    expect(callout).toHaveTextContent('Faça a ação para continuar.')
    fireEvent.click(screen.getByRole('button', { name: 'Ver animação' }))
    expect(onShowHowTo).toHaveBeenCalledTimes(1)
  })

  it('has no replay button on tour steps', () => {
    render(<TutorialCallout target={null} title="A fazenda" text="Olhe a fazenda." notice={null} practice={false} onShowHowTo={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Ver animação' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/TutorialSpotlight.test.tsx`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement**

In `src/motion/presets.ts`, inside `DURATIONS`, add after `tutorialDot: 0.8,`:
```ts
  spotlightPulse: 1.6,
  calloutSwap: 0.2,
  howtoLoopPause: 1.2,
```

`src/features/tutorial/useTargetRects.ts`:
```ts
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
```

`src/features/tutorial/TutorialSpotlight.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { HOLE_PADDING, padRect, spotlightPath, type Rect, type Size } from '@/features/tutorial/tutorialGeometry'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

function useViewport(): Size {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState<Size>(read)
  useEffect(() => {
    const update = () => setSize(read())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

export function TutorialSpotlight({ rects }: { rects: Rect[] }) {
  const viewport = useViewport()
  const { ambient } = useMotionPrefs()
  const holes = rects.map((rect) => padRect(rect, HOLE_PADDING))
  return (
    <>
      <div className="tutorial-spotlight" data-testid="tutorial-spotlight" style={{ clipPath: `path(evenodd, "${spotlightPath(holes, viewport)}")` }} />
      {holes.map((hole, index) => (
        <motion.span
          key={index}
          className="tutorial-spotlight__ring"
          aria-hidden="true"
          style={{ left: hole.x, top: hole.y, width: hole.width, height: hole.height }}
          animate={ambient ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
          transition={ambient ? { duration: DURATIONS.spotlightPulse, repeat: Infinity, ease: EASINGS.easeInOutSine } : { duration: DURATIONS.instant }}
        />
      ))}
    </>
  )
}
```

`src/features/tutorial/TutorialCallout.tsx`:
```tsx
import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { placeCallout, type Rect, type Size } from '@/features/tutorial/tutorialGeometry'
import type { CalloutSide } from '@/features/tutorial/tutorialTypes'
import { DURATIONS, overshoot } from '@/motion/presets'

interface TutorialCalloutProps {
  target: Rect | null
  prefer?: CalloutSide
  title: string
  text: string
  notice: string | null
  practice: boolean
  onShowHowTo: () => void
}

const FALLBACK: Size = { width: 340, height: 180 }

export function TutorialCallout({ target, prefer, title, text, notice, practice, onShowHowTo }: TutorialCalloutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>(FALLBACK)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const width = element.offsetWidth || FALLBACK.width
      const height = element.offsetHeight || FALLBACK.height
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const placement = target ? placeCallout(target, size, viewport, prefer) : { side: 'bottom' as const, x: (viewport.width - size.width) / 2, y: viewport.height - size.height - 120, arrow: -100 }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={`tutorial-callout tutorial-callout--${placement.side}`}
      data-side={placement.side}
      style={{ left: placement.x, top: placement.y, ['--arrow' as string]: `${placement.arrow}px` }}
      variants={overshoot}
      initial="hidden"
      animate="visible"
    >
      <strong className="tutorial-callout__title">{title}</strong>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={text} className="tutorial-callout__text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DURATIONS.calloutSwap }}>
          {text}
        </motion.p>
      </AnimatePresence>
      {notice && (
        <p className="tutorial-callout__notice" role="status">
          {notice}
        </p>
      )}
      {practice && (
        <div className="tutorial-callout__footer">
          <span className="tutorial-callout__waiting">Faça a ação para continuar.</span>
          <GameButton tone="ghost" icon="eye" onClick={onShowHowTo}>
            Ver animação
          </GameButton>
        </div>
      )}
    </motion.div>
  )
}
```

CSS for these classes is written in Task 4.1 (`TutorialOverlay.css`); the components only need class names now.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/features/tutorial && npx tsc --noEmit -p .`
Expected: PASS.

If `DURATIONS.instant` does not exist, grep `instant` in `src/motion/presets.ts`; it is used by `Logo.tsx`, so it exists.

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial src/motion/presets.ts
git commit -m "feat(tutorial): spotlight with live target holes and anchored callout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
