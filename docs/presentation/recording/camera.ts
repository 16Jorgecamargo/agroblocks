import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CDPSession, Locator, Page } from '@playwright/test'

export const VIEW = { width: 1280, height: 720 }
export const FULL: Rect = { x: 0, y: 0, width: VIEW.width, height: VIEW.height }
const MIN_FRAME_WIDTH = 500

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

interface CameraKey {
  at: number
  duration: number
  rect: Rect
}

interface Clip {
  id: string
  start: number
  end: number
}

interface FrameEntry {
  file: string
  at: number
}

function seconds(): number {
  return Date.now() / 1000
}

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function center(box: Rect): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export function frame(box: Rect, padding = 24): Rect {
  const aspect = VIEW.width / VIEW.height
  let width = box.width + padding * 2
  let height = box.height + padding * 2
  if (width / height > aspect) height = width / aspect
  else width = height * aspect
  if (width < MIN_FRAME_WIDTH) {
    width = MIN_FRAME_WIDTH
    height = width / aspect
  }
  width = Math.min(width, VIEW.width)
  height = Math.min(height, VIEW.height)
  const middle = center(box)
  const x = Math.min(VIEW.width - width, Math.max(0, middle.x - width / 2))
  const y = Math.min(VIEW.height - height, Math.max(0, middle.y - height / 2))
  return { x, y, width, height }
}

export function union(first: Rect, second: Rect): Rect {
  const x = Math.min(first.x, second.x)
  const y = Math.min(first.y, second.y)
  return { x, y, width: Math.max(first.x + first.width, second.x + second.width) - x, height: Math.max(first.y + first.height, second.y + second.height) - y }
}

export async function boxOf(target: Locator): Promise<Rect> {
  let previous = await target.boundingBox()
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await target.page().waitForTimeout(80)
    const current = await target.boundingBox()
    if (previous && current && current.x === previous.x && current.y === previous.y && current.height === previous.height && current.width === previous.width) return current
    previous = current
  }
  throw new Error('element never stopped moving')
}

export function installOverlays(): void {
  const css = `
    .ghost-key { display: none !important; }
    .take-spot { position: fixed; left: 0; top: 0; width: 0; height: 0; border-radius: 14px; border: 3px solid #f6c212; z-index: 2147483000; pointer-events: none;
      box-shadow: 0 0 0 200vmax rgb(15 26 35 / 0.5); opacity: 0;
      transition: left 500ms cubic-bezier(0.65, 0, 0.35, 1), top 500ms cubic-bezier(0.65, 0, 0.35, 1), width 500ms cubic-bezier(0.65, 0, 0.35, 1), height 500ms cubic-bezier(0.65, 0, 0.35, 1), opacity 350ms ease; }
    .take-spot.is-on { opacity: 1; }
  `
  const mount = () => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
    const spot = document.createElement('div')
    spot.className = 'take-spot'
    document.body.append(spot)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
}

export async function fitWindow(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page)
  const { windowId } = await session.send('Browser.getWindowForTarget')
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const size = await page.evaluate(() => ({ outerWidth: window.outerWidth, outerHeight: window.outerHeight, innerWidth: window.innerWidth, innerHeight: window.innerHeight }))
    if (size.innerWidth === VIEW.width && size.innerHeight === VIEW.height) break
    await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal', width: VIEW.width + size.outerWidth - size.innerWidth, height: VIEW.height + size.outerHeight - size.innerHeight } })
    await page.waitForTimeout(400)
  }
  await session.detach()
  const final = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight, ratio: window.devicePixelRatio }))
  if (final.width !== VIEW.width || final.height !== VIEW.height || final.ratio !== 2) throw new Error(`unexpected window ${JSON.stringify(final)}`)
}

export class Hand {
  private at: Point = { x: VIEW.width * 0.5, y: VIEW.height * 0.62 }

  constructor(private readonly page: Page) {}

  async place(point: Point = this.at) {
    this.at = point
    await this.page.mouse.move(point.x, point.y)
  }

  async glide(to: Point, ms = 650) {
    const from = this.at
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const bend = Math.min(50, distance * 0.1)
    const normal = distance === 0 ? { x: 0, y: 0 } : { x: -(to.y - from.y) / distance, y: (to.x - from.x) / distance }
    const started = Date.now()
    for (let progress = 0; progress < 1; progress = Math.min(1, (Date.now() - started) / ms)) {
      const t = ease(progress)
      const arc = Math.sin(Math.PI * progress) * bend
      await this.page.mouse.move(from.x + (to.x - from.x) * t + normal.x * arc, from.y + (to.y - from.y) * t + normal.y * arc)
      await this.page.waitForTimeout(12)
    }
    await this.page.mouse.move(to.x, to.y)
    this.at = to
  }

  async hover(target: Locator, ms = 650) {
    await target.scrollIntoViewIfNeeded()
    await this.glide(center(await boxOf(target)), ms)
  }

  async pointAt(target: Locator, ms = 650) {
    const box = await boxOf(target)
    const y = Math.min(VIEW.height - 28, box.y + box.height + 20)
    await this.glide({ x: Math.min(VIEW.width - 40, box.x + box.width - 24), y }, ms)
  }

  async rest(point: Point, ms = 500) {
    await this.glide(point, ms)
  }

  async click(target: Locator, ms = 650) {
    await target.scrollIntoViewIfNeeded()
    await this.clickAt(center(await boxOf(target)), ms)
  }

  async clickAt(point: Point, ms = 650) {
    await this.glide(point, ms)
    await this.page.waitForTimeout(160)
    await this.page.mouse.down()
    await this.page.waitForTimeout(110)
    await this.page.mouse.up()
    await this.page.waitForTimeout(320)
  }

  async drag(from: Point, to: Point, ms = 1000) {
    await this.glide(from)
    await this.page.waitForTimeout(180)
    await this.page.mouse.down()
    await this.page.waitForTimeout(180)
    await this.glide({ x: from.x + 12, y: from.y + 6 }, 140)
    await this.glide(to, ms)
    await this.page.waitForTimeout(200)
    await this.page.mouse.up()
    await this.page.waitForTimeout(420)
  }

  async type(target: Locator, text: string, delay = 55) {
    await this.click(target)
    await this.page.keyboard.type(text, { delay })
    await this.page.waitForTimeout(220)
  }

  async press(name: string) {
    await this.page.waitForTimeout(200)
    await this.page.keyboard.press(name)
    await this.page.waitForTimeout(380)
  }
}

export class Take {
  private session: CDPSession | null = null
  private frames: FrameEntry[] = []
  private clips: Clip[] = []
  private keys: CameraKey[] = []
  private pending: Promise<unknown>[] = []
  private directory = ''
  private lastRect: Rect = FULL

  constructor(private readonly page: Page, private readonly name: string, private readonly root: string) {}

  async start() {
    this.directory = join(this.root, this.name)
    await rm(this.directory, { recursive: true, force: true })
    await mkdir(this.directory, { recursive: true })
    this.session = await this.page.context().newCDPSession(this.page)
    const session = this.session
    session.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const file = `${String(this.frames.length).padStart(6, '0')}.jpg`
      this.frames.push({ file, at: metadata.timestamp ?? seconds() })
      this.pending.push(writeFile(join(this.directory, file), Buffer.from(data, 'base64')))
      session.send('Page.screencastFrameAck', { sessionId }).catch(() => undefined)
    })
    await session.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: VIEW.width * 2, maxHeight: VIEW.height * 2, everyNthFrame: 1 })
    await this.page.waitForTimeout(400)
  }

  async clip(id: string, play: () => Promise<void>) {
    const start = seconds()
    await play()
    this.clips.push({ id, start, end: seconds() })
  }

  cut(rect: Rect) {
    this.keys.push({ at: seconds(), duration: 0, rect })
    this.lastRect = rect
  }

  async move(rect: Rect, duration = 900, wait = true) {
    this.keys.push({ at: seconds(), duration: duration / 1000, rect })
    this.lastRect = rect
    if (wait) await this.page.waitForTimeout(duration)
  }

  async focus(target: Locator, padding = 24, duration = 900, wait = true) {
    await this.move(frame(await boxOf(target), padding), duration, wait)
  }

  async spot(target: Locator | null, padding = 6) {
    if (!target) {
      await this.page.evaluate(() => document.querySelector('.take-spot')?.classList.remove('is-on'))
      return
    }
    const box = await boxOf(target)
    await this.page.evaluate(
      ({ x, y, width, height }) => {
        const spot = document.querySelector('.take-spot') as HTMLElement
        const wasOn = spot.classList.contains('is-on')
        if (!wasOn) spot.style.transition = 'opacity 350ms ease'
        spot.style.left = `${x}px`
        spot.style.top = `${y}px`
        spot.style.width = `${width}px`
        spot.style.height = `${height}px`
        void spot.offsetWidth
        spot.classList.add('is-on')
        if (!wasOn) requestAnimationFrame(() => { spot.style.transition = '' })
      },
      { x: box.x - padding, y: box.y - padding, width: box.width + padding * 2, height: box.height + padding * 2 },
    )
  }

  async scrollTo(target: Locator, offset = 90, ms = 800) {
    await target.evaluate(
      (element, options) =>
        new Promise<void>((done) => {
          let box = element.parentElement
          while (box && !(box.scrollHeight > box.clientHeight && /(auto|scroll)/.test(getComputedStyle(box).overflowY))) box = box.parentElement
          const scroller = box ?? (document.scrollingElement as Element)
          const from = scroller.scrollTop
          const top = box ? box.getBoundingClientRect().top : 0
          const delta = element.getBoundingClientRect().top - top - options.offset
          const started = performance.now()
          const tick = (now: number) => {
            const t = Math.min(1, (now - started) / options.ms)
            const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
            scroller.scrollTop = from + delta * eased
            if (t < 1) requestAnimationFrame(tick)
            else done()
          }
          requestAnimationFrame(tick)
        }),
      { offset, ms },
    )
  }

  get rect() {
    return this.lastRect
  }

  async finish() {
    await this.session?.send('Page.stopScreencast')
    await this.session?.detach()
    await Promise.all(this.pending)
    await writeFile(join(this.directory, 'timeline.json'), JSON.stringify({ view: VIEW, frames: this.frames, clips: this.clips, keys: this.keys }))
  }
}
