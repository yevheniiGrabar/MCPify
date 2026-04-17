import { Suspense } from 'react'
import { ServerCard } from '@/components/ServerCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import type { RegistryServer } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}

async function fetchServersSSR(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString()
  const url = `${API_URL}/registry/servers${query ? `?${query}` : ''}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data as RegistryServer[]) ?? []
  } catch {
    return []
  }
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
        {/* Category filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>
        </div>

        {/* Grid */}
        {servers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No servers found.</p>
            <p className="text-sm mt-2">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
