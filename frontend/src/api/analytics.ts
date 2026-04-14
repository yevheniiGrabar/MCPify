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

const ChartPointSchema = z.object({
  date: z.string(),
  calls: z.number(),
  errors: z.number(),
  avg_duration: z.number().nullable(),
})

const ToolStatSchema = z.object({
  id: z.number(),
  name: z.string(),
  http_method: z.string().nullable(),
  total_calls: z.number(),
  error_calls: z.number(),
  avg_duration: z.number().nullable(),
})

const ErrorEntrySchema = z.object({
  id: z.number(),
  tool_name: z.string().nullable(),
  http_method: z.string().nullable(),
  endpoint_path: z.string().nullable(),
  response_status: z.number().nullable(),
  error_message: z.string().nullable(),
  duration_ms: z.number().nullable(),
  called_at: z.string().nullable(),
})

const ServiceAnalyticsSchema = z.object({
  data: z.object({
    total_calls: z.number(),
    error_calls: z.number(),
    error_rate: z.number(),
    avg_duration_ms: z.number().nullable(),
    p50_duration_ms: z.number().nullable(),
    p95_duration_ms: z.number().nullable(),
    p99_duration_ms: z.number().nullable(),
    chart: z.array(ChartPointSchema),
    tool_stats: z.array(ToolStatSchema),
    recent_errors: z.array(ErrorEntrySchema),
  }),
})

export type ServiceAnalytics = z.infer<typeof ServiceAnalyticsSchema>['data']
export type ChartPoint = z.infer<typeof ChartPointSchema>
export type ToolStat = z.infer<typeof ToolStatSchema>
export type ErrorEntry = z.infer<typeof ErrorEntrySchema>

export type TimeRange = '7d' | '30d' | '90d'

export function useServiceAnalytics(serviceId: number, range: TimeRange = '7d') {
  return useQuery({
    queryKey: ['analytics', 'service', serviceId, range],
    queryFn: async () => {
      const { data } = await client.get(
        `/api/v1/services/${serviceId}/analytics?range=${range}`
      )
      return ServiceAnalyticsSchema.parse(data).data
    },
    placeholderData: keepPreviousData,
  })
}

export function getExportUrl(serviceId: number, range: TimeRange): string {
  return `${client.defaults.baseURL}/api/v1/services/${serviceId}/analytics/export?range=${range}`
}

export async function downloadCsv(serviceId: number, range: TimeRange): Promise<void> {
  const response = await client.get(
    `/api/v1/services/${serviceId}/analytics/export?range=${range}`,
    { responseType: 'blob' }
  )
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `tool-calls-${range}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
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
