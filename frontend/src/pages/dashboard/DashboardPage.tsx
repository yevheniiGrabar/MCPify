import { useAnalyticsSummary } from '@/api/analytics'
import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BarChart3, Plug, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data: services = [] } = useServices()
  const { data: analytics } = useAnalyticsSummary()
  const activeServices = services.filter((s) => s.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to MCPify</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Services</CardTitle>
            <Plug className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-gray-500 mt-1">{services.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tool Calls</CardTitle>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.month_calls ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.total_calls ?? 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tools</CardTitle>
            <Wrench className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.enabled_tools ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.total_tools ?? 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Response</CardTitle>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avg_response_ms != null ? `${analytics.avg_response_ms}` : '\u2014'}
            </div>
            <p className="text-xs text-gray-500 mt-1">ms this month</p>
          </CardContent>
        </Card>
      </div>

      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.description}</p>
                  </div>
                  <Badge
                    variant={service.status === 'active' ? 'default' : 'secondary'}
                    className={
                      service.status === 'active' ? 'bg-green-100 text-green-700' : ''
                    }
                  >
                    {service.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
