import { createEnvDeps } from '../server/env.js'
import { handleWeb } from '../server/web.js'

export function POST(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}
