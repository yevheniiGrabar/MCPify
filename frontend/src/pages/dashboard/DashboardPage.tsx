import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BarChart3, Plug, Users } from 'lucide-react'

export function DashboardPage() {
  const { data: services = [] } = useServices()
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Connected Users</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Unique users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Response</CardTitle>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-gray-500 mt-1">ms</p>
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
                <div
                  key={service.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
