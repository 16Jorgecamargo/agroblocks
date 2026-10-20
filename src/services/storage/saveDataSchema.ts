import { z } from 'zod'
import { ERROR_CODES } from '@/game/world/types'
import { WORLD_IDS } from '@/game/worlds/worldTypes'

const errorCode = z.enum(ERROR_CODES)
const usage = z.object({ seeds: z.number(), water: z.number(), energy: z.number() })
const stars = z.union([z.literal(1), z.literal(2), z.literal(3)])

const attemptRecord = z.object({
  id: z.string(),
  missionId: z.string(),
  attemptNumber: z.number().int().positive(),
  timestamp: z.string(),
  outcome: z.enum(['success', 'objectiveFailed', 'error']),
  errorCode: errorCode.nullable(),
  actions: z.number().int().nonnegative(),
  blocks: z.number().int().nonnegative(),
  usage,
  hintsUsed: z.number().int().min(0).max(4),
  efficiencyStars: stars.nullable(),
  pseudocode: z.string(),
})

const missionProgress = z.object({
  status: z.enum(['locked', 'available', 'completed']),
  attempts: z.number().int().nonnegative(),
  bestResult: z.object({ actions: z.number(), blocks: z.number(), usage, efficiencyStars: stars }).nullable(),
  hintsUsed: z.number().int().min(0).max(4),
  errorCounts: z.partialRecord(errorCode, z.number().int().nonnegative()),
  savedProgram: z.string().nullable(),
})

const assessmentResponse = z.object({
  world: z.enum(WORLD_IDS),
  form: z.enum(['pre', 'post']),
  startedAt: z.string(),
  completedAt: z.string(),
  skipped: z.boolean(),
  answers: z.record(z.string(), z.number().int()),
})

const student = z.object({ name: z.string(), school: z.string() })
const tutorial = z.object({ status: z.enum(['completed', 'skipped']), step: z.number().int(), at: z.string() })

const worldAssessments = z.object({ pre: assessmentResponse.nullable(), post: assessmentResponse.nullable() })

export const saveDataSchema = z.object({
  version: z.literal(2),
  runId: z.string().nullable().default(null),
  student: student.nullable().default(null),
  tutorial: tutorial.nullable().default(null),
  createdAt: z.string(),
  missions: z.record(z.string(), missionProgress),
  attempts: z.array(attemptRecord),
  assessments: z.partialRecord(z.enum(WORLD_IDS), worldAssessments),
})

export const legacySaveSchema = z.object({
  version: z.literal(1),
  runId: z.string().nullable().default(null),
  student: student.nullable().default(null),
  tutorial: tutorial.nullable().default(null),
  createdAt: z.string(),
  missions: z.record(z.string(), missionProgress.partial()),
})
