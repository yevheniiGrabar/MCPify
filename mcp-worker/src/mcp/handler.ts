import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  getEnabledTools,
  getToolByName,
  logToolCall,
  type ServiceWithConfig,
} from '../db/queries.js'
import { executeTool } from './executor.js'

/**
 * Creates a configured MCP Server for a specific service.
 * Each connection gets its own server instance with tools loaded from DB.
 */
export interface CallerInfo {
  ip?: string
  userAgent?: string
}

export async function createMcpServer(serviceData: ServiceWithConfig, caller?: CallerInfo): Promise<McpServer> {
  const { service, apiConfig } = serviceData

  const server = new McpServer(
    {
      name: `mcpify-${service.name}`,
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // Load tools from database and register them
  const tools = await getEnabledTools(service.id)

  for (const tool of tools) {
    // Build Zod schema from input_schema JSON
    const inputSchema = tool.input_schema as {
      properties?: Record<string, { type?: string; description?: string }>
      required?: string[]
    } | null

    const zodShape: Record<string, z.ZodTypeAny> = {}

    if (inputSchema?.properties) {
      for (const [paramName, paramDef] of Object.entries(inputSchema.properties)) {
        let zodType: z.ZodTypeAny

        switch (paramDef.type) {
          case 'integer':
          case 'number':
            zodType = z.number().describe(paramDef.description ?? paramName)
            break
          case 'boolean':
            zodType = z.boolean().describe(paramDef.description ?? paramName)
            break
          case 'array':
            zodType = z.array(z.unknown()).describe(paramDef.description ?? paramName)
            break
          case 'object':
            zodType = z.record(z.string(), z.unknown()).describe(paramDef.description ?? paramName)
            break
          default:
            zodType = z.string().describe(paramDef.description ?? paramName)
        }

        const isRequired = inputSchema.required?.includes(paramName) ?? false
        zodShape[paramName] = isRequired ? zodType : zodType.optional()
      }
    }

    // For destructive tools, add confirmation parameter and warning to description
    if (tool.is_destructive) {
      zodShape['confirm_destructive'] = z.boolean()
        .describe('Must be set to true to confirm this destructive operation')
    }

    const description = tool.is_destructive
      ? `[DESTRUCTIVE] ${tool.description ?? `${tool.http_method} ${tool.endpoint_path}`}. Requires confirm_destructive=true.`
      : (tool.description ?? `${tool.http_method} ${tool.endpoint_path}`)

    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description,
        inputSchema: Object.keys(zodShape).length > 0 ? zodShape : undefined,
        annotations: {
          readOnlyHint: !tool.is_destructive,
          destructiveHint: tool.is_destructive,
        },
      },
      async (args: Record<string, unknown>) => {
        const start = Date.now()

        // Destructive tool confirmation check
        if (tool.is_destructive && args.confirm_destructive !== true) {
          return {
            content: [{
              type: 'text' as const,
              text: `This is a destructive operation (${tool.http_method} ${tool.endpoint_path}). Set confirm_destructive=true to proceed.`,
            }],
            isError: true,
          }
        }

        // Remove the confirmation flag before forwarding to the API
        const forwardArgs = { ...args }
        delete forwardArgs.confirm_destructive

        // Re-fetch tool to ensure it's still enabled
        const currentTool = await getToolByName(service.id, tool.name)
        if (!currentTool) {
          return {
            content: [{ type: 'text' as const, text: `Tool "${tool.name}" is not available` }],
            isError: true,
          }
        }

        try {
          const result = await executeTool(currentTool, forwardArgs, {
            base_url: apiConfig?.base_url ?? null,
            auth_type: apiConfig?.auth_type ?? null,
            auth_config: apiConfig?.auth_config ?? null,
          })

          const durationMs = Date.now() - start
          const isError = result.status >= 400 || result.status === 0

          // Log the call
          await logToolCall(
            currentTool.id,
            service.id,
            forwardArgs,
            result.body,
            isError ? 'error' : 'success',
            durationMs,
            caller?.ip,
            caller?.userAgent
          ).catch(() => {
            // Don't fail the tool call if logging fails
          })

          return {
            content: [{ type: 'text' as const, text: result.body }],
            isError,
          }
        } catch (error: unknown) {
          const durationMs = Date.now() - start
          const message = error instanceof Error ? error.message : 'Unknown execution error'

          await logToolCall(
            currentTool.id,
            service.id,
            forwardArgs,
            message,
            'error',
            durationMs,
            caller?.ip,
            caller?.userAgent
          ).catch(() => {})

          return {
            content: [{ type: 'text' as const, text: `Error: ${message}` }],
            isError: true,
          }
        }
      }
    )
  }

  return server
}
