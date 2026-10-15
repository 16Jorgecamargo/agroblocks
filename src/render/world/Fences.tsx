import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, ConeGeometry, Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type InstancedMesh } from 'three'
import { FENCE, fencePieces, type FencePiece } from '@/render/world/fencePieces'
import { PALETTE } from '@/render/palette'
import type { PropItem } from '@/render/world/worldTypes'

const BOX = new BoxGeometry(1, 1, 1)
const CAP = new ConeGeometry(0.75, 0.6, 4)
const WOOD = new MeshStandardMaterial({ color: PALETTE.fenceWood, flatShading: true, roughness: 0.85, metalness: 0.02 })
const POST_WOOD = new MeshStandardMaterial({ color: PALETTE.fenceWoodDark, flatShading: true, roughness: 0.85, metalness: 0.02 })

function postHeight(piece: FencePiece): number {
  return (piece.kind === 'gatePost' ? FENCE.gatePostHeight : FENCE.postHeight) * piece.size
}

function postMatrix(piece: FencePiece): Matrix4 {
  const height = postHeight(piece)
  const width = FENCE.postSize * piece.size
  return new Matrix4().compose(
    new Vector3(piece.x, height / 2, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation, 0)),
    new Vector3(width, height, width),
  )
}

function capMatrix(piece: FencePiece): Matrix4 {
  const width = FENCE.postSize * piece.size
  return new Matrix4().compose(
    new Vector3(piece.x, postHeight(piece) + width * 0.3, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation + Math.PI / 4, 0)),
    new Vector3(width, width, width),
  )
}

function spanMatrix(piece: FencePiece): Matrix4 {
  return new Matrix4().compose(
    new Vector3(piece.x, piece.y, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation, piece.tilt, 'YZX')),
    new Vector3(piece.length, FENCE.railThickness * piece.size, FENCE.railDepth * piece.size),
  )
}

interface PieceMeshProps {
  pieces: FencePiece[]
  geometry: BoxGeometry | ConeGeometry
  material: MeshStandardMaterial
  matrix: (piece: FencePiece) => Matrix4
  shadows: boolean
}

function PieceMesh({ pieces, geometry, material, matrix, shadows }: PieceMeshProps) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    pieces.forEach((piece, index) => mesh.setMatrixAt(index, matrix(piece)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [pieces, matrix])
  if (pieces.length === 0) return null
  return <instancedMesh key={pieces.length} ref={ref} args={[geometry, material, pieces.length]} castShadow={shadows} receiveShadow />
}

export function Fences({ props, shadows }: { props: PropItem[]; shadows: boolean }) {
  const pieces = useMemo(() => fencePieces(props), [props])
  const posts = useMemo(() => pieces.filter((piece) => piece.kind === 'post' || piece.kind === 'gatePost'), [pieces])
  const spans = useMemo(() => pieces.filter((piece) => piece.kind === 'rail' || piece.kind === 'brace'), [pieces])
  return (
    <group>
      <PieceMesh pieces={posts} geometry={BOX} material={POST_WOOD} matrix={postMatrix} shadows={shadows} />
      <PieceMesh pieces={posts} geometry={CAP} material={POST_WOOD} matrix={capMatrix} shadows={false} />
      <PieceMesh pieces={spans} geometry={BOX} material={WOOD} matrix={spanMatrix} shadows={shadows} />
    </group>
  )
}
