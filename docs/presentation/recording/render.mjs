import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(here, '../../../package.json'))
const sharp = require('sharp')

const FPS = 30
const OUTPUT = { width: 1600, height: 900 }
const FFMPEG = process.env.FFMPEG_BIN ?? 'ffmpeg'
const rawRoot = process.env.RECORDING_RAW
const assetsRoot = resolve(here, '../assets/clips')
const onlyTakes = process.argv.slice(2)

if (!rawRoot) throw new Error('RECORDING_RAW is required')

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function mix(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  }
}

function cameraAt(keys, view, time) {
  let rect = { x: 0, y: 0, width: view.width, height: view.height }
  for (const key of keys) {
    if (key.at > time) break
    const t = key.duration === 0 ? 1 : Math.min(1, (time - key.at) / key.duration)
    rect = mix(rect, key.rect, ease(t))
  }
  return rect
}

function frameIndexAt(frames, time, from) {
  let index = from
  while (index + 1 < frames.length && frames[index + 1].at <= time) index += 1
  return index
}

function encoder(args) {
  const child = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', ...args], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((done, fail) => {
    child.on('error', fail)
    child.on('close', (code) => (code === 0 ? done() : fail(new Error(`ffmpeg exited with ${code}`))))
  })
  return { child, done }
}

async function write(child, data) {
  if (!child.stdin.write(data)) await new Promise((proceed) => child.stdin.once('drain', proceed))
}

async function renderClip(take, directory, timeline, clip) {
  const { frames, keys, view } = timeline
  const scale = (await sharp(join(directory, frames[0].file)).metadata()).width / view.width
  console.log(`${take}/${clip.id}: capture scale ${scale}`)
  const target = join(assetsRoot, take)
  await mkdir(target, { recursive: true })
  const webm = encoder(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-threads', '8', '-g', '30', '-pix_fmt', 'yuv420p', '-an', join(target, `${clip.id}.webm`)])
  const mp4 = encoder(['-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-g', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(target, `${clip.id}.mp4`)])
  const total = Math.max(1, Math.round((clip.end - clip.start) * FPS))
  let index = 0
  let cacheKey = ''
  let cached = null
  let first = null
  for (let step = 0; step < total; step += 1) {
    const time = clip.start + step / FPS
    index = frameIndexAt(frames, time, index)
    const rect = cameraAt(keys, view, time)
    const left = Math.max(0, Math.round(rect.x * scale))
    const top = Math.max(0, Math.round(rect.y * scale))
    const width = Math.min(view.width * scale - left, Math.round(rect.width * scale))
    const height = Math.min(view.height * scale - top, Math.round(rect.height * scale))
    const key = `${index}:${left}:${top}:${width}:${height}`
    if (key !== cacheKey) {
      cached = await sharp(join(directory, frames[index].file)).extract({ left, top, width, height }).resize(OUTPUT.width, OUTPUT.height, { kernel: 'lanczos3' }).jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toBuffer()
      cacheKey = key
    }
    if (!first) first = cached
    await Promise.all([write(webm.child, cached), write(mp4.child, cached)])
  }
  webm.child.stdin.end()
  mp4.child.stdin.end()
  await Promise.all([webm.done, mp4.done])
  if (clip.id === 'step-1') await writeFile(join(target, `${clip.id}-first.jpg`), first)
  return total / FPS
}

const takes = onlyTakes.length ? onlyTakes : ['retorno', 'painel', 'roteiro']
for (const take of takes) {
  const directory = join(rawRoot, take)
  const timeline = JSON.parse(await readFile(join(directory, 'timeline.json'), 'utf8'))
  for (const clip of timeline.clips) {
    const duration = await renderClip(take, directory, timeline, clip)
    console.log(`${take}/${clip.id}: ${duration.toFixed(1)}s`)
  }
}
