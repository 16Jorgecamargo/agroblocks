import { handleApi, type ApiDeps, type ApiRequest, type ApiResponse } from './handlers.js'

export async function toApiRequest(request: Request): Promise<ApiRequest> {
  const url = new URL(request.url)
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })
  return {
    method: request.method.toUpperCase(),
    path: url.pathname,
    headers,
    query: Object.fromEntries(url.searchParams.entries()),
    body: request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text(),
  }
}

export function toWebResponse(response: ApiResponse): Response {
  if (response.body === undefined) return new Response(null, { status: response.status })
  return new Response(JSON.stringify(response.body), { status: response.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

export async function handleWeb(request: Request, deps: ApiDeps): Promise<Response> {
  return toWebResponse(await handleApi(await toApiRequest(request), deps))
}
