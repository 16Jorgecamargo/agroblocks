import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3, type OrthographicCamera } from 'three'
import { Icon } from '@/components/icons/Icon'
import { nodeKey, type NodeState, type TrailNode } from '@/features/mission-select/trailNodes'
import type { WorldId } from '@/game/worlds/worldTypes'
import { SPRINGS } from '@/motion/springs'
import { CANVAS_RESIZE } from '@/render/canvasResize'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { WorldFeatures } from '@/render/world/WorldFeatures'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import type { Vec2 } from '@/render/world/worldTypes'

interface WorldMapSceneProps {
  world: WorldId
  nodes: TrailNode[]
  states: NodeState[]
  stars: number[]
  selected: string
  onSelect: (key: string) => void
  lowGraphics: boolean
  ambient: boolean
  onReady?: () => void
}

const NODE_COLORS: Record<NodeState, string> = {
  done: '#3fa34d',
  current: '#f2c14e',
  open: '#ffffff',
  locked: '#6b7177',
}

function LabelProjector({ labels, trail }: { labels: RefObject<(HTMLButtonElement | null)[]>; trail: Vec2[] }) {
  const camera = useThree((three) => three.camera)
  const size = useThree((three) => three.size)
  const point = useMemo(() => new Vector3(), [])
  useFrame(() => {
    trail.forEach(({ x, z }, index) => {
      const element = labels.current?.[index]
      if (!element) return
      point.set(x, 1.1, z).project(camera)
      element.style.transform = `translate(-50%, -100%) translate(${((point.x + 1) / 2) * size.width}px, ${((1 - point.y) / 2) * size.height}px)`
    })
  })
  return null
}

const VIEW_EXTENT = 17
const CAMERA_DISTANCE = 24
const CAMERA_ANGLE = Math.PI / 4
const FOLLOW = 6
const DRAG_THRESHOLD = 6
const PAN_LIMIT = 13

interface Pan {
  x: number
  z: number
}

function MapCamera({ focus, pan, instant }: { focus: Vec2; pan: RefObject<Pan>; instant: boolean }) {
  const camera = useThree((three) => three.camera) as OrthographicCamera
  const size = useThree((three) => three.size)
  const target = useRef<Vec2 | null>(null)
  useFrame((_, delta) => {
    const goal = { x: focus.x + (pan.current?.x ?? 0), z: focus.z + (pan.current?.z ?? 0) }
    const current = target.current ?? goal
    const blend = instant ? 1 : 1 - Math.exp(-delta * FOLLOW)
    const next = { x: current.x + (goal.x - current.x) * blend, z: current.z + (goal.z - current.z) * blend }
    target.current = next
    camera.zoom = Math.min(size.width, size.height) / VIEW_EXTENT
    camera.updateProjectionMatrix()
    camera.position.set(next.x + Math.sin(CAMERA_ANGLE) * CAMERA_DISTANCE, CAMERA_DISTANCE * 0.82, next.z + Math.cos(CAMERA_ANGLE) * CAMERA_DISTANCE)
    camera.lookAt(next.x, 0, next.z)
  })
  return null
}

function screenToGround(dx: number, dy: number, zoom: number): Pan {
  const right = { x: Math.cos(CAMERA_ANGLE), z: -Math.sin(CAMERA_ANGLE) }
  const forward = { x: -Math.sin(CAMERA_ANGLE), z: -Math.cos(CAMERA_ANGLE) }
  const scale = 1 / zoom
  return { x: -(dx * right.x) * scale + dy * forward.x * scale * 1.4, z: -(dx * right.z) * scale + dy * forward.z * scale * 1.4 }
}

function labelText(node: TrailNode): string {
  if (node.kind === 'mission') return node.mission.title
  return node.kind === 'preTest' ? 'Prova inicial' : 'Prova final'
}

export default function WorldMapScene({ world, nodes, states, stars, selected, onSelect, lowGraphics, ambient, onReady }: WorldMapSceneProps) {
  const map = useMemo(() => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: world, density: lowGraphics ? 'light' : 'full', theme: world }), [world, lowGraphics])
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const alive = ambient && !lowGraphics
  const pan = useRef<Pan>({ x: 0, z: 0 })
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const selectedIndex = Math.max(0, nodes.findIndex((node) => nodeKey(node) === selected))
  const focus = map.trail[selectedIndex] ?? { x: 0, z: 0 }

  useEffect(() => {
    pan.current = { x: 0, z: 0 }
  }, [selected, world])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, moved: false }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    state.moved = true
    const height = wrapper.current?.clientHeight ?? 1
    const width = wrapper.current?.clientWidth ?? 1
    const delta = screenToGround(dx, dy, Math.min(width, height) / VIEW_EXTENT)
    const clamp = (value: number) => Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, value))
    pan.current = { x: clamp(pan.current.x + delta.x), z: clamp(pan.current.z + delta.z) }
    drag.current = { x: event.clientX, y: event.clientY, moved: true }
  }
  const onPointerUp = () => {
    drag.current = null
  }
  return (
    <div ref={wrapper} className="map-scene" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      <Canvas
        resize={CANVAS_RESIZE}
        orthographic
        shadows={!lowGraphics}
        dpr={lowGraphics ? 1 : [1, 2]}
        camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }}
        onCreated={() => onReady?.()}
        aria-hidden="true"
      >
        <color attach="background" args={['#131f29']} />
        <LabelProjector labels={labels} trail={map.trail} />
        <MapCamera focus={focus} pan={pan} instant={!ambient} />
        <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
        <directionalLight position={[10, 18, 8]} intensity={1.5} castShadow={!lowGraphics} shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} />
        <WorldTerrain world={map} />
        <WorldProps world={map} shadows={!lowGraphics} ambient={alive} />
        <WorldFeatures features={map.features} ambient={alive} />
        <Butterflies points={map.butterflies} active={alive} />
        {nodes.map((node, index) => {
          const point = map.trail[index]
          const key = nodeKey(node)
          const state = states[index]
          const active = key === selected
          const final = node.kind === 'mission' && node.mission.slot === 10
          return (
            <group key={key} position={[point.x, 0, point.z]}>
              <mesh
                position={[0, active ? 0.4 : 0.2, 0]}
                castShadow
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(key)
                }}
              >
                {final ? <boxGeometry args={[1.3, 0.35, 1.3]} /> : <cylinderGeometry args={[0.7, 0.75, 0.35, node.kind === 'mission' ? 6 : 4]} />}
                <meshStandardMaterial color={NODE_COLORS[state]} flatShading emissive={active ? NODE_COLORS[state] : '#000000'} emissiveIntensity={active ? 0.4 : 0} />
              </mesh>
            </group>
          )
        })}
      </Canvas>
      {nodes.map((node, index) => {
        const key = nodeKey(node)
        const state = states[index]
        return (
          <button
            key={key}
            ref={(element) => {
              labels.current[index] = element
            }}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`map-label map-label--${state}${key === selected ? ' is-selected' : ''}`}
            onClick={() => onSelect(key)}
          >
            <motion.span className="map-label__inner" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRINGS.marker, delay: index * 0.05 }}>
              <span className="map-label__hex">
                {node.kind === 'mission' ? (
                  <span className="map-label__number">{node.mission.slot === 10 ? '★' : node.mission.slot}</span>
                ) : (
                  <Icon name="flag" size={14} />
                )}
                {node.kind === 'mission' && state === 'done' && (
                  <span className="map-label__stars" aria-hidden="true">
                    {'★'.repeat(stars[index])}
                    <span className="map-label__stars-off">{'★'.repeat(3 - stars[index])}</span>
                  </span>
                )}
                {state === 'locked' && <Icon name="lock" size={14} />}
              </span>
              <span className="map-label__text">{labelText(node)}</span>
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
