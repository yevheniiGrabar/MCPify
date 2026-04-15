import { useAnalyticsSummary } from '@/api/analytics'
import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Activity, BarChart3, Plug, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data: services = [] } = useServices()
  const { data: analytics } = useAnalyticsSummary()
  const activeServices = services.filter((s) => s.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome to MCPify</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Services"
          value={String(activeServices)}
          subtitle={`${services.length} total`}
          icon={<Plug className="w-4 h-4 text-brand-400" />}
        />
        <StatCard
          title="Tool Calls"
          value={String(analytics?.month_calls ?? 0)}
          subtitle={`${analytics?.total_calls ?? 0} total`}
          icon={<Activity className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          title="Tools"
          value={String(analytics?.enabled_tools ?? 0)}
          subtitle={`${analytics?.total_tools ?? 0} total`}
          icon={<Wrench className="w-4 h-4 text-violet-400" />}
        />
        <StatCard
          title="Avg Response"
          value={analytics?.avg_response_ms != null ? `${analytics.avg_response_ms}` : '—'}
          subtitle="ms this month"
          icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {services.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Your Services</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm text-white">{service.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{service.description}</p>
                </div>
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
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
    </div>
  )
}
