interface FlatProps {
  color: string
  emissive?: string
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
}

export function Flat({ color, emissive, emissiveIntensity, transparent, opacity }: FlatProps) {
  return (
    <meshStandardMaterial
      color={color}
      flatShading
      roughness={0.85}
      metalness={0.02}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity ?? 0}
      transparent={transparent}
      opacity={opacity ?? 1}
    />
  )
}
