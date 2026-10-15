import { Suspense, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { legendCell, type LegendPreview } from '@/features/legend/legendPages'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { PALETTE } from '@/render/palette'

function Aim() {
  const camera = useThree((three) => three.camera)
  useLayoutEffect(() => {
    camera.lookAt(0, 0.45, 0)
  }, [camera])
  return null
}

function Turntable({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (active && ref.current) ref.current.rotation.y += delta * 0.5
  })
  return (
    <group ref={ref} rotation={[0, -0.4, 0]}>
      {children}
    </group>
  )
}

export default function LegendPreview3D({ preview, reducedMotion }: { preview: LegendPreview; reducedMotion: boolean }) {
  const key = `${preview.terrain}-${preview.plot}-${preview.moisture}-${preview.goal}`
  return (
    <Canvas orthographic dpr={[1, 2]} camera={{ position: [4, 3.6, 4], zoom: 120, near: -50, far: 50 }} aria-hidden="true">
      <color attach="background" args={[PALETTE.sky]} />
      <Aim />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 1]} />
      <directionalLight position={[3, 6, 2]} intensity={1.4} />
      <Turntable active={!reducedMotion}>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[1.5, 0.1, 1.5]} />
          <Flat color={PALETTE.grassMid} />
        </mesh>
        <Suspense fallback={null}>
          <PlotTile key={key} cell={legendCell(preview)} position={[0, 0, 0]} isGoal={preview.goal} reducedMotion={reducedMotion} />
        </Suspense>
      </Turntable>
    </Canvas>
  )
}
