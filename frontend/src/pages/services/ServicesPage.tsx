import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Plug } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  const { data: services = [], isLoading } = useServices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage your MCP services</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link to="/services/new">
            <Plus className="w-4 h-4 mr-2" />
            New Service
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Plug className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No services yet</h3>
            <p className="text-gray-500 mt-1 mb-6 max-w-sm">
              Create your first MCP service to make your API accessible to AI clients.
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/services/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{service.name}</CardTitle>
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
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {service.description ?? 'No description'}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/services/${service.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
