import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, type Group, type MeshStandardMaterial } from 'three'
import { Flat } from '@/render/farm3d/materials'
import { PALETTE } from '@/render/palette'
import { EYE_SHAPES, ROBOT_TOOLS, type EyeShape, type RobotPose, type RobotTool } from '@/render/robot/robotPoses'

const BODY_Y = 0.2
const HAND_TOOLS: RobotTool[] = ['hoe', 'seedBag', 'wateringCan', 'claw']
const EYE_COLOR = new Color(PALETTE.robotEye)
const ERROR_COLOR = new Color(PALETTE.error)

function EyeMark({ shape }: { shape: EyeShape }) {
  const color = shape === 'error' ? PALETTE.error : PALETTE.robotEye
  if (shape === 'happy') {
    return (
      <mesh>
        <torusGeometry args={[0.045, 0.014, 6, 12, Math.PI]} />
        <meshBasicMaterial color={color} />
      </mesh>
    )
  }
  if (shape === 'error') {
    return (
      <>
        {[Math.PI / 4, -Math.PI / 4].map((angle) => (
          <mesh key={angle} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.11, 0.022, 0.01]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </>
    )
  }
  if (shape === 'blink') {
    return (
      <mesh>
        <boxGeometry args={[0.1, 0.016, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
    )
  }
  return (
    <mesh scale={[1, shape === 'focus' ? 0.45 : 1, 1]}>
      <circleGeometry args={[0.055, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Tool({ tool }: { tool: RobotTool }) {
  if (tool === 'hoe') {
    return (
      <>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.34, 6]} />
          <Flat color={PALETTE.woodFrame} />
        </mesh>
        <mesh position={[0, -0.32, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.03, 0.1]} />
          <Flat color={PALETTE.metal} />
        </mesh>
      </>
    )
  }
  if (tool === 'seedBag') {
    return (
      <>
        <mesh position={[0, -0.09, 0]} scale={[1, 1.1, 0.9]} castShadow>
          <sphereGeometry args={[0.08, 8, 6]} />
          <Flat color={PALETTE.sack} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.025, 0.035, 0.03, 6]} />
          <Flat color={PALETTE.woodFrame} />
        </mesh>
      </>
    )
  }
  if (tool === 'wateringCan') {
    return (
      <>
        <mesh position={[0, -0.09, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 10]} />
          <Flat color={PALETTE.water} />
        </mesh>
        <mesh position={[0, -0.08, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.018, 0.14, 6]} />
          <Flat color={PALETTE.water} />
        </mesh>
      </>
    )
  }
  if (tool === 'claw') {
    return (
      <>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.1, 0.03, 0.06]} />
          <Flat color={PALETTE.metal} />
        </mesh>
        {[-0.035, 0.035].map((x) => (
          <mesh key={x} position={[x, -0.08, 0]}>
            <boxGeometry args={[0.025, 0.1, 0.025]} />
            <Flat color={PALETTE.metal} />
          </mesh>
        ))}
      </>
    )
  }
  if (tool === 'crate') {
    return (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.18, 0.24]} />
          <Flat color={PALETTE.crate} />
        </mesh>
        {[-0.11, -0.03, 0.05, 0.12].map((x, index) => (
          <mesh key={x} position={[x, 0.12, (index % 2) * 0.08 - 0.04]}>
            <icosahedronGeometry args={[0.06, 1]} />
            <Flat color={PALETTE.fruit} />
          </mesh>
        ))}
      </>
    )
  }
  return null
}

function Wheel() {
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
        <Flat color={PALETTE.wheel} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.13, 8]} />
        <Flat color={PALETTE.metal} />
      </mesh>
    </>
  )
}

interface RobotRigProps {
  pose: MutableRefObject<RobotPose>
  failed?: boolean
  tool?: RobotTool
}

export function RobotRig({ pose, failed = false, tool }: RobotRigProps) {
  const body = useRef<Group>(null)
  const head = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const leftWheel = useRef<Group>(null)
  const rightWheel = useRef<Group>(null)
  const antenna = useRef<MeshStandardMaterial>(null)
  const eyes = useRef<Partial<Record<EyeShape, Group | null>>>({})
  const tools = useRef<Partial<Record<RobotTool, Group | null>>>({})

  useFrame(() => {
    const current = pose.current
    if (body.current) {
      body.current.position.y = BODY_Y + current.bodyY
      body.current.rotation.x = current.bodyPitch
      body.current.rotation.z = current.bodyRoll
    }
    if (head.current) {
      head.current.rotation.y = current.headYaw
      head.current.rotation.x = current.headPitch
    }
    if (shoulder.current) shoulder.current.rotation.x = -current.shoulder
    if (elbow.current) elbow.current.rotation.x = -current.elbow
    if (hand.current) hand.current.rotation.x = -current.toolTilt
    if (leftWheel.current) leftWheel.current.rotation.x = current.wheelSpin + current.wheelTwist
    if (rightWheel.current) rightWheel.current.rotation.x = current.wheelSpin - current.wheelTwist
    const shownEyes = failed ? 'error' : current.eyes
    for (const shape of EYE_SHAPES) {
      const node = eyes.current[shape]
      if (node) node.visible = shape === shownEyes
    }
    const shownTool = tool ?? current.tool
    for (const item of ROBOT_TOOLS) {
      const node = tools.current[item]
      if (node) node.visible = item === shownTool
    }
    if (antenna.current) {
      antenna.current.emissive.copy(shownEyes === 'error' ? ERROR_COLOR : EYE_COLOR)
      antenna.current.emissiveIntensity = current.antennaGlow * 1.5
    }
  })

  return (
    <group>
      <group ref={leftWheel} position={[-0.34, 0.2, 0]}>
        <Wheel />
      </group>
      <group ref={rightWheel} position={[0.34, 0.2, 0]}>
        <Wheel />
      </group>
      <mesh position={[0, 0.07, -0.2]} castShadow>
        <sphereGeometry args={[0.07, 10, 8]} />
        <Flat color={PALETTE.wheel} />
      </mesh>
      <group ref={body} position={[0, BODY_Y, 0]}>
        <RoundedBox args={[0.56, 0.36, 0.46]} radius={0.08} smoothness={3} position={[0, 0.2, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.robotBody} roughness={0.5} emissive={failed ? PALETTE.error : '#000000'} emissiveIntensity={failed ? 0.25 : 0} />
        </RoundedBox>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.58, 0.06, 0.48]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.08, 8]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <group ref={head} position={[0, 0.46, 0]}>
          <RoundedBox args={[0.52, 0.38, 0.44]} radius={0.1} smoothness={3} position={[0, 0.19, 0]} castShadow>
            <meshStandardMaterial color={PALETTE.robotBody} roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[0.42, 0.24, 0.04]} radius={0.05} smoothness={2} position={[0, 0.2, 0.215]}>
            <meshStandardMaterial color={PALETTE.robotVisor} roughness={0.3} />
          </RoundedBox>
          {EYE_SHAPES.map((shape) => (
            <group
              key={shape}
              ref={(node) => {
                eyes.current[shape] = node
              }}
              position={[0, 0.2, 0.24]}
              visible={shape === 'normal'}
            >
              {[-0.1, 0.1].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                  <EyeMark shape={shape} />
                </group>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
            <Flat color={PALETTE.robotTrim} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial ref={antenna} color={PALETTE.robotEye} emissive={PALETTE.robotEye} emissiveIntensity={0.6} />
          </mesh>
        </group>
        <mesh position={[-0.32, 0.22, 0.02]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.22, 0.07]} />
          <Flat color={PALETTE.robotTrim} />
        </mesh>
        <group ref={shoulder} position={[0.32, 0.32, 0.02]}>
          <mesh>
            <sphereGeometry args={[0.05, 8, 6]} />
            <Flat color={PALETTE.robotTrim} />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.07, 0.2, 0.07]} />
            <Flat color={PALETTE.robotBody} />
          </mesh>
          <group ref={elbow} position={[0, -0.2, 0]}>
            <mesh position={[0, -0.09, 0]} castShadow>
              <boxGeometry args={[0.06, 0.18, 0.06]} />
              <Flat color={PALETTE.robotTrim} />
            </mesh>
            <group ref={hand} position={[0, -0.19, 0]}>
              {HAND_TOOLS.map((item) => (
                <group
                  key={item}
                  ref={(node) => {
                    tools.current[item] = node
                  }}
                  visible={false}
                >
                  <Tool tool={item} />
                </group>
              ))}
            </group>
          </group>
        </group>
        <group
          ref={(node) => {
            tools.current.crate = node
          }}
          position={[0, 0.3, 0.36]}
          visible={false}
        >
          <Tool tool="crate" />
        </group>
      </group>
    </group>
  )
}
