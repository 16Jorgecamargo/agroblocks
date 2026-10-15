export type CubicBezier = [number, number, number, number]

export const EASINGS = {
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInBack: [0.36, 0, 0.66, -0.56],
  easeOutSine: [0.61, 1, 0.88, 1],
  easeInQuad: [0.11, 0, 0.5, 0],
} satisfies Record<string, CubicBezier>
