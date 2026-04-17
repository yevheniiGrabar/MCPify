import { Suspense } from 'react'
import Link from 'next/link'
import { ServerCard } from '@/components/ServerCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import type { RegistryServer } from '@/lib/types'
import { MOCK_SERVERS } from '@/lib/mock-servers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}

async function fetchServersSSR(params: Record<string, string>): Promise<RegistryServer[]> {
  const query = new URLSearchParams(params).toString()
  const url = `${API_URL}/registry/servers${query ? `?${query}` : ''}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return filterMock(params)
    const data = await res.json()
    const servers = (data.data as RegistryServer[]) ?? []
    return servers.length > 0 ? servers : filterMock(params)
  } catch {
    return filterMock(params)
  }
}

function filterMock(params: Record<string, string>): RegistryServer[] {
  let servers = MOCK_SERVERS

  if (params.category) {
    servers = servers.filter((s) => s.category === params.category)
  }

  if (params.search) {
    const q = params.search.toLowerCase()
    servers = servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }

  if (params.sort === 'rating') {
    servers = [...servers].sort((a, b) => Number(b.rating_avg) - Number(a.rating_avg))
  } else if (params.sort === 'newest') {
    servers = [...servers].sort((a, b) => b.created_at.localeCompare(a.created_at))
  } else {
    servers = [...servers].sort((a, b) => b.install_count - a.install_count)
  }

  return servers
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const servers = await fetchServersSSR(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][],
    ),
  )

  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 text-sm px-3 py-1 rounded-full mb-6 border border-violet-500/20">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            100+ MCP servers available
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            The MCP Server Registry
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Find and connect MCP servers for your AI agents
          </p>
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Promo banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-teal-950/40 border border-teal-800/50 rounded-xl px-5 py-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-teal-300">Want to create your own MCP server?</p>
            <p className="text-xs text-teal-500 mt-0.5">Connect any API to AI agents in 5 minutes — no code needed</p>
          </div>
          <a
            href="https://mcpify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Try mcpify.app →
          </a>
        </div>

        {/* Category filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>
        </div>

        {/* Grid */}
        {servers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold text-white mb-2">The registry is growing</p>
            <p className="text-sm text-gray-400 mb-6">
              New MCP servers are added daily. Meanwhile — create your own MCP server in 5 minutes
            </p>
            <a
              href="https://mcpify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Create on mcpify.app →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}

            {/* Publish CTA card */}
            <a
              href="https://mcpify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-teal-600 rounded-xl p-5 text-center transition-colors group min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-600 group-hover:border-teal-500 flex items-center justify-center mb-3 transition-colors">
                <span className="text-gray-500 group-hover:text-teal-400 text-xl transition-colors">+</span>
              </div>
              <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors mb-1">
                Publish your MCP server here
              </p>
              <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors mb-3">
                Built with mcpify.app
              </p>
              <span className="text-xs bg-teal-600/20 group-hover:bg-teal-600 text-teal-400 group-hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                Create your server →
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
