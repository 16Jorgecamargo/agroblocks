import { Canvas } from '@react-three/fiber'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { Flat } from '@/render/farm3d/materials'
import { RobotShowcase } from '@/render/farm3d/RobotModel'
import { Model } from '@/render/models/Model'
import { SpinningProp } from '@/render/world/SpinningProp'
import { PALETTE } from '@/render/palette'

export default function CelebrationScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas orthographic dpr={[1, 2]} camera={{ position: [10, 10, 10], zoom: 60, near: -100, far: 200 }} aria-hidden="true">
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig gridWidth={3} gridHeight={3} quarterTurns={0} zoomLevel={0.85} showcase reducedMotion={reducedMotion} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 1]} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} />
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[14, 0.1, 14]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      <group scale={1.23}>
        <RobotShowcase clip="success" />
      </group>
      <group position={[0.2, 0.55, 0.9]}>
        <mesh>
          <boxGeometry args={[0.9, 0.35, 0.55]} />
          <Flat color={PALETTE.crate} />
        </mesh>
        {[-0.28, -0.08, 0.12, 0.3].map((x, index) => (
          <mesh key={x} position={[x, 0.24, (index % 2) * 0.12 - 0.06]}>
            <icosahedronGeometry args={[0.12, 1]} />
            <Flat color={index % 3 === 0 ? PALETTE.fruitAlt : PALETTE.fruit} />
          </mesh>
        ))}
      </group>
      <group position={[-3.5, 0, -3]} rotation={[0, 0.6, 0]} scale={0.55}>
        <Model id="barn" fallback={null} />
      </group>
      <SpinningProp prop={{ model: 'tower-windmill', x: 3.2, z: -3.2, rotation: 0, scale: 0.5 }} active={!reducedMotion} />
      <group position={[-3, 0, 2.5]}>
        <Model id="tree-a" fallback={null} />
      </group>
    </Canvas>
  )
}
