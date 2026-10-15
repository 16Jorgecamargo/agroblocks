import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Matrix4, type BufferGeometry, type InstancedMesh, type Material, type Mesh, type Object3D } from 'three'
import { modelEntry, modelUrl, type ModelEntry, type ModelId } from '@/render/models/manifest'
import { ModelBoundary } from '@/render/models/Model'
import { propMatrix } from '@/render/world/instancing'
import type { PropItem } from '@/render/world/worldTypes'

interface MeshPart {
  geometry: BufferGeometry
  material: Material | Material[]
  matrix: Matrix4
}

function meshParts(scene: Object3D): MeshPart[] {
  scene.updateMatrixWorld(true)
  const toRoot = new Matrix4().copy(scene.matrixWorld).invert()
  const parts: MeshPart[] = []
  scene.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    parts.push({ geometry: mesh.geometry, material: mesh.material, matrix: new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld) })
  })
  return parts
}

function InstancedPart({ part, matrices, shadows }: { part: MeshPart; matrices: Matrix4[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const combined = new Matrix4()
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, combined.multiplyMatrices(matrix, part.matrix)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices, part])
  const cutout = (Array.isArray(part.material) ? part.material : [part.material]).some((material) => material.alphaTest > 0)
  return <instancedMesh key={matrices.length} ref={ref} args={[part.geometry, part.material, matrices.length]} castShadow={shadows && !cutout} receiveShadow={!cutout} />
}

function InstancedParts({ entry, props, shadows }: { entry: ModelEntry; props: PropItem[]; shadows: boolean }) {
  const { scene } = useGLTF(modelUrl(entry))
  const parts = useMemo(() => meshParts(scene), [scene])
  const matrices = useMemo(() => props.map((prop) => propMatrix(prop, entry)), [props, entry])
  return (
    <>
      {parts.map((part, index) => (
        <InstancedPart key={index} part={part} matrices={matrices} shadows={shadows} />
      ))}
    </>
  )
}

export function InstancedModel({ id, props, shadows }: { id: ModelId; props: PropItem[]; shadows: boolean }) {
  const entry = modelEntry(id)
  if (!entry || props.length === 0) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <InstancedParts entry={entry} props={props} shadows={shadows} />
      </Suspense>
    </ModelBoundary>
  )
}
