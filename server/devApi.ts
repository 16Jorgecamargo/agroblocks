import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleApi, type ApiDeps } from './handlers.js'
import { createMemoryStore } from './store.js'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function createApiMiddleware(deps: ApiDeps) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }
    void (async () => {
      const headers: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(req.headers)) headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value
      const response = await handleApi(
        { method: (req.method ?? 'GET').toUpperCase(), path: url.pathname, headers, query: Object.fromEntries(url.searchParams.entries()), body: await readBody(req) },
        deps,
      )
      res.statusCode = response.status
      if (response.body === undefined) {
        res.end()
        return
      }
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(response.body))
    })()
  }
}

export function devApi(deps?: ApiDeps): Plugin {
  const middleware = createApiMiddleware(
    deps ?? {
      store: createMemoryStore(),
      password: process.env.TEACHER_PASSWORD ?? 'dashboard',
      secret: process.env.TEACHER_TOKEN_SECRET ?? 'agroblocks-dev-secret',
      now: () => Date.now(),
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    },
  )
  return {
    name: 'agroblocks-dev-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
