'use client'

import { useState } from 'react'
import type { RegistryServer } from '@/lib/types'
import { connectServer } from '@/lib/api'

interface ConnectInstructionsProps {
  server: RegistryServer
}

type TabType = 'claude' | 'cursor' | 'api'

export function ConnectInstructions({ server }: ConnectInstructionsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('claude')
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const response = await connectServer(server.slug)
      setConfig(response.data.config)
    } catch {
      console.error('Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const configString = JSON.stringify(config, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'claude', label: 'Claude Desktop' },
    { id: 'cursor', label: 'Cursor' },
    { id: 'api', label: 'API' },
  ]

  const configPath: Record<TabType, string> = {
    claude: '~/Library/Application Support/Claude/claude_desktop_config.json',
    cursor: '~/.cursor/mcp.json',
    api: 'Direct API endpoint',
  }

  if (!config) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Connect to {server.name}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Generate your connection config to use this server with your AI agent.
        </p>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect Now'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Connected!</h2>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-2">
        Add to <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{configPath[activeTab]}</code>
      </p>

      <div className="relative">
        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
          <code>{configString}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-md transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {server.docs_url && (
        <a
          href={server.docs_url}
          className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 mt-4 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          View documentation →
        </a>
      )}
    </div>
  )
}
