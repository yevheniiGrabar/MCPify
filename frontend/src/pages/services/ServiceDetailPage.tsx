import { useService, useRegenerateToken } from '@/api/services'
import { useTools, useServiceAuth, useUpdateServiceAuth } from '@/api/tools'
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
import { Badge } from '@/components/ui/badge'
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
import { ArrowLeft, Check, ClipboardList, Copy, KeyRound, Plug, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = Number(id)
  const { data: service, isLoading } = useService(serviceId)
  const { data: tools = [] } = useTools(serviceId)
  const regenerateToken = useRegenerateToken(serviceId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!service) return null

  const mcpUrl = `${import.meta.env.VITE_API_URL}/mcp/${service.mcp_url_token}`

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <Badge
              variant="secondary"
              className={
                service.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : service.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
              }
            >
              {service.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{service.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MCP Endpoint</CardTitle>
          <CardDescription>Use this URL to connect your service to AI clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm">
            <span className="flex-1 text-gray-700 truncate">{mcpUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(mcpUrl)
                toast.success('Copied to clipboard')
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  Regenerate Token
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate MCP token?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The current token will be immediately invalidated. All connected AI clients
                    will need to be reconfigured with the new URL.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      regenerateToken.mutate(undefined, {
                        onSuccess: () => toast.success('Token regenerated'),
                        onError: () => toast.error('Failed to regenerate token'),
                      })
                    }}
                  >
                    Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <AuthConfigCard serviceId={serviceId} />

      {tools.length > 0 && (
        <ConnectionInstructions mcpUrl={mcpUrl} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-indigo-600" />
              API Connection
            </CardTitle>
            <CardDescription>
              {tools.length > 0
                ? `${tools.length} tools imported`
                : 'Connect your API to generate MCP tools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full" asChild>
              <Link to={`/services/${id}/connect`}>
                {tools.length > 0 ? 'Re-import Tools' : 'Connect API'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-600" />
              Tools
            </CardTitle>
            <CardDescription>
              {tools.length > 0
                ? `${tools.filter((t) => t.is_enabled).length} enabled / ${tools.length} total`
                : 'No tools configured yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/services/${id}/tools`}>Manage Tools</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Audit Log
            </CardTitle>
            <CardDescription>
              View all tool call history and caller details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/services/${id}/audit-log`}>View Log</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AuthConfigCard({ serviceId }: { serviceId: number }) {
  const { data: authInfo } = useServiceAuth(serviceId)
  const updateAuth = useUpdateServiceAuth(serviceId)
  const [authType, setAuthType] = useState<string>('')
  const [token, setToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    let authConfig: Record<string, unknown> | null = null

    switch (authType) {
      case 'bearer':
        authConfig = { token }
        break
      case 'api_key':
        authConfig = { api_key: apiKey, api_key_header: apiKeyHeader }
        break
      case 'basic':
        authConfig = { username, password }
        break
    }

    updateAuth.mutate(
      { auth_type: authType, auth_config: authConfig },
      {
        onSuccess: () => {
          toast.success('Auth configuration saved')
          setIsEditing(false)
          setToken('')
          setApiKey('')
          setUsername('')
          setPassword('')
        },
        onError: () => toast.error('Failed to save auth config'),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          Authentication
        </CardTitle>
        <CardDescription>
          {authInfo?.has_credentials
            ? `Configured: ${authInfo.auth_type} authentication`
            : 'Configure how MCPify authenticates with your upstream API'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {authInfo?.has_credentials ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Credentials configured ({authInfo.auth_type})
                </span>
              ) : (
                <span className="text-gray-400">No credentials configured</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setAuthType(authInfo?.auth_type ?? 'none')
              setIsEditing(true)
            }}>
              {authInfo?.has_credentials ? 'Update' : 'Configure'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Auth Type</Label>
              <Select value={authType} onValueChange={setAuthType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authType === 'bearer' && (
              <div className="space-y-2">
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            )}

            {authType === 'api_key' && (
              <>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="your-api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Name</Label>
                  <Input
                    placeholder="X-API-Key"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                  />
                </div>
              </>
            )}

            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSave}
                disabled={updateAuth.isPending}
              >
                {updateAuth.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConnectionInstructions({ mcpUrl }: { mcpUrl: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copySnippet = (key: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        mcpify: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  )

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        mcpify: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  )

  const configs = [
    {
      key: 'claude',
      title: 'Claude Desktop',
      description: 'Add to claude_desktop_config.json',
      snippet: claudeConfig,
    },
    {
      key: 'cursor',
      title: 'Cursor / VS Code',
      description: 'Add to .cursor/mcp.json or settings',
      snippet: cursorConfig,
    },
    {
      key: 'chatgpt',
      title: 'ChatGPT',
      description: 'Go to Settings > MCP Servers > Add Server',
      snippet: mcpUrl,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to AI Clients</CardTitle>
        <CardDescription>
          Copy the configuration below and add it to your AI client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.map((config) => (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{config.title}</p>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySnippet(config.key, config.snippet)}
              >
                {copiedKey === config.key ? (
                  <Check className="w-3 h-3 mr-1 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <pre className="bg-gray-50 rounded-lg px-4 py-3 font-mono text-xs text-gray-700 overflow-x-auto">
              {config.snippet}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
