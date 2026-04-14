import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import client from './client'

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  current_team_id: z.number().nullable(),
  current_team: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
})

export type User = z.infer<typeof UserSchema>

const AuthResponseSchema = z.object({
  data: UserSchema,
  token: z.string().optional(),
})

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/auth/me')
      return AuthResponseSchema.parse(data).data
    },
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await client.post('/api/v1/auth/login', credentials)
      const parsed = AuthResponseSchema.parse(data)
      if (parsed.token) {
        localStorage.setItem('auth_token', parsed.token)
      }
      return parsed.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
    }) => {
      const { data } = await client.post('/api/v1/auth/register', payload)
      const parsed = AuthResponseSchema.parse(data)
      if (parsed.token) {
        localStorage.setItem('auth_token', parsed.token)
      }
      return parsed.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await client.post('/api/v1/auth/logout')
      localStorage.removeItem('auth_token')
    },
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}
