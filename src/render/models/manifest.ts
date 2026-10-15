import { z } from 'zod'
import generated from '@/render/models/manifest.generated.json'

export const REQUIRED_MODEL_IDS = [
  'tree-a',
  'tree-b',
  'tree-c',
  'pine',
  'rock-a',
  'rock-b',
  'bush',
] as const

export const OPTIONAL_MODEL_IDS = ['barn', 'silo', 'windmill', 'reservoir', 'seed-depot'] as const

export const WORLD_MODEL_IDS = [
  'small-barn',
  'open-barn',
  'silo-house',
  'tower-windmill',
  'water-tower',
  'chicken-coop',
  'cow',
  'horse',
  'pig',
  'sheep',
  'llama',
  'pug',
  'tree-d',
  'pine-round',
  'bush-large',
  'bridge',
  'log-stack',
  'sign',
  'lily',
  'mushrooms',
  'flower-red',
  'flower-yellow',
  'flower-purple',
  'flower-patch',
  'grass-short',
  'grass-tall',
  'clover',
  'fern',
  'pebble',
  'rock-medium',
  'apple-tree',
] as const

export const PROCEDURAL_MODEL_IDS = ['fence', 'fence-gate'] as const

export type ProceduralModelId = (typeof PROCEDURAL_MODEL_IDS)[number]

export type ModelId =
  | (typeof REQUIRED_MODEL_IDS)[number]
  | (typeof OPTIONAL_MODEL_IDS)[number]
  | (typeof WORLD_MODEL_IDS)[number]
  | ProceduralModelId

const PROCEDURAL_SET: ReadonlySet<string> = new Set(PROCEDURAL_MODEL_IDS)

export function isProceduralModel(id: ModelId): boolean {
  return PROCEDURAL_SET.has(id)
}

export const MODEL_BUDGET_BYTES = 10 * 1024 * 1024

const entrySchema = z.object({
  id: z.string(),
  file: z.string(),
  usage: z.string(),
  author: z.string(),
  license: z.literal('CC0-1.0'),
  page: z.string().url(),
  scale: z.number().positive(),
  yOffset: z.number(),
  rotationY: z.number(),
  stretchY: z.number().positive().optional(),
  bytes: z.number().int().positive(),
  clips: z.object({ idle: z.string(), move: z.string(), success: z.string(), error: z.string() }).partial().optional(),
  recolor: z.record(z.string(), z.string()).optional(),
})

export const manifestSchema = z.object({ models: z.array(entrySchema) })

export type ModelEntry = z.infer<typeof entrySchema>

export function parseManifest(raw: unknown): ModelEntry[] {
  const parsed = manifestSchema.safeParse(raw)
  return parsed.success ? parsed.data.models : []
}

export const MODEL_MANIFEST: ModelEntry[] = parseManifest(generated)

export function modelEntry(id: ModelId): ModelEntry | undefined {
  return MODEL_MANIFEST.find((entry) => entry.id === id)
}

export function modelUrl(entry: ModelEntry): string {
  return `${import.meta.env.BASE_URL}${entry.file}`
}
