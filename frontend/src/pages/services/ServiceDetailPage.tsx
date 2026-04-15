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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!service) return null

  const mcpUrl = `${import.meta.env.VITE_MCP_WORKER_URL || import.meta.env.VITE_API_URL}/mcp/${service.mcp_url_token}`

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{service.name}</h1>
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
          </div>
          <p className="text-zinc-400 mt-1 text-sm">{service.description}</p>
        </div>
      </div>

      {/* MCP Endpoint */}
      <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">MCP Endpoint</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Use this URL to connect your service to AI clients</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm">
          <span className="flex-1 text-zinc-300 truncate">{mcpUrl}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 flex-shrink-0"
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
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Regenerate Token
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-surface-card border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Regenerate MCP token?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  The current token will be immediately invalidated. All connected AI clients
                  will need to be reconfigured with the new URL.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-orange-600 hover:bg-orange-500"
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
      </div>

      <AuthConfigCard serviceId={serviceId} />

      {tools.length > 0 && (
        <ConnectionInstructions mcpUrl={mcpUrl} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={<Plug className="w-5 h-5 text-brand-400" />}
          title="API Connection"
          description={
            tools.length > 0
              ? `${tools.length} tools imported`
              : 'Connect your API to generate MCP tools'
          }
          buttonLabel={tools.length > 0 ? 'Re-import Tools' : 'Connect API'}
          to={`/services/${id}/connect`}
        />
        <ActionCard
          icon={<Wrench className="w-5 h-5 text-violet-400" />}
          title="Tools"
          description={
            tools.length > 0
              ? `${tools.filter((t) => t.is_enabled).length} enabled / ${tools.length} total`
              : 'No tools configured yet'
          }
          buttonLabel="Manage Tools"
          to={`/services/${id}/tools`}
          variant="outline"
        />
        <ActionCard
          icon={<ClipboardList className="w-5 h-5 text-emerald-400" />}
          title="Audit Log"
          description="View all tool call history and caller details"
          buttonLabel="View Log"
          to={`/services/${id}/audit-log`}
          variant="outline"
        />
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
  buttonLabel,
  to,
  variant = 'primary',
}: {
  icon: React.ReactNode
  title: string
  description: string
  buttonLabel: string
  to: string
  variant?: 'primary' | 'outline'
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-4">{description}</p>
      <Button
        asChild
        size="sm"
        className={
          variant === 'primary'
            ? 'w-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20'
            : 'w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
        }
        variant={variant === 'outline' ? 'outline' : 'default'}
      >
        <Link to={to}>{buttonLabel}</Link>
      </Button>
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

  const inputCls = 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500'

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
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Authentication</h2>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        {authInfo?.has_credentials
          ? `Configured: ${authInfo.auth_type} authentication`
          : 'Configure how MCPify authenticates with your upstream API'}
      </p>

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            {authInfo?.has_credentials ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-zinc-300">Credentials configured ({authInfo.auth_type})</span>
              </span>
            ) : (
              <span className="text-zinc-500">No credentials configured</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => {
              setAuthType(authInfo?.auth_type ?? 'none')
              setIsEditing(true)
            }}
          >
            {authInfo?.has_credentials ? 'Update' : 'Configure'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Auth Type</Label>
            <Select value={authType} onValueChange={setAuthType}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-zinc-800">
                <SelectItem value="none" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">None</SelectItem>
                <SelectItem value="bearer" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Bearer Token</SelectItem>
                <SelectItem value="api_key" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">API Key</SelectItem>
                <SelectItem value="basic" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authType === 'bearer' && (
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Bearer Token</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {authType === 'api_key' && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">API Key</Label>
                <Input
                  type="password"
                  placeholder="your-api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Header Name</Label>
                <Input
                  placeholder="X-API-Key"
                  value={apiKeyHeader}
                  onChange={(e) => setApiKeyHeader(e.target.value)}
                  className={inputCls}
                />
              </div>
            </>
          )}

          {authType === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="bg-brand-600 hover:bg-brand-500 text-white"
              onClick={handleSave}
              disabled={updateAuth.isPending}
            >
              {updateAuth.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
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
    { mcpServers: { mcpify: { url: mcpUrl } } },
    null,
    2
  )
  const cursorConfig = JSON.stringify(
    { mcpServers: { mcpify: { url: mcpUrl } } },
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
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Connect to AI Clients</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Copy the configuration below and add it to your AI client
        </p>
      </div>
      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{config.title}</p>
                <p className="text-xs text-zinc-500">{config.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => copySnippet(config.key, config.snippet)}
              >
                {copiedKey === config.key ? (
                  <Check className="w-3 h-3 mr-1 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 font-mono text-xs text-zinc-300 overflow-x-auto">
              {config.snippet}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
