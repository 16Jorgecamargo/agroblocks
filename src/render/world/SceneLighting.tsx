import type { WorldStyle } from '@/render/world/worldStyles'

export function SceneLighting({ style, shadows, shadowExtent, background = true }: { style: WorldStyle; shadows: boolean; shadowExtent: number; background?: boolean }) {
  return (
    <>
      {background && <color attach="background" args={[style.sky]} />}
      <hemisphereLight args={[style.hemisphere.sky, style.hemisphere.ground, style.hemisphere.intensity]} />
      <directionalLight
        position={style.sun.position}
        color={style.sun.color}
        intensity={style.sun.intensity}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
      />
    </>
  )
}
