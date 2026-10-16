import { useMemo, useRef, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Icon } from '@/components/icons/Icon'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus } from '@/game/progress/types'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import type { Vec2 } from '@/render/world/worldTypes'
import { CANVAS_RESIZE } from '@/render/canvasResize'

interface MissionMapSceneProps {
  missions: MissionDefinition[]
  statuses: Record<string, MissionStatus>
  selectedId: string
  onSelect: (id: string) => void
  lowGraphics: boolean
  ambient: boolean
  celebrateIds: string[]
  onReady?: () => void
}

const NODE_COLORS: Record<MissionStatus, string> = {
  completed: '#3fa34d',
  available: '#4185d6',
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

export default function MissionMapScene({ missions, statuses, selectedId, onSelect, lowGraphics, ambient, celebrateIds, onReady }: MissionMapSceneProps) {
  const world = useMemo(() => buildWorld({ layout: 'map', gridWidth: 0, gridHeight: 0, seed: 'mission-map', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const alive = ambient && !lowGraphics
  return (
    <div className="map-scene">
      <Canvas resize={CANVAS_RESIZE}
        orthographic
        shadows={!lowGraphics}
        dpr={lowGraphics ? 1 : [1, 2]}
        camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }}
        onCreated={() => onReady?.()}
        aria-hidden="true"
      >
        <color attach="background" args={['#131f29']} />
        <LabelProjector labels={labels} trail={world.trail} />
        <CameraRig gridWidth={18} gridHeight={10} quarterTurns={0} zoomLevel={1.32} showcase={false} reducedMotion />
        <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
        <directionalLight position={[10, 18, 8]} intensity={1.5} castShadow={!lowGraphics} shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} />
        <WorldTerrain world={world} />
        <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
        <Herd animals={world.animals} active={alive} />
        <Butterflies points={world.butterflies} active={alive} />
        {missions.map((mission) => {
          const node = world.trail[mission.order]
          const status = statuses[mission.id] ?? 'locked'
          const selected = mission.id === selectedId
          return (
            <group key={mission.id} position={[node.x, 0, node.z]}>
              <mesh
                position={[0, selected ? 0.4 : 0.2, 0]}
                castShadow
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(mission.id)
                }}
              >
                <cylinderGeometry args={[0.75, 0.8, 0.35, 6]} />
                <meshStandardMaterial color={NODE_COLORS[status]} flatShading emissive={selected ? NODE_COLORS[status] : '#000000'} emissiveIntensity={selected ? 0.4 : 0} />
              </mesh>
            </group>
          )
        })}
      </Canvas>
      {missions.map((mission) => {
        const status = statuses[mission.id] ?? 'locked'
        const celebrate = celebrateIds.includes(mission.id)
        const pulse = status === 'available' && ambient && !celebrate
        return (
          <button
            key={mission.id}
            ref={(element) => {
              labels.current[mission.order] = element
            }}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`map-label map-label--${status}${mission.id === selectedId ? ' is-selected' : ''}`}
            onClick={() => onSelect(mission.id)}
          >
            <motion.span
              className="map-label__inner"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={celebrate ? { opacity: 1, scale: [0.6, 1.25, 1], rotate: [0, -6, 6, 0] } : { opacity: 1, scale: 1 }}
              transition={{ ...SPRINGS.marker, delay: mission.order * 0.07 }}
            >
              <motion.span
                className="map-label__hex"
                animate={pulse ? { boxShadow: ['0 0 0 0 rgba(76,141,246,0.9)', '0 0 0 10px rgba(76,141,246,0)'] } : undefined}
                transition={pulse ? { duration: DURATIONS.glowPulse, repeat: Infinity, ease: EASINGS.easeOutCubic } : undefined}
              >
                <span className="map-label__number">{mission.tutorial ? 'T' : mission.order}</span>
                <Icon name={status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'play'} size={14} />
              </motion.span>
              <span className="map-label__text">{mission.title}</span>
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
