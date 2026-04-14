import { useTools, useUpdateTool, useDeleteTool } from '@/api/tools'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

export function ToolsPage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const { data: tools = [], isLoading } = useTools(serviceId)
  const updateTool = useUpdateTool()
  const deleteTool = useDeleteTool()

  const handleToggle = (toolId: number, currentEnabled: boolean) => {
    updateTool.mutate(
      { toolId, payload: { is_enabled: !currentEnabled } },
      {
        onSuccess: () => toast.success(currentEnabled ? 'Tool disabled' : 'Tool enabled'),
        onError: () => toast.error('Failed to update tool'),
      }
    )
  }

  const handleDelete = (toolId: number) => {
    deleteTool.mutate(
      { toolId, serviceId },
      {
        onSuccess: () => toast.success('Tool deleted'),
        onError: () => toast.error('Failed to delete tool'),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/services/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tools</h1>
            <p className="text-gray-500 mt-1">{tools.length} tools configured</p>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
          <Link to={`/services/${id}/connect`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tools
          </Link>
        </Button>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No tools yet</CardTitle>
            <CardDescription>
              Connect your API to import tools automatically or add them manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
              <Link to={`/services/${id}/connect`}>Connect API</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{tool.name}</span>
                        {tool.description && (
                          <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`font-mono text-xs ${methodColors[tool.http_method] ?? ''}`}
                      >
                        {tool.http_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-gray-600">{tool.endpoint_path}</code>
                    </TableCell>
                    <TableCell>
                      {tool.is_destructive && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          destructive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tool.is_enabled}
                        onCheckedChange={() => handleToggle(tool.id, tool.is_enabled)}
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete tool?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove &quot;{tool.name}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(tool.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
