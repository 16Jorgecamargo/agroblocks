import type { FarmSceneProps } from '@/render/FarmView'

export default function FarmScene(props: FarmSceneProps) {
  return <div aria-hidden="true" data-robot-x={props.state.robot.x} />
}
