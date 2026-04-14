import { useConnectManual, useConnectOpenApi, type McpTool } from '@/api/tools'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
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

export function ConnectServicePage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('choose')
  const [createdTools, setCreatedTools] = useState<McpTool[]>([])

  const connectOpenApi = useConnectOpenApi(serviceId)
  const connectManual = useConnectManual(serviceId)

  const openApiForm = useForm<OpenApiFormData>({
    resolver: zodResolver(openApiSchema),
  })

  const manualForm = useForm<ManualFormData>({
    resolver: zodResolver(manualSchema),
    defaultValues: { http_method: 'GET' },
  })

  const onSubmitOpenApi = (data: OpenApiFormData) => {
    connectOpenApi.mutate(
      { url: data.url || undefined, spec_json: data.spec_json || undefined },
      {
        onSuccess: (result) => {
          setCreatedTools(result.data)
          toast.success(`${result.meta.tools_created} tools imported`)
          setStep('review')
        },
        onError: () => toast.error('Failed to parse OpenAPI spec'),
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
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/services/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connect API</h1>
          <p className="text-gray-500 mt-1">Import tools from your API</p>
        </div>
      </div>

      {/* Step 1: Choose method */}
      {step === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
            onClick={() => setStep('openapi')}
          >
            <CardHeader className="text-center pb-2">
              <FileJson className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Import OpenAPI Spec</CardTitle>
              <CardDescription>
                Auto-import all endpoints from an OpenAPI/Swagger specification
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="mt-2">
                <Globe className="w-4 h-4 mr-2" />
                From URL or JSON
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
            onClick={() => setStep('manual')}
          >
            <CardHeader className="text-center pb-2">
              <Wrench className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Add Manually</CardTitle>
              <CardDescription>
                Define tools one by one with custom configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="mt-2">
                <ArrowRight className="w-4 h-4 mr-2" />
                Configure tool
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2a: OpenAPI form */}
      {step === 'openapi' && (
        <Card>
          <CardHeader>
            <CardTitle>Import OpenAPI Specification</CardTitle>
            <CardDescription>
              Provide a URL to your OpenAPI spec or paste the JSON directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={openApiForm.handleSubmit(onSubmitOpenApi)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Spec URL</Label>
                <Input
                  id="url"
                  placeholder="https://api.example.com/openapi.json"
                  {...openApiForm.register('url')}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="h-px flex-1 bg-gray-200" />
                or
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spec_json">Paste JSON Spec</Label>
                <Textarea
                  id="spec_json"
                  placeholder='{"openapi": "3.0.0", ...}'
                  rows={8}
                  className="font-mono text-sm"
                  {...openApiForm.register('spec_json')}
                />
              </div>

              {openApiForm.formState.errors.root && (
                <p className="text-sm text-red-500">
                  {openApiForm.formState.errors.root.message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={connectOpenApi.isPending}
                >
                  {connectOpenApi.isPending ? 'Importing...' : 'Import Tools'}
                </Button>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: Manual form */}
      {step === 'manual' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add Tool Manually</CardTitle>
              <CardDescription>Define a single API endpoint as an MCP tool</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={manualForm.handleSubmit(onSubmitManual)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tool Name</Label>
                  <Input
                    id="name"
                    placeholder="get_users"
                    {...manualForm.register('name')}
                  />
                  {manualForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>HTTP Method</Label>
                    <Controller
                      name="http_method"
                      control={manualForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint_path">Endpoint Path</Label>
                    <Input
                      id="endpoint_path"
                      placeholder="/users/{id}"
                      {...manualForm.register('endpoint_path')}
                    />
                    {manualForm.formState.errors.endpoint_path && (
                      <p className="text-sm text-red-500">
                        {manualForm.formState.errors.endpoint_path.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Retrieve a user by their ID"
                    {...manualForm.register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input_schema">Input Schema (JSON, optional)</Label>
                  <Textarea
                    id="input_schema"
                    placeholder='{"type": "object", "properties": {...}}'
                    rows={4}
                    className="font-mono text-sm"
                    {...manualForm.register('input_schema')}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={connectManual.isPending}
                  >
                    {connectManual.isPending ? 'Adding...' : 'Add Tool'}
                  </Button>
                  <Button variant="outline" onClick={() => setStep('choose')}>
                    Back
                  </Button>
                  {createdTools.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep('review')}
                      className="ml-auto"
                    >
                      Review ({createdTools.length} tools)
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {createdTools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Added Tools ({createdTools.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {createdTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0"
                    >
                      <MethodBadge method={tool.http_method} />
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-gray-400 font-mono text-xs">{tool.endpoint_path}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle>{createdTools.length} Tools Created</CardTitle>
            <CardDescription>
              Your API tools are ready. You can manage them from the tools page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {createdTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-3 text-sm py-2 border-b last:border-0"
                >
                  <MethodBadge method={tool.http_method} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-gray-400 font-mono text-xs ml-2 truncate">
                      {tool.endpoint_path}
                    </span>
                  </div>
                  {tool.is_destructive && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      destructive
                    </span>
                  )}
                  {!tool.is_enabled && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      disabled
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => void navigate(`/services/${id}/tools`)}
              >
                Manage Tools
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/services/${id}`}>Back to Service</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    PATCH: 'bg-orange-100 text-orange-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colors[method] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {method}
    </span>
  )
}
