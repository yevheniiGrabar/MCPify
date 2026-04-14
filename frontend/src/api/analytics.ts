import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { z } from 'zod'
import client from './client'

const AnalyticsSummarySchema = z.object({
  data: z.object({
    total_calls: z.number(),
    month_calls: z.number(),
    avg_response_ms: z.number().nullable(),
    total_tools: z.number(),
    enabled_tools: z.number(),
    error_rate: z.number(),
  }),
})

export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>['data']

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/analytics/summary')
      return AnalyticsSummarySchema.parse(data).data
    },
  })
}

const AuditLogEntrySchema = z.object({
  id: z.number(),
  tool_name: z.string().nullable(),
  http_method: z.string().nullable(),
  endpoint_path: z.string().nullable(),
  response_status: z.number().nullable(),
  duration_ms: z.number().nullable(),
  caller_ip: z.string().nullable(),
  caller_user_agent: z.string().nullable(),
  error_message: z.string().nullable(),
  called_at: z.string().nullable(),
})

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>

const AuditLogResponseSchema = z.object({
  data: z.array(AuditLogEntrySchema),
  meta: z.object({
    total: z.number(),
    per_page: z.number(),
    current_page: z.number(),
  }),
})

export function useAuditLog(serviceId: number, page: number = 1) {
  return useQuery({
    queryKey: ['audit-log', serviceId, page],
    queryFn: async () => {
      const { data } = await client.get(
        `/api/v1/services/${serviceId}/audit-log?page=${page}`
      )
      return AuditLogResponseSchema.parse(data)
    },
    placeholderData: keepPreviousData,
  })
}
