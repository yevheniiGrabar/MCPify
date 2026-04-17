'use client'

import { useEffect, useRef, useState } from 'react'
import { ServerCard } from './ServerCard'
import type { RegistryServer } from '@/lib/types'

interface ServerGridProps {
  servers: RegistryServer[]
}

export function ServerGrid({ servers }: ServerGridProps) {
  const [visible, setVisible] = useState<boolean[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setVisible([])
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []

    const all = [...servers, null] // null = CTA card
    all.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisible((prev) => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * 60)
      timerRef.current.push(t)
    })

    return () => timerRef.current.forEach(clearTimeout)
  }, [servers])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers.map((server, i) => (
        <div
          key={server.id}
          className="transition-all duration-500"
          style={{
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <ServerCard server={server} />
        </div>
      ))}

      {/* CTA card */}
      <div
        className="transition-all duration-500"
        style={{
          opacity: visible[servers.length] ? 1 : 0,
          transform: visible[servers.length] ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <a
          href="https://mpcify.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-teal-600 rounded-xl p-5 text-center transition-colors group min-h-[200px] h-full"
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
    </div>
  )
}
