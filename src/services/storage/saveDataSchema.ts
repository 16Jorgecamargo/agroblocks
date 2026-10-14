import { z } from 'zod'
import { ERROR_CODES } from '@/game/world/types'

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
  form: z.enum(['pre', 'post']),
  startedAt: z.string(),
  completedAt: z.string(),
  skipped: z.boolean(),
  answers: z.record(z.string(), z.number().int()),
})

export const saveDataSchema = z.object({
  version: z.literal(1),
  participantCode: z.string().nullable(),
  createdAt: z.string(),
  missions: z.record(z.string(), missionProgress),
  attempts: z.array(attemptRecord),
  assessments: z.object({ pre: assessmentResponse.nullable(), post: assessmentResponse.nullable() }),
})
