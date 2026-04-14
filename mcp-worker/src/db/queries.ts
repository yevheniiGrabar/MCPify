import { query } from './client.js'

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
  is_enabled: boolean
  is_destructive: boolean
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
     WHERE mcp_url_token = $1 AND status = 'active' AND deleted_at IS NULL
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
     WHERE service_id = $1
     LIMIT 1`,
    [service.id]
  )

  return {
    service,
    apiConfig: configResult.rows[0] ?? null,
  }
}

export async function getEnabledTools(serviceId: number): Promise<ToolRow[]> {
  const result = await query<ToolRow>(
    `SELECT id, service_id, name, description, http_method, endpoint_path,
            input_schema, output_schema, is_enabled, is_destructive, sort_order
     FROM mcp_tools
     WHERE service_id = $1 AND is_enabled = true
     ORDER BY sort_order ASC`,
    [serviceId]
  )

  return result.rows
}

export async function getToolByName(serviceId: number, name: string): Promise<ToolRow | null> {
  const result = await query<ToolRow>(
    `SELECT id, service_id, name, description, http_method, endpoint_path,
            input_schema, output_schema, is_enabled, is_destructive, sort_order
     FROM mcp_tools
     WHERE service_id = $1 AND name = $2 AND is_enabled = true
     LIMIT 1`,
    [serviceId, name]
  )

  return result.rows[0] ?? null
}

export async function logToolCall(
  toolId: number,
  serviceId: number,
  input: Record<string, unknown>,
  output: string | null,
  status: 'success' | 'error',
  durationMs: number
): Promise<void> {
  await query(
    `INSERT INTO tool_calls (tool_id, service_id, input, output, status, duration_ms, called_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())`,
    [toolId, serviceId, JSON.stringify(input), output, status, durationMs]
  )
}
