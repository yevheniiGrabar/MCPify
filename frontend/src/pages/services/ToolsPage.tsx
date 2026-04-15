import { useTools, useUpdateTool, useDeleteTool } from '@/api/tools'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ArrowLeft, Plus, Trash2, AlertTriangle, Pencil, Check, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface EditState {
  toolId: number
  field: 'name' | 'description'
  value: string
}

export function ToolsPage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const { data: tools = [], isLoading } = useTools(serviceId)
  const updateTool = useUpdateTool()
  const deleteTool = useDeleteTool()
  const [editing, setEditing] = useState<EditState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const startEdit = (toolId: number, field: 'name' | 'description', currentValue: string) => {
    setEditing({ toolId, field, value: currentValue })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const saveEdit = () => {
    if (!editing) return
    const trimmed = editing.value.trim()
    if (editing.field === 'name' && trimmed === '') {
      toast.error('Name cannot be empty')
      return
    }
    updateTool.mutate(
      { toolId: editing.toolId, payload: { [editing.field]: trimmed || null } },
      {
        onSuccess: () => {
          toast.success('Updated')
          setEditing(null)
        },
        onError: () => toast.error('Failed to update'),
      }
    )
  }

  const cancelEdit = () => setEditing(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Tools</h1>
            <p className="text-zinc-400 mt-1">{tools.length} tools configured</p>
          </div>
        </div>
        <Button
          asChild
          className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
        >
          <Link to={`/services/${id}/connect`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tools
          </Link>
        </Button>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-surface-card p-10 text-center">
          <h3 className="text-base font-semibold text-white mb-1">No tools yet</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Connect your API to import tools automatically or add them manually.
          </p>
          <Button
            asChild
            className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
          >
            <Link to={`/services/${id}/connect`}>Connect API</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Method</TableHead>
                <TableHead className="text-zinc-400">Endpoint</TableHead>
                <TableHead className="text-zinc-400">Flags</TableHead>
                <TableHead className="text-zinc-400">Enabled</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <div className="space-y-0.5">
                      {editing?.toolId === tool.id && editing.field === 'name' ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={inputRef}
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-sm bg-zinc-900 border-zinc-700 text-white"
                          />
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-zinc-700" onClick={saveEdit}>
                            <Check className="w-3 h-3 text-emerald-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-zinc-700" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-zinc-500" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="font-medium text-white cursor-pointer hover:text-brand-400 inline-flex items-center gap-1 group transition-colors"
                          onClick={() => startEdit(tool.id, 'name', tool.name)}
                        >
                          {tool.name}
                          <Pencil className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                      {editing?.toolId === tool.id && editing.field === 'description' ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={inputRef}
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className="h-6 text-xs bg-zinc-900 border-zinc-700 text-white"
                            placeholder="Add description..."
                          />
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-zinc-700" onClick={saveEdit}>
                            <Check className="w-3 h-3 text-emerald-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-zinc-700" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-zinc-500" />
                          </Button>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-zinc-500 max-w-xs truncate cursor-pointer hover:text-brand-400 group inline-flex items-center gap-1 transition-colors"
                          onClick={() => startEdit(tool.id, 'description', tool.description ?? '')}
                        >
                          {tool.description || 'Add description...'}
                          <Pencil className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`font-mono text-xs border ${methodColors[tool.http_method] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                    >
                      {tool.http_method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-zinc-400 font-mono">{tool.endpoint_path}</code>
                  </TableCell>
                  <TableCell>
                    {tool.is_destructive && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-surface-card border-zinc-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete tool?</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            This will permanently remove &quot;{tool.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-500"
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
        </div>
      )}
    </div>
  )
}
