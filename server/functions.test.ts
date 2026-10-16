import { POST as saveRun } from '../api/runs.js'
import { POST as login } from '../api/teacher/login.js'
import { DELETE as removeRun, GET as listRuns } from '../api/teacher/runs.js'

describe('Vercel functions', () => {
  it('load and answer 503 when env is missing', async () => {
    const env = { ...process.env }
    for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'TEACHER_PASSWORD', 'TEACHER_TOKEN_SECRET']) delete process.env[key]
    try {
      expect((await saveRun(new Request('https://x/api/runs', { method: 'POST', body: '{}' }))).status).toBe(503)
      expect((await login(new Request('https://x/api/teacher/login', { method: 'POST', body: '{"password":"x"}' }))).status).toBe(503)
      expect((await listRuns(new Request('https://x/api/teacher/runs'))).status).toBe(503)
      expect((await removeRun(new Request('https://x/api/teacher/runs?id=a', { method: 'DELETE' }))).status).toBe(503)
    } finally {
      process.env = env
    }
  })
})
