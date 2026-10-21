import type { WorldId } from '@/game/worlds/worldTypes'
import { buildWorld } from '@/render/world/buildWorld'
import { buildOccupancy } from '@/render/world/navigation/buildOccupancy'
import { OCCUPANTS, type Occupant } from '@/render/world/navigation/occupancy'
import { walkMask } from '@/render/world/navigation/passability'
import type { Vec2 } from '@/render/world/worldTypes'

const COLORS: Record<Occupant, string> = {
  free: '#7cc35a',
  road: '#c9a46b',
  crop: '#3f7f2e',
  tree: '#1f5a2a',
  feed: '#4c9be8',
  structure: '#8a5a3c',
  fence: '#2f1f12',
  water: '#2f6fd0',
  marker: '#f2c14e',
  missionGrid: '#e0473c',
}
const SCALE = 8

const params = new URLSearchParams(location.search)
const theme = (params.get('world') ?? 'garden') as WorldId
const farm = params.get('layout') === 'farm'
const width = Number(params.get('w') ?? 5)
const height = Number(params.get('h') ?? 3)
const world = buildWorld({ layout: farm ? 'farm' : 'worldMap', gridWidth: width, gridHeight: height, seed: farm ? `${theme}-01` : theme, density: params.get('light') ? 'light' : 'full', theme })
const grid = buildOccupancy(world)
const person = walkMask(grid, 'person')

const canvas = document.createElement('canvas')
canvas.width = grid.columns * SCALE
canvas.height = grid.rows * SCALE
const context = canvas.getContext('2d') as CanvasRenderingContext2D
for (let index = 0; index < grid.cells.length; index += 1) {
  const x = (index % grid.columns) * SCALE
  const z = Math.floor(index / grid.columns) * SCALE
  context.fillStyle = COLORS[OCCUPANTS[grid.cells[index]]]
  context.fillRect(x, z, SCALE, SCALE)
  if (!person.open[index] && OCCUPANTS[grid.cells[index]] === 'free') {
    context.fillStyle = 'rgba(0,0,0,0.25)'
    context.fillRect(x, z, SCALE, SCALE)
  }
}
const toCanvas = (point: Vec2): [number, number] => [((point.x - grid.minX) / grid.cell) * SCALE, ((point.z - grid.minZ) / grid.cell) * SCALE]
for (const animal of world.animals) {
  context.fillStyle = 'rgba(255,255,255,0.18)'
  for (const cell of animal.walk ?? []) {
    const [x, z] = toCanvas(cell)
    context.fillRect(x - SCALE / 2, z - SCALE / 2, SCALE, SCALE)
  }
  const [x, z] = toCanvas(animal)
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(x, z, SCALE * 0.9, 0, Math.PI * 2)
  context.fill()
}
for (const actor of world.actors ?? []) {
  context.strokeStyle = actor.kind === 'tractor' ? '#ff4fd8' : actor.tint
  context.lineWidth = 3
  context.beginPath()
  actor.route.forEach((point, index) => {
    const [x, z] = toCanvas(point)
    if (index === 0) context.moveTo(x, z)
    else context.lineTo(x, z)
  })
  context.stroke()
  for (const point of [actor.route[0], actor.route[actor.route.length - 1]]) {
    const [x, z] = toCanvas(point)
    context.fillStyle = context.strokeStyle
    context.fillRect(x - 5, z - 5, 10, 10)
  }
}

const root = document.getElementById('root') as HTMLElement
const title = document.createElement('h1')
title.textContent = `${theme} · ${farm ? `mission ${width}x${height}` : 'map'} · ${(world.actors ?? []).length} actors · ${world.animals.length} animals`
const legend = document.createElement('ul')
for (const occupant of OCCUPANTS) {
  const item = document.createElement('li')
  item.innerHTML = `<span style="background:${COLORS[occupant]}"></span>${occupant}`
  legend.append(item)
}
root.append(title, legend, canvas)
