import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import client from './client'

export const McpToolSchema = z.object({
  id: z.number(),
  service_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  http_method: z.string(),
  endpoint_path: z.string(),
  input_schema: z.record(z.string(), z.unknown()).nullable(),
  output_schema: z.record(z.string(), z.unknown()).nullable(),
  is_enabled: z.boolean(),
  is_destructive: z.boolean(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type McpTool = z.infer<typeof McpToolSchema>

const ToolsResponseSchema = z.object({
  data: z.array(McpToolSchema),
})

const ToolResponseSchema = z.object({
  data: McpToolSchema,
})

const ConnectResponseSchema = z.object({
  data: z.array(McpToolSchema),
  meta: z.object({
    tools_created: z.number(),
  }),
})

export function useTools(serviceId: number) {
  return useQuery({
    queryKey: ['tools', serviceId],
    queryFn: async () => {
      const { data } = await client.get(`/api/v1/services/${serviceId}/tools`)
      return ToolsResponseSchema.parse(data).data
    },
  })
}

export function useUpdateTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      toolId,
      payload,
    }: {
      toolId: number
      payload: Partial<Pick<McpTool, 'name' | 'description' | 'is_enabled' | 'is_destructive' | 'sort_order'>>
    }) => {
      const { data } = await client.patch(`/api/v1/tools/${toolId}`, payload)
      return ToolResponseSchema.parse(data).data
    },
    onSuccess: (tool) => {
      queryClient.invalidateQueries({ queryKey: ['tools', tool.service_id] })
    },
  })
}

export function useDeleteTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ toolId, serviceId }: { toolId: number; serviceId: number }) => {
      await client.delete(`/api/v1/tools/${toolId}`)
      return serviceId
    },
    onSuccess: (serviceId) => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
    },
  })
}

const AuthConfigSchema = z.object({
  data: z.object({
    auth_type: z.string(),
    has_credentials: z.boolean(),
    base_url: z.string().nullable().optional(),
  }),
})

export type AuthConfigInfo = z.infer<typeof AuthConfigSchema>['data']

export function useServiceAuth(serviceId: number) {
  return useQuery({
    queryKey: ['service-auth', serviceId],
    queryFn: async () => {
      const { data } = await client.get(`/api/v1/services/${serviceId}/auth`)
      return AuthConfigSchema.parse(data).data
    },
  })
}

export function useUpdateServiceAuth(serviceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      auth_type: string
      base_url?: string
      auth_config?: Record<string, unknown> | null
    }) => {
      const { data } = await client.put(`/api/v1/services/${serviceId}/auth`, payload)
      return AuthConfigSchema.parse(data).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-auth', serviceId] })
    },
  })
}

export function useConnectOpenApi(serviceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { url?: string; spec_json?: string }) => {
      const { data } = await client.post(
        `/api/v1/services/${serviceId}/connect/openapi`,
        payload
      )
      return ConnectResponseSchema.parse(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useConnectManual(serviceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      http_method: string
      endpoint_path: string
      description?: string
      input_schema?: Record<string, unknown>
      base_url?: string
      auth_type?: string
      auth_config?: Record<string, unknown>
    }) => {
      const { data } = await client.post(
        `/api/v1/services/${serviceId}/connect/manual`,
        payload
      )
      return ToolResponseSchema.parse(data).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
    },
  })
}
