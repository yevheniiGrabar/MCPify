import { useAuditLog } from '@/api/analytics'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const entries = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/services/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">
            {meta ? `${meta.total} total calls` : 'Loading...'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tool Calls</CardTitle>
          <CardDescription>
            Every MCP tool call made to this service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No calls recorded yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Caller IP</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.http_method && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {entry.http_method}
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            {entry.tool_name ?? 'Unknown'}
                          </span>
                        </div>
                        {entry.endpoint_path && (
                          <code className="text-xs text-gray-400">{entry.endpoint_path}</code>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.response_status != null && (
                          <Badge
                            variant="secondary"
                            className={
                              entry.response_status < 400
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {entry.response_status}
                          </Badge>
                        )}
                        {entry.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                            {entry.error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {entry.duration_ms != null ? `${entry.duration_ms}ms` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 font-mono">
                          {entry.caller_ip ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
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
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">
                    Page {meta.current_page} of {Math.ceil(meta.total / meta.per_page)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
        </CardContent>
      </Card>
    </div>
  )
}
