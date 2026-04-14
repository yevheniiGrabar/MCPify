import type { ApiConfigRow, ToolRow } from '../db/queries.js'

interface ExecutionResult {
  status: number
  body: string
  durationMs: number
}

interface AuthConfig {
  token?: string
  api_key?: string
  api_key_header?: string
  api_key_query?: string
  username?: string
  password?: string
}

export async function executeTool(
  tool: ToolRow,
  args: Record<string, unknown>,
  apiConfig: { base_url: string | null; auth_type: string | null; auth_config: string | null }
): Promise<ExecutionResult> {
  const start = Date.now()

  const baseUrl = apiConfig.base_url ?? ''
  let path = tool.endpoint_path

  // Separate arguments by their schema location
  const inputSchema = tool.input_schema as {
    properties?: Record<string, { in?: string }>
  } | null

  const queryParams: Record<string, string> = {}
  const bodyParams: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(args)) {
    const paramDef = inputSchema?.properties?.[key]
    const location = paramDef?.in ?? 'body'

    if (location === 'path') {
      path = path.replace(`{${key}}`, encodeURIComponent(String(value)))
    } else if (location === 'query') {
      queryParams[key] = String(value)
    } else {
      bodyParams[key] = value
    }
  }

  // Build URL
  const url = new URL(path, baseUrl)
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value)
  }

  // Build headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  // Apply auth
  if (apiConfig.auth_type && apiConfig.auth_config) {
    let authConfig: AuthConfig
    try {
      authConfig = JSON.parse(apiConfig.auth_config) as AuthConfig
    } catch {
      authConfig = {}
    }
    applyAuth(headers, url, apiConfig.auth_type, authConfig)
  }

  // Set content type for body methods
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(tool.http_method)
  if (hasBody && Object.keys(bodyParams).length > 0) {
    headers['Content-Type'] = 'application/json'
  }

  // Execute request
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url.toString(), {
      method: tool.http_method,
      headers,
      body: hasBody && Object.keys(bodyParams).length > 0
        ? JSON.stringify(bodyParams)
        : undefined,
      signal: controller.signal,
    })

    const body = await response.text()
    const durationMs = Date.now() - start

    return { status: response.status, body, durationMs }
  } catch (error: unknown) {
    const durationMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { status: 0, body: `Request failed: ${message}`, durationMs }
  } finally {
    clearTimeout(timeout)
  }
}

function applyAuth(
  headers: Record<string, string>,
  url: URL,
  authType: string,
  config: AuthConfig
): void {
  switch (authType) {
    case 'bearer':
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`
      }
      break
    case 'api_key':
      if (config.api_key) {
        if (config.api_key_header) {
          headers[config.api_key_header] = config.api_key
        } else if (config.api_key_query) {
          url.searchParams.set(config.api_key_query, config.api_key)
        } else {
          headers['X-API-Key'] = config.api_key
        }
      }
      break
    case 'basic':
      if (config.username && config.password) {
        const encoded = Buffer.from(`${config.username}:${config.password}`).toString('base64')
        headers['Authorization'] = `Basic ${encoded}`
      }
      break
  }
}
