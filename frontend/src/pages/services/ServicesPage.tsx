import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Plug } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  const { data: services = [], isLoading } = useServices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Services</h1>
          <p className="text-zinc-400 mt-1">Manage your MCP services</p>
        </div>
        <Button
          asChild
          className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
        >
          <Link to="/services/new">
            <Plus className="w-4 h-4 mr-2" />
            New Service
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-surface-card">
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Plug className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No services yet</h3>
            <p className="text-zinc-400 mt-1 mb-6 max-w-sm text-sm">
              Create your first MCP service to make your API accessible to AI clients.
            </p>
            <Button
              asChild
              className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
            >
              <Link to="/services/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-zinc-800 bg-surface-card p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                <Badge
                  variant="secondary"
                  className={
                    service.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : service.status === 'paused'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }
                >
                  {service.status}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                {service.description ?? 'No description'}
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Link to={`/services/${service.id}`}>View Details</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
