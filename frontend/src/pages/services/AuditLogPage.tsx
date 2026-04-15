import { useAuditLog } from '@/api/analytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export function AuditLogPage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAuditLog(serviceId, page)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  const entries = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Link to={`/services/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Log</h1>
          <p className="text-zinc-400 mt-1">
            {meta ? `${meta.total} total calls` : 'Loading...'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Recent Tool Calls</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Every MCP tool call made to this service</p>
        </div>

        {entries.length === 0 ? (
          <p className="text-center text-zinc-500 py-10">No calls recorded yet</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Tool</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Duration</TableHead>
                  <TableHead className="text-zinc-400">Caller IP</TableHead>
                  <TableHead className="text-zinc-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className="border-zinc-800 hover:bg-zinc-800/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.http_method && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {entry.http_method}
                          </Badge>
                        )}
                        <span className="text-sm font-medium text-white">
                          {entry.tool_name ?? 'Unknown'}
                        </span>
                      </div>
                      {entry.endpoint_path && (
                        <code className="text-xs text-zinc-500 font-mono">{entry.endpoint_path}</code>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.response_status != null && (
                        <Badge
                          variant="secondary"
                          className={
                            entry.response_status < 400
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }
                        >
                          {entry.response_status}
                        </Badge>
                      )}
                      {entry.error_message && (
                        <p className="text-xs text-red-400 mt-1 max-w-xs truncate">
                          {entry.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-400 font-mono">
                        {entry.duration_ms != null ? `${entry.duration_ms}ms` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-500 font-mono">
                        {entry.caller_ip ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-500">
                        {entry.called_at
                          ? new Date(entry.called_at).toLocaleString()
                          : '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.total > meta.per_page && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                <span className="text-sm text-zinc-500">
                  Page {meta.current_page} of {Math.ceil(meta.total / meta.per_page)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    disabled={page >= Math.ceil(meta.total / meta.per_page)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
