import Link from 'next/link'
import type { RegistryServer } from '@/lib/types'

interface ServerCardProps {
  server: RegistryServer
}

export function ServerCard({ server }: ServerCardProps) {
  return (
    <Link
      href={`/servers/${server.slug}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-500/50 hover:bg-gray-900/80 transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
          {server.logo_url ? (
            <img src={server.logo_url} alt={server.name} className="w-7 h-7 object-contain" />
          ) : (
            <span>{server.name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
              {server.name}
            </h3>
            {server.is_verified && (
              <span className="flex-shrink-0 bg-violet-500/20 text-violet-300 text-xs px-1.5 py-0.5 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 capitalize">{server.category}</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{server.description}</p>

      {server.tags && server.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {server.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>⬇ {server.install_count.toLocaleString()}</span>
          <span>★ {Number(server.rating_avg).toFixed(1)}</span>
        </div>
        <span
          className={
            server.pricing_type === 'free'
              ? 'text-green-400 font-medium'
              : 'text-amber-400 font-medium'
          }
        >
          {server.pricing_type === 'free'
            ? 'Free'
            : `$${((server.price_monthly ?? 0) / 100).toFixed(0)}/mo`}
        </span>
      </div>
    </Link>
  )
}
