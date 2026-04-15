import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import client from './client'

/* ─── Schemas ─── */

export const planSchema = z.object({
  id: z.string(),
  name: z.enum(['free', 'starter', 'growth', 'business']),
  display_name: z.string(),
  price: z.number(),
  limits: z.object({
    services: z.number().nullable(),
    calls_per_month: z.number().nullable(),
  }),
  features: z.array(z.string()),
  freemius_plan_id: z.string().nullable(),
})

export const subscriptionSchema = z.object({
  id: z.string(),
  plan: planSchema,
  status: z.enum(['active', 'past_due', 'cancelled', 'paused', 'trialing', 'expired']),
  current_period_start: z.string(),
  current_period_end: z.string(),
  cancel_at_period_end: z.boolean(),
  trial_ends_at: z.string().nullable(),
  freemius_subscription_id: z.string().nullable(),
})

export const usageSchema = z.object({
  services_used: z.number(),
  services_limit: z.number().nullable(),
  calls_used: z.number(),
  calls_limit: z.number().nullable(),
  period_start: z.string(),
  period_end: z.string(),
})

export const checkoutConfigSchema = z.object({
  product_id: z.string(),
  public_key: z.string(),
  sandbox: z
    .object({
      token: z.string(),
      ctx: z.string(),
    })
    .nullable(),
  plans: z.array(
    z.object({
      name: z.string(),
      freemius_plan_id: z.string(),
    })
  ),
})

export const invoiceSchema = z.object({
  id: z.union([z.string(), z.number()]).nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  created_at: z.string().nullable(),
  invoice_url: z.string().nullable(),
})

export type Plan = z.infer<typeof planSchema>
export type Subscription = z.infer<typeof subscriptionSchema>
export type Usage = z.infer<typeof usageSchema>
export type CheckoutConfig = z.infer<typeof checkoutConfigSchema>
export type Invoice = z.infer<typeof invoiceSchema>

/* ─── Queries ─── */

export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/billing/plans')
      return z.array(planSchema).parse(data.data)
    },
  })
}

export function useCheckoutConfig() {
  return useQuery({
    queryKey: ['billing', 'checkout-config'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/billing/checkout-config')
      return checkoutConfigSchema.parse(data.data)
    },
  })
}

export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/billing/subscription')
      return subscriptionSchema.parse(data.data)
    },
  })
}

export function useUsage() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/billing/usage')
      return usageSchema.parse(data.data)
    },
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/billing/invoices')
      return z.array(invoiceSchema).parse(data.data)
    },
  })
}

/* ─── Mutations ─── */

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/api/v1/billing/cancel')
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}

export function useResumeSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/api/v1/billing/resume')
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}
