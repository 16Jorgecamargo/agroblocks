import { useMemo, useRef, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { Barn, Tree } from '@/render/farm3d/Decorations'
import { Flat } from '@/render/farm3d/materials'
import { PALETTE } from '@/render/palette'
import { BARN_POSITION, mapScenery, NODE_POSITIONS, pathStones, RIVER_POINTS } from '@/features/mission-select/missionMapLayout'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus } from '@/game/progress/types'
import { DURATIONS } from '@/motion/presets'

interface MissionMapSceneProps {
  missions: MissionDefinition[]
  statuses: Record<string, MissionStatus>
  selectedId: string
  onSelect: (id: string) => void
  lowGraphics: boolean
  ambient: boolean
  celebrateIds: string[]
}

const NODE_COLORS: Record<MissionStatus, string> = {
  completed: '#3fa34d',
  available: '#4185d6',
  locked: '#6b7177',
}


function LabelProjector({ labels }: { labels: RefObject<(HTMLButtonElement | null)[]> }) {
  const camera = useThree((three) => three.camera)
  const size = useThree((three) => three.size)
  const point = useMemo(() => new Vector3(), [])
  useFrame(() => {
    NODE_POSITIONS.forEach(([x, z], index) => {
      const element = labels.current?.[index]
      if (!element) return
      point.set(x, 1.1, z).project(camera)
      const left = ((point.x + 1) / 2) * size.width
      const top = ((1 - point.y) / 2) * size.height
      element.style.transform = `translate(-50%, -100%) translate(${left}px, ${top}px)`
    })
  })
  return null
}

export default function MissionMapScene({ missions, statuses, selectedId, onSelect, lowGraphics, ambient, celebrateIds }: MissionMapSceneProps) {
  const scenery = useMemo(() => mapScenery('mission-map', lowGraphics ? 14 : 38), [lowGraphics])
  const stones = useMemo(() => pathStones(), [])
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div className="map-scene">
      <Canvas orthographic shadows={!lowGraphics} dpr={lowGraphics ? 1 : [1, 2]} camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }} aria-hidden="true">
        <color attach="background" args={['#131f29']} />
        <LabelProjector labels={labels} />
        <CameraRig gridWidth={18} gridHeight={10} quarterTurns={0} zoomLevel={1.32} showcase={false} reducedMotion />
        <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
        <directionalLight position={[8, 14, 6]} intensity={1.4} castShadow={!lowGraphics} />
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[21, 0.2, 21]} />
          <Flat color={PALETTE.grassMid} />
        </mesh>
        {RIVER_POINTS.slice(0, -1).map(([x1, z1], index) => {
          const [x2, z2] = RIVER_POINTS[index + 1]
          const length = Math.hypot(x2 - x1, z2 - z1)
          return (
            <mesh key={index} position={[(x1 + x2) / 2, 0.01, (z1 + z2) / 2]} rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]}>
              <boxGeometry args={[length + 0.4, 0.04, 1.1]} />
              <Flat color={PALETTE.water} />
            </mesh>
          )
        })}
        {stones.map(([x, z], index) => (
          <mesh key={index} position={[x, 0.04, z]}>
            <cylinderGeometry args={[0.18, 0.2, 0.06, 6]} />
            <Flat color={PALETTE.straw} />
          </mesh>
        ))}
        {scenery.map((item, index) => (
          <group key={index} position={[item.x, 0, item.z]} scale={item.scale}>
            <Tree variant={item.variant} />
          </group>
        ))}
        <group position={[BARN_POSITION[0], 0, BARN_POSITION[1]]} rotation={[0, Math.PI / 4, 0]} scale={0.8}>
          <Barn />
        </group>
        {missions.map((mission) => {
          const [x, z] = NODE_POSITIONS[mission.order]
          const status = statuses[mission.id] ?? 'locked'
          const selected = mission.id === selectedId
          return (
            <group key={mission.id} position={[x, 0, z]}>
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
