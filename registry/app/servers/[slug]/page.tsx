import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ConnectInstructions } from '@/components/ConnectInstructions'
import type { RegistryServer } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

async function getServer(slug: string): Promise<RegistryServer | null> {
  try {
    const res = await fetch(`${API_URL}/registry/servers/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.data as RegistryServer) ?? null
  } catch {
    return null
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const server = await getServer(slug)
  if (!server) return { title: 'Server Not Found | MCP Registry' }
  return {
    title: `${server.name} | MCP Registry`,
    description: server.description,
  }
}

export default async function ServerPage({ params }: PageProps) {
  const { slug } = await params
  const server = await getServer(slug)
  if (!server) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {server.logo_url ? (
            <img src={server.logo_url} alt={server.name} className="w-12 h-12 object-contain" />
          ) : (
            <span>{server.name[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{server.name}</h1>
            {server.is_verified && (
              <span className="bg-violet-500/20 text-violet-300 text-sm px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="capitalize">{server.category}</span>
            <span>⬇ {server.install_count.toLocaleString()} installs</span>
            <span>★ {Number(server.rating_avg).toFixed(1)}</span>
            <span>v{server.version}</span>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-lg font-semibold ${
              server.pricing_type === 'free' ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {server.pricing_type === 'free'
              ? 'Free'
              : `$${((server.price_monthly ?? 0) / 100).toFixed(0)}/mo`}
          </div>
        </div>
      </div>

      <p className="text-gray-300 text-lg mb-8">{server.description}</p>

      {server.tags && server.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {server.tags.map((tag) => (
            <span key={tag} className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-8">
        <ConnectInstructions server={server} />
      </div>

      <div className="flex gap-4">
        {server.github_url && (
          <a
            href={server.github_url}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub →
          </a>
        )}
        {server.docs_url && (
          <a
            href={server.docs_url}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation →
          </a>
        )}
      </div>
    </div>
  )
}
