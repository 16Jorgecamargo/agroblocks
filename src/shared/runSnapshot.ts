import { z } from 'zod'
import { validateStudent } from './student.js'

export const WORLD_ID_VALUES = ['garden', 'cornfield', 'orchard', 'greenhouse', 'barnyard', 'homestead'] as const

export const MAX_ATTEMPTS = 2000
export const MAX_PSEUDOCODE = 4000
export const MAX_BODY_BYTES = 512 * 1024

const usage = z.object({ seeds: z.number(), water: z.number(), energy: z.number() })
const stars = z.union([z.literal(1), z.literal(2), z.literal(3)])

const student = z
  .object({ name: z.string(), school: z.string() })
  .refine((value) => {
    const errors = validateStudent(value)
    return errors.name === null && errors.school === null
  })

const attempt = z.object({
  id: z.string().max(64),
  missionId: z.string().max(64),
  attemptNumber: z.number().int().positive(),
  timestamp: z.string().max(40),
  outcome: z.enum(['success', 'objectiveFailed', 'error']),
  errorCode: z.string().max(40).nullable(),
  actions: z.number().int().nonnegative(),
  blocks: z.number().int().nonnegative(),
  usage,
  hintsUsed: z.number().int().min(0).max(4),
  efficiencyStars: stars.nullable(),
  pseudocode: z.string().max(MAX_PSEUDOCODE),
})

const mission = z.object({
  status: z.enum(['locked', 'available', 'completed']),
  attempts: z.number().int().nonnegative(),
  bestResult: z.object({ actions: z.number(), blocks: z.number(), usage, efficiencyStars: stars }).nullable(),
  hintsUsed: z.number().int().min(0).max(4),
  errorCounts: z.record(z.string(), z.number().int().nonnegative()),
})

const assessment = z.object({
  world: z.enum(WORLD_ID_VALUES),
  form: z.enum(['pre', 'post']),
  startedAt: z.string(),
  completedAt: z.string(),
  skipped: z.boolean(),
  answers: z.record(z.string(), z.number().int()),
})

export const runSnapshotSchema = z.object({
  runId: z.string().min(8).max(64),
  student,
  studentKey: z.string().max(220),
  createdAt: z.string().max(40),
  updatedAt: z.string().max(40),
  tutorial: z.object({ status: z.enum(['completed', 'skipped']), step: z.number().int().min(1).max(99), at: z.string().max(40) }).nullable(),
  missions: z.record(z.string(), mission),
  attempts: z.array(attempt).max(MAX_ATTEMPTS),
  assessments: z.object(Object.fromEntries(WORLD_ID_VALUES.map((world) => [world, z.object({ pre: assessment.nullable(), post: assessment.nullable() })])) as Record<(typeof WORLD_ID_VALUES)[number], z.ZodObject<{ pre: z.ZodNullable<typeof assessment>; post: z.ZodNullable<typeof assessment> }>>),
})

export type RunSnapshot = z.infer<typeof runSnapshotSchema>
