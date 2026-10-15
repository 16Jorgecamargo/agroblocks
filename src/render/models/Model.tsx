import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Mesh, Object3D } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { MODEL_MANIFEST, modelEntry, modelUrl, type ModelEntry, type ModelId } from '@/render/models/manifest'

interface BoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

export class ModelBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function useClonedScene(entry: ModelEntry): Object3D {
  const { scene } = useGLTF(modelUrl(entry))
  return useMemo(() => {
    const copy = clone(scene)
    copy.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return copy
  }, [scene])
}

function GltfModel({ entry }: { entry: ModelEntry }) {
  const object = useClonedScene(entry)
  return <primitive object={object} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
}

export function Model({ id, fallback }: { id: ModelId; fallback: ReactNode }) {
  const entry = modelEntry(id)
  if (!entry) return <>{fallback}</>
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfModel entry={entry} />
      </Suspense>
    </ModelBoundary>
  )
}

export function preloadModels(): void {
  for (const entry of MODEL_MANIFEST) useGLTF.preload(modelUrl(entry))
}
