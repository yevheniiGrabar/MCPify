import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import client from './client'

export const ServiceSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['draft', 'active', 'paused']),
  mcp_url_token: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Service = z.infer<typeof ServiceSchema>

const ServicesResponseSchema = z.object({
  data: z.array(ServiceSchema),
  meta: z
    .object({
      total: z.number(),
      per_page: z.number(),
    })
    .optional(),
})

const ServiceResponseSchema = z.object({
  data: ServiceSchema,
})

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/services')
      return ServicesResponseSchema.parse(data).data
    },
  })
}

export function useService(id: number) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await client.get(`/api/v1/services/${id}`)
      return ServiceResponseSchema.parse(data).data
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await client.post('/api/v1/services', payload)
      return ServiceResponseSchema.parse(data).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Pick<Service, 'name' | 'description' | 'status'>>
    ) => {
      const { data } = await client.patch(`/api/v1/services/${id}`, payload)
      return ServiceResponseSchema.parse(data).data
    },
    onSuccess: (service) => {
      queryClient.setQueryData(['services', id], service)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useRegenerateToken(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.post(`/api/v1/services/${id}/regenerate-token`)
      return ServiceResponseSchema.parse(data).data
    },
    onSuccess: (service) => {
      queryClient.setQueryData(['services', id], service)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await client.delete(`/api/v1/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
