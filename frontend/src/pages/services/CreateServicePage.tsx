import { useCreateService } from '@/api/services'
import { useUsage } from '@/api/billing'
import { UpgradePlanDialog } from '@/components/billing/UpgradePlanDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  description: z.string().max(1000).optional(),
})

type FormData = z.infer<typeof schema>

export function CreateServicePage() {
  const navigate = useNavigate()
  const createService = useCreateService()
  const { data: usage } = useUsage()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    createService.mutate(data, {
      onSuccess: (service) => {
        toast.success('Service created — now connect your API')
        void navigate(`/services/${service.id}/connect`)
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 403) {
          setShowUpgrade(true)
        } else {
          toast.error('Failed to create service')
        }
      },
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Service</h1>
          <p className="text-zinc-400 mt-1">Set up a new MCP service</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-surface-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Service Details</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Basic information about your MCP service</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300 text-sm">Service Name</Label>
              <Input
                id="name"
                placeholder="My API Service"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300 text-sm">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of what this service does"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
                disabled={createService.isPending}
              >
                {createService.isPending ? 'Creating...' : 'Create Service'}
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Link to="/services">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <UpgradePlanDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        resource="services"
        current={usage?.services_used ?? 0}
        limit={usage?.services_limit ?? 1}
      />
    </div>
  )
}
