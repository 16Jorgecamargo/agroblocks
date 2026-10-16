import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

const FPS = 25

interface Frame {
  data: Buffer
  at: number
}

function now(): number {
  return Date.now() / 1000
}

function ffmpegBinary(): string {
  if (process.env.HOWTO_FFMPEG) return process.env.HOWTO_FFMPEG
  const caches = process.env.PLAYWRIGHT_BROWSERS_PATH ?? (platform() === 'darwin' ? join(homedir(), 'Library/Caches/ms-playwright') : join(homedir(), '.cache/ms-playwright'))
  const name = platform() === 'darwin' ? 'ffmpeg-mac' : platform() === 'win32' ? 'ffmpeg-win64.exe' : 'ffmpeg-linux'
  const folder = readdirSync(caches)
    .filter((entry) => entry.startsWith('ffmpeg-'))
    .sort()
    .reverse()
    .find((entry) => existsSync(join(caches, entry, name)))
  if (!folder) throw new Error('Playwright ffmpeg not found; run "npx playwright install ffmpeg" or set HOWTO_FFMPEG')
  return join(caches, folder, name)
}

function frameAt(frames: Frame[], time: number): Frame {
  let chosen = frames[0]
  for (const frame of frames) {
    if (frame.at > time) break
    chosen = frame
  }
  return chosen
}

async function encode(frames: Frame[], start: number, end: number, output: string): Promise<void> {
  const encoder = spawn(
    ffmpegBinary(),
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-deadline', 'good', '-cpu-used', '5', '-row-mt', '1', '-threads', '8', '-tile-columns', '2', '-pix_fmt', 'yuv420p', '-an', output],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )
  const done = new Promise<void>((resolve, reject) => {
    encoder.on('error', reject)
    encoder.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))))
  })
  for (let time = start; time <= end; time += 1 / FPS) {
    if (!encoder.stdin.write(frameAt(frames, time).data)) await new Promise((resolve) => encoder.stdin.once('drain', resolve))
  }
  encoder.stdin.end()
  await done
}

export interface Capture {
  poster: () => void
  finish: (video: string, poster: string) => Promise<void>
}

export async function startCapture(page: Page, size: { width: number; height: number }): Promise<Capture> {
  const session = await page.context().newCDPSession(page)
  const frames: Frame[] = []
  let posterAt: number | null = null
  session.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ data: Buffer.from(data, 'base64'), at: metadata.timestamp ?? now() })
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => undefined)
  })
  await session.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: size.width, maxHeight: size.height, everyNthFrame: 1 })
  const start = now()
  return {
    poster: () => {
      posterAt = now()
    },
    finish: async (video, poster) => {
      const end = now()
      await session.send('Page.stopScreencast')
      await session.detach()
      if (frames.length === 0) throw new Error('no frames captured')
      const first = Math.max(start, frames[0].at)
      await writeFile(poster, frameAt(frames, posterAt ?? end).data)
      await encode(frames, first, end, video)
    },
  }
}
