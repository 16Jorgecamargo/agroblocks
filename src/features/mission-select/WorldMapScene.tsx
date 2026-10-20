import { useMemo, useRef, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Icon } from '@/components/icons/Icon'
import { nodeKey, type NodeState, type TrailNode } from '@/features/mission-select/trailNodes'
import type { WorldId } from '@/game/worlds/worldTypes'
import { SPRINGS } from '@/motion/springs'
import { CANVAS_RESIZE } from '@/render/canvasResize'
import { CameraRig } from '@/render/farm3d/CameraRig'
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

function labelText(node: TrailNode): string {
  if (node.kind === 'mission') return node.mission.title
  return node.kind === 'preTest' ? 'Prova inicial' : 'Prova final'
}

export default function WorldMapScene({ world, nodes, states, selected, onSelect, lowGraphics, ambient, onReady }: WorldMapSceneProps) {
  const map = useMemo(() => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: world, density: lowGraphics ? 'light' : 'full', theme: world }), [world, lowGraphics])
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const alive = ambient && !lowGraphics
  return (
    <div className="map-scene">
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
        <CameraRig gridWidth={16} gridHeight={16} quarterTurns={0} zoomLevel={0.92} showcase={false} reducedMotion />
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
                {state === 'done' && <Icon name="check" size={14} />}
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
