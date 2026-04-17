import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ServerCard } from '@/components/ServerCard'
import { CATEGORIES } from '@/lib/categories'
import type { RegistryServer } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const cat = CATEGORIES.find((c) => c.slug === category)
  if (!cat) return { title: 'Category Not Found | MCP Registry' }
  return {
    title: `Best ${cat.label} MCP Servers for AI Agents | MCP Registry`,
    description: `Discover the best ${cat.label} MCP servers. ${cat.description}`,
  }
}

async function fetchByCategory(category: string): Promise<RegistryServer[]> {
  try {
    const res = await fetch(`${API_URL}/registry/servers?category=${category}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data as RegistryServer[]) ?? []
  } catch {
    return []
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params
  const cat = CATEGORIES.find((c) => c.slug === category)
  if (!cat) notFound()

  const servers = await fetchByCategory(category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-4xl mb-3">{cat.icon}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Best {cat.label} MCP Servers for AI Agents
        </h1>
        <p className="text-gray-400 text-lg">{cat.description}</p>
      </div>

      {servers.length === 0 ? (
        <p className="text-gray-500">No servers in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-3">What is MCP?</h2>
        <p className="text-gray-400 leading-relaxed">
          The Model Context Protocol (MCP) is an open standard that enables AI agents like Claude,
          ChatGPT, and Cursor to connect to external services and tools. MCP servers expose APIs and
          data sources in a way that AI models can understand and use, enabling powerful automation
          workflows without custom integrations.
        </p>
      </div>
    </div>
  )
}
