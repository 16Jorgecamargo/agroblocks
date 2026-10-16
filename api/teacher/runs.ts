import { createEnvDeps } from '../../server/env.js'
import { handleWeb } from '../../server/web.js'

export function GET(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}

export function DELETE(request: Request): Promise<Response> {
  return handleWeb(request, createEnvDeps(process.env))
}
