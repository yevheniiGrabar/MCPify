import { useService } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Copy } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: service, isLoading } = useService(Number(id))

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!service) return null

  const mcpUrl = `${import.meta.env.VITE_API_URL}/mcp/${service.mcp_url_token}`

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <Badge
              variant="secondary"
              className={
                service.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : service.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
              }
            >
              {service.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{service.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MCP Endpoint</CardTitle>
          <CardDescription>Use this URL to connect your service to AI clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm">
            <span className="flex-1 text-gray-700 truncate">{mcpUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(mcpUrl)
                toast.success('Copied to clipboard')
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
