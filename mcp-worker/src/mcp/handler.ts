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
export async function createMcpServer(serviceData: ServiceWithConfig): Promise<McpServer> {
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

    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description ?? `${tool.http_method} ${tool.endpoint_path}`,
        inputSchema: Object.keys(zodShape).length > 0 ? zodShape : undefined,
        annotations: {
          readOnlyHint: !tool.is_destructive,
          destructiveHint: tool.is_destructive,
        },
      },
      async (args: Record<string, unknown>) => {
        const start = Date.now()

        // Re-fetch tool to ensure it's still enabled
        const currentTool = await getToolByName(service.id, tool.name)
        if (!currentTool) {
          return {
            content: [{ type: 'text' as const, text: `Tool "${tool.name}" is not available` }],
            isError: true,
          }
        }

        try {
          const result = await executeTool(currentTool, args, {
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
            args,
            result.body,
            isError ? 'error' : 'success',
            durationMs
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
            args,
            message,
            'error',
            durationMs
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
