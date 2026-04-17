import { useConnectManual, useConnectOpenApi, type McpTool } from '@/api/tools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileJson,
  Globe,
  Upload,
  Wrench,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

type Step = 'choose' | 'openapi' | 'manual' | 'review'

const openApiSchema = z
  .object({
    url: z.string().optional(),
    spec_json: z.string().optional(),
  })
  .refine((data) => data.url || data.spec_json, {
    message: 'Provide either a URL or paste the spec JSON',
  })

type OpenApiFormData = z.infer<typeof openApiSchema>

const manualSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  endpoint_path: z.string().min(1, 'Endpoint path is required').startsWith('/', 'Must start with /'),
  description: z.string().optional(),
  input_schema: z.string().optional(),
})

type ManualFormData = z.infer<typeof manualSchema>

const inputCls = 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500'
const labelCls = 'text-zinc-300 text-sm'

export function ConnectServicePage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('choose')
  const [createdTools, setCreatedTools] = useState<McpTool[]>([])

  const connectOpenApi = useConnectOpenApi(serviceId)
  const connectManual = useConnectManual(serviceId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openApiForm = useForm<OpenApiFormData>({
    resolver: zodResolver(openApiSchema),
  })

  const manualForm = useForm<ManualFormData>({
    resolver: zodResolver(manualSchema),
    defaultValues: { http_method: 'GET' },
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      openApiForm.setValue('spec_json', content)
      toast.success(`Loaded ${file.name}`)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(file)
  }

  const onSubmitOpenApi = (data: OpenApiFormData) => {
    connectOpenApi.mutate(
      { url: data.url || undefined, spec_json: data.spec_json || undefined },
      {
        onSuccess: (result) => {
          setCreatedTools(result.data)
          toast.success(`${result.meta.tools_created} tools imported`)
          setStep('review')
        },
        onError: (err: unknown) => {
          let msg = 'Failed to parse OpenAPI spec'
          if (err && typeof err === 'object') {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number }; message?: string }
            if (axiosErr.response?.data?.message) {
              msg = axiosErr.response.data.message
            } else if (axiosErr.response?.status) {
              msg = `Server error: ${axiosErr.response.status}`
            } else if (axiosErr.message) {
              msg = axiosErr.message
            }
          }
          console.error('Connect error:', err)
          toast.error(msg)
        },
      }
    )
  }

  const onSubmitManual = (data: ManualFormData) => {
    let inputSchema: Record<string, unknown> | undefined
    if (data.input_schema) {
      try {
        inputSchema = JSON.parse(data.input_schema) as Record<string, unknown>
      } catch {
        toast.error('Invalid JSON in input schema')
        return
      }
    }

    connectManual.mutate(
      {
        name: data.name,
        http_method: data.http_method,
        endpoint_path: data.endpoint_path,
        description: data.description,
        input_schema: inputSchema,
      },
      {
        onSuccess: (tool) => {
          setCreatedTools((prev) => [...prev, tool])
          toast.success('Tool added')
          manualForm.reset({ http_method: 'GET' })
        },
        onError: () => toast.error('Failed to add tool'),
      }
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Connect API</h1>
          <p className="text-zinc-400 mt-1">Import tools from your API</p>
        </div>
      </div>

      {/* Step 1: Choose method */}
      {step === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setStep('openapi')}
            className="rounded-xl border border-zinc-800 bg-surface-card p-6 text-center hover:border-brand-500/40 hover:bg-zinc-800/50 transition-all text-left"
          >
            <FileJson className="w-10 h-10 text-brand-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Import OpenAPI Spec</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Auto-import all endpoints from an OpenAPI/Swagger specification
            </p>
            <span className="inline-flex items-center gap-2 text-sm text-brand-400 border border-brand-500/20 bg-brand-500/5 px-3 py-1.5 rounded-lg">
              <Globe className="w-4 h-4" />
              From URL or JSON
            </span>
          </button>

          <button
            onClick={() => setStep('manual')}
            className="rounded-xl border border-zinc-800 bg-surface-card p-6 text-center hover:border-violet-500/40 hover:bg-zinc-800/50 transition-all text-left"
          >
            <Wrench className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Add Manually</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Define tools one by one with custom configuration
            </p>
            <span className="inline-flex items-center gap-2 text-sm text-violet-400 border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              Configure tool
            </span>
          </button>
        </div>
      )}

      {/* Step 2a: OpenAPI form */}
      {step === 'openapi' && (
        <div className="rounded-xl border border-zinc-800 bg-surface-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Import OpenAPI Specification</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Provide a URL to your OpenAPI spec or paste the JSON directly
              </p>
            </div>
            <form onSubmit={openApiForm.handleSubmit(onSubmitOpenApi)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url" className={labelCls}>Spec URL</Label>
                <Input
                  id="url"
                  placeholder="https://api.example.com/openapi.json"
                  className={inputCls}
                  {...openApiForm.register('url')}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <div className="h-px flex-1 bg-zinc-800" />
                or upload a file
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload .json or .yaml file
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <div className="h-px flex-1 bg-zinc-800" />
                or paste directly
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spec_json" className={labelCls}>Paste JSON Spec</Label>
                <Textarea
                  id="spec_json"
                  placeholder='{"openapi": "3.0.0", ...} or YAML'
                  rows={8}
                  className={`font-mono text-sm ${inputCls}`}
                  {...openApiForm.register('spec_json')}
                />
              </div>

              {openApiForm.formState.errors.root && (
                <p className="text-sm text-red-400">
                  {openApiForm.formState.errors.root.message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
                  disabled={connectOpenApi.isPending}
                >
                  {connectOpenApi.isPending ? 'Importing...' : 'Import Tools'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => setStep('choose')}
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2b: Manual form */}
      {step === 'manual' && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-surface-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">Add Tool Manually</h2>
                <p className="text-sm text-zinc-400 mt-0.5">Define a single API endpoint as an MCP tool</p>
              </div>
              <form onSubmit={manualForm.handleSubmit(onSubmitManual)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={labelCls}>Tool Name</Label>
                  <Input
                    id="name"
                    placeholder="get_users"
                    className={inputCls}
                    {...manualForm.register('name')}
                  />
                  {manualForm.formState.errors.name && (
                    <p className="text-sm text-red-400">
                      {manualForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelCls}>HTTP Method</Label>
                    <Controller
                      name="http_method"
                      control={manualForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-card border-zinc-800">
                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                              <SelectItem
                                key={m}
                                value={m}
                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                              >
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint_path" className={labelCls}>Endpoint Path</Label>
                    <Input
                      id="endpoint_path"
                      placeholder="/users/{id}"
                      className={inputCls}
                      {...manualForm.register('endpoint_path')}
                    />
                    {manualForm.formState.errors.endpoint_path && (
                      <p className="text-sm text-red-400">
                        {manualForm.formState.errors.endpoint_path.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className={labelCls}>Description</Label>
                  <Input
                    id="description"
                    placeholder="Retrieve a user by their ID"
                    className={inputCls}
                    {...manualForm.register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input_schema" className={labelCls}>Input Schema (JSON, optional)</Label>
                  <Textarea
                    id="input_schema"
                    placeholder='{"type": "object", "properties": {...}}'
                    rows={4}
                    className={`font-mono text-sm ${inputCls}`}
                    {...manualForm.register('input_schema')}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
                    disabled={connectManual.isPending}
                  >
                    {connectManual.isPending ? 'Adding...' : 'Add Tool'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    onClick={() => setStep('choose')}
                  >
                    Back
                  </Button>
                  {createdTools.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      onClick={() => setStep('review')}
                    >
                      Review ({createdTools.length} tools)
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {createdTools.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Added Tools ({createdTools.length})</h3>
              <div className="space-y-2">
                {createdTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center gap-3 text-sm py-1.5 border-b border-zinc-800 last:border-0"
                  >
                    <MethodBadge method={tool.http_method} />
                    <span className="font-medium text-white">{tool.name}</span>
                    <span className="text-zinc-500 font-mono text-xs">{tool.endpoint_path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="rounded-xl border border-zinc-800 bg-surface-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">{createdTools.length} Tools Created</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Your API tools are ready. You can manage them from the tools page.
            </p>

            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left">
              {createdTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-3 text-sm py-2 border-b border-zinc-800 last:border-0"
                >
                  <MethodBadge method={tool.http_method} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white">{tool.name}</span>
                    <span className="text-zinc-500 font-mono text-xs ml-2 truncate">
                      {tool.endpoint_path}
                    </span>
                  </div>
                  {tool.is_destructive && (
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                      destructive
                    </span>
                  )}
                  {!tool.is_enabled && (
                    <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                      disabled
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20"
                asChild
              >
                <Link to={`/services/${id}`}>
                  View MCP URL
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => void navigate(`/services/${id}/tools`)}
              >
                Manage Tools
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${colors[method] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
    >
      {method}
    </span>
  )
}
