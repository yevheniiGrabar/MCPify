import { useQuery } from '@tanstack/react-query'
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
