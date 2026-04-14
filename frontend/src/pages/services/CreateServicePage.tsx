import { useCreateService } from '@/api/services'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    createService.mutate(data, {
      onSuccess: (service) => {
        toast.success('Service created successfully')
        void navigate(`/services/${service.id}`)
      },
      onError: () => toast.error('Failed to create service'),
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Service</h1>
          <p className="text-gray-500 mt-1">Set up a new MCP service</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Basic information about your MCP service</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input id="name" placeholder="My API Service" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of what this service does"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={createService.isPending}
              >
                {createService.isPending ? 'Creating...' : 'Create Service'}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/services">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
