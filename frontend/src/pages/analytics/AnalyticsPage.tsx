import {
  type TimeRange,
  useServiceAnalytics,
  downloadCsv,
} from '@/api/analytics'
import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
]

export function AnalyticsPage() {
  const { data: services = [] } = useServices()
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [range, setRange] = useState<TimeRange>('7d')

  const serviceId = selectedServiceId ?? services[0]?.id
  const { data: analytics, isLoading } = useServiceAnalytics(
    serviceId ?? 0,
    range,
  )

  const handleExport = async () => {
    if (!serviceId) return
    try {
      await downloadCsv(serviceId, range)
      toast.success('CSV downloaded')
    } catch {
      toast.error('Failed to export CSV')
    }
  }

  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-zinc-400 mt-1">Monitor your service usage and performance</p>
        </div>
        <div className="text-center py-16 text-zinc-500">
          Create a service to start seeing analytics
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-zinc-400 mt-1">Monitor your service usage and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(serviceId)}
            onValueChange={(v) => setSelectedServiceId(Number(v))}
          >
            <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-zinc-800">
              {services.map((s) => (
                <SelectItem
                  key={s.id}
                  value={String(s.id)}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === r.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      ) : analytics ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Calls"
              value={analytics.total_calls.toLocaleString()}
              icon={<Activity className="w-4 h-4 text-brand-400" />}
            />
            <StatCard
              title="Error Rate"
              value={`${analytics.error_rate}%`}
              icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
              alert={analytics.error_rate > 10}
            />
            <StatCard
              title="Avg Response"
              value={analytics.avg_duration_ms != null ? `${analytics.avg_duration_ms}ms` : '—'}
              icon={<Clock className="w-4 h-4 text-emerald-400" />}
              subtitle={
                analytics.p95_duration_ms != null
                  ? `p95: ${analytics.p95_duration_ms}ms`
                  : undefined
              }
            />
            <StatCard
              title="p99 Latency"
              value={analytics.p99_duration_ms != null ? `${analytics.p99_duration_ms}ms` : '—'}
              icon={<TrendingUp className="w-4 h-4 text-violet-400" />}
              subtitle={
                analytics.p50_duration_ms != null
                  ? `p50: ${analytics.p50_duration_ms}ms`
                  : undefined
              }
            />
          </div>

          {/* Calls over time chart */}
          <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white">Calls Over Time</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Total and error calls per {range === '7d' ? 'hour' : 'day'}
            </p>
            {analytics.chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v)
                      return range === '7d'
                        ? d.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit' })
                        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1c22', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    labelFormatter={(v: string) => new Date(v).toLocaleString()}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'calls' ? 'Calls' : name === 'errors' ? 'Errors' : 'Avg Duration (ms)',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-zinc-500 py-12">No data for this period</p>
            )}
          </div>

          {/* Top tools bar chart */}
          {analytics.tool_stats.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
              <h2 className="text-sm font-semibold text-white mb-1">Top Tools by Usage</h2>
              <p className="text-xs text-zinc-400 mb-4">Most called tools in this period</p>
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.tool_stats.length * 40)}>
                <BarChart data={analytics.tool_stats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#71717a' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1c22', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'total_calls' ? 'Calls' : 'Errors',
                    ]}
                  />
                  <Bar dataKey="total_calls" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="error_calls" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-tool table */}
          {analytics.tool_stats.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-white">Per-Tool Breakdown</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Tool</TableHead>
                    <TableHead className="text-right text-zinc-400">Calls</TableHead>
                    <TableHead className="text-right text-zinc-400">Errors</TableHead>
                    <TableHead className="text-right text-zinc-400">Error Rate</TableHead>
                    <TableHead className="text-right text-zinc-400">Avg Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.tool_stats.map((tool) => (
                    <TableRow key={tool.id} className="border-zinc-800 hover:bg-zinc-800/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tool.http_method && (
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              {tool.http_method}
                            </Badge>
                          )}
                          <span className="font-medium text-sm text-white">{tool.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-zinc-300">
                        {tool.total_calls.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-zinc-300">
                        {tool.error_calls}
                      </TableCell>
                      <TableCell className="text-right">
                        {tool.total_calls > 0 ? (
                          <Badge
                            variant="secondary"
                            className={
                              (tool.error_calls / tool.total_calls) * 100 > 10
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }
                          >
                            {((tool.error_calls / tool.total_calls) * 100).toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-zinc-300">
                        {tool.avg_duration != null ? `${tool.avg_duration}ms` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Recent errors */}
          {analytics.recent_errors.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-white">Recent Errors</h2>
                <span className="text-xs text-zinc-500 ml-1">Last 20 failed tool calls</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Tool</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Error</TableHead>
                    <TableHead className="text-zinc-400">Duration</TableHead>
                    <TableHead className="text-zinc-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recent_errors.map((err) => (
                    <TableRow key={err.id} className="border-zinc-800 hover:bg-zinc-800/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {err.http_method && (
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              {err.http_method}
                            </Badge>
                          )}
                          <span className="text-sm text-white">{err.tool_name ?? 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          {err.response_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-red-400 max-w-xs truncate block">
                          {err.error_message ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 font-mono">
                        {err.duration_ms != null ? `${err.duration_ms}ms` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {err.called_at
                          ? new Date(err.called_at).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  alert,
}: {
  title: string
  value: string
  icon: React.ReactNode
  subtitle?: string
  alert?: boolean
}) {
  return (
    <div className={`rounded-xl border bg-surface-card p-5 ${alert ? 'border-red-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</div>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}
