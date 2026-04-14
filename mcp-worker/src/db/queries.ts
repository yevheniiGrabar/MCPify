import { query } from './client.js'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
const WORKER_SECRET = process.env.WORKER_SECRET ?? 'secret_key_here'

interface ServiceRow {
  id: number
  uuid: string
  name: string
  status: string
  mcp_url_token: string
}

interface ApiConfigRow {
  id: number
  service_id: number
  type: string
  base_url: string | null
  auth_type: string | null
  auth_config: string | null
}

interface ToolRow {
  id: number
  service_id: number
  name: string
  description: string | null
  http_method: string
  endpoint_path: string
  input_schema: Record<string, unknown> | null
  output_schema: Record<string, unknown> | null
  is_enabled: boolean | number
  is_destructive: boolean | number
  sort_order: number
}

export interface ServiceWithConfig {
  service: ServiceRow
  apiConfig: ApiConfigRow | null
}

export type { ToolRow, ApiConfigRow }

export async function getServiceByToken(token: string): Promise<ServiceWithConfig | null> {
  const serviceResult = await query<ServiceRow>(
    `SELECT id, uuid, name, status, mcp_url_token
     FROM services
     WHERE mcp_url_token = ? AND status = 'active' AND deleted_at IS NULL
     LIMIT 1`,
    [token]
  )

  if (serviceResult.rows.length === 0) {
    return null
  }

  const service = serviceResult.rows[0]

  const configResult = await query<ApiConfigRow>(
    `SELECT id, service_id, type, base_url, auth_type, auth_config
     FROM api_configs
     WHERE service_id = ?
     LIMIT 1`,
    [service.id]
  )

  const apiConfig = configResult.rows[0] ?? null

  // Fetch decrypted auth_config from Laravel backend
  if (apiConfig?.auth_config) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/internal/service-config/${token}`,
        { headers: { 'X-Worker-Secret': WORKER_SECRET } }
      )
      if (response.ok) {
        const json = await response.json() as { data: { auth_type: string | null; auth_config: Record<string, unknown> | null } }
        apiConfig.auth_type = json.data.auth_type
        apiConfig.auth_config = json.data.auth_config ? JSON.stringify(json.data.auth_config) : null
      }
    } catch {
      // Fall back to raw DB value (may be encrypted and unusable)
    }
  }

  return {
    service,
    apiConfig,
  }
}

export async function getEnabledTools(serviceId: number): Promise<ToolRow[]> {
  const result = await query<ToolRow>(
    `SELECT id, service_id, name, description, http_method, endpoint_path,
            input_schema, output_schema, is_enabled, is_destructive, sort_order
     FROM mcp_tools
     WHERE service_id = ? AND is_enabled = 1
     ORDER BY sort_order ASC`,
    [serviceId]
  )

  // MySQL returns tinyint(1) as 0/1, normalize to boolean
  return result.rows.map((row) => ({
    ...row,
    input_schema: typeof row.input_schema === 'string' ? JSON.parse(row.input_schema) : row.input_schema,
    output_schema: typeof row.output_schema === 'string' ? JSON.parse(row.output_schema) : row.output_schema,
    is_enabled: Boolean(row.is_enabled),
    is_destructive: Boolean(row.is_destructive),
  }))
}

export async function getToolByName(serviceId: number, name: string): Promise<ToolRow | null> {
  const result = await query<ToolRow>(
    `SELECT id, service_id, name, description, http_method, endpoint_path,
            input_schema, output_schema, is_enabled, is_destructive, sort_order
     FROM mcp_tools
     WHERE service_id = ? AND name = ? AND is_enabled = 1
     LIMIT 1`,
    [serviceId, name]
  )

  const row = result.rows[0]
  if (!row) return null

  return {
    ...row,
    input_schema: typeof row.input_schema === 'string' ? JSON.parse(row.input_schema) : row.input_schema,
    output_schema: typeof row.output_schema === 'string' ? JSON.parse(row.output_schema) : row.output_schema,
    is_enabled: Boolean(row.is_enabled),
    is_destructive: Boolean(row.is_destructive),
  }
}

export async function logToolCall(
  toolId: number,
  serviceId: number,
  input: Record<string, unknown>,
  output: string | null,
  status: 'success' | 'error',
  durationMs: number,
  callerIp?: string,
  callerUserAgent?: string
): Promise<void> {
  const responseStatus = status === 'success' ? 200 : 500
  await query(
    `INSERT INTO tool_calls (tool_id, service_id, input_params, response_status, error_message, duration_ms, caller_ip, caller_user_agent, called_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [
      toolId,
      serviceId,
      JSON.stringify(input),
      responseStatus,
      status === 'error' ? output : null,
      durationMs,
      callerIp ?? null,
      callerUserAgent ?? null,
    ]
  )
}
