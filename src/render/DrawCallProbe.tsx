import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const EVERY = 30

export function DrawCallProbe() {
  const gl = useThree((three) => three.gl)
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current % EVERY === 0) gl.domElement.dataset.drawCalls = String(gl.info.render.calls)
  })
  return null
}
