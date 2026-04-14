import {
  type TimeRange,
  useServiceAnalytics,
  downloadCsv,
} from '@/api/analytics'
import { useServices } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your service usage and performance</p>
        </div>
        <div className="text-center py-16 text-gray-400">
          Create a service to start seeing analytics
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your service usage and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(serviceId)}
            onValueChange={(v) => setSelectedServiceId(Number(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === r.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : analytics ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Calls"
              value={analytics.total_calls.toLocaleString()}
              icon={<Activity className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              title="Error Rate"
              value={`${analytics.error_rate}%`}
              icon={<AlertTriangle className="w-4 h-4 text-gray-400" />}
              alert={analytics.error_rate > 10}
            />
            <StatCard
              title="Avg Response"
              value={analytics.avg_duration_ms != null ? `${analytics.avg_duration_ms}ms` : '\u2014'}
              icon={<Clock className="w-4 h-4 text-gray-400" />}
              subtitle={
                analytics.p95_duration_ms != null
                  ? `p95: ${analytics.p95_duration_ms}ms`
                  : undefined
              }
            />
            <StatCard
              title="p99 Latency"
              value={analytics.p99_duration_ms != null ? `${analytics.p99_duration_ms}ms` : '\u2014'}
              icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
              subtitle={
                analytics.p50_duration_ms != null
                  ? `p50: ${analytics.p50_duration_ms}ms`
                  : undefined
              }
            />
          </div>

          {/* Calls over time chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Calls Over Time
              </CardTitle>
              <CardDescription>Total and error calls per {range === '7d' ? 'hour' : 'day'}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.chart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v)
                        return range === '7d'
                          ? d.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit' })
                          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(v: string) => new Date(v).toLocaleString()}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'calls' ? 'Calls' : name === 'errors' ? 'Errors' : 'Avg Duration (ms)',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-12">No data for this period</p>
              )}
            </CardContent>
          </Card>

          {/* Top tools bar chart */}
          {analytics.tool_stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Tools by Usage</CardTitle>
                <CardDescription>Most called tools in this period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, analytics.tool_stats.length * 40)}>
                  <BarChart data={analytics.tool_stats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'total_calls' ? 'Calls' : 'Errors',
                      ]}
                    />
                    <Bar dataKey="total_calls" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="error_calls" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-tool table */}
          {analytics.tool_stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Per-Tool Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">Error Rate</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.tool_stats.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tool.http_method && (
                              <Badge variant="secondary" className="font-mono text-xs">
                                {tool.http_method}
                              </Badge>
                            )}
                            <span className="font-medium text-sm">{tool.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {tool.total_calls.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {tool.error_calls}
                        </TableCell>
                        <TableCell className="text-right">
                          {tool.total_calls > 0 ? (
                            <Badge
                              variant="secondary"
                              className={
                                (tool.error_calls / tool.total_calls) * 100 > 10
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }
                            >
                              {((tool.error_calls / tool.total_calls) * 100).toFixed(1)}%
                            </Badge>
                          ) : (
                            '\u2014'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {tool.avg_duration != null ? `${tool.avg_duration}ms` : '\u2014'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent errors */}
          {analytics.recent_errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Recent Errors
                </CardTitle>
                <CardDescription>Last 20 failed tool calls</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recent_errors.map((err) => (
                      <TableRow key={err.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {err.http_method && (
                              <Badge variant="secondary" className="font-mono text-xs">
                                {err.http_method}
                              </Badge>
                            )}
                            <span className="text-sm">{err.tool_name ?? 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            {err.response_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-red-600 max-w-xs truncate block">
                            {err.error_message ?? '\u2014'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {err.duration_ms != null ? `${err.duration_ms}ms` : '\u2014'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {err.called_at
                            ? new Date(err.called_at).toLocaleString()
                            : '\u2014'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
    <Card className={alert ? 'border-red-200' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${alert ? 'text-red-600' : ''}`}>{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
